import { ethers } from "ethers";
import { db } from "../storage/store";
import { AuditRecordModel } from "../types";

export class AuditService {
  /**
   * Deterministically calculates the canonical keccak256 hash for a trade record.
   * Exactly matches the on-chain computeCanonicalHash function in AuditLog.sol!
   */
  computeCanonicalHash(record: {
    recordId: number;
    tradeId: string;
    buyOrderId: number | string;
    sellOrderId: number | string;
    symbol: string;
    price: number | bigint;
    quantity: number | bigint;
    buyer: string;
    seller: string;
    timestamp: number;
    previousHash: string;
  }): string {
    // Normalise to 18 decimal fixed units if passed as floating number
    const priceWei = typeof record.price === "bigint" ? record.price : ethers.parseEther(record.price.toFixed(6));
    const qtyWei = typeof record.quantity === "bigint" ? record.quantity : ethers.parseEther(record.quantity.toFixed(6));

    const buyId = typeof record.buyOrderId === "number" || /^\d+$/.test(record.buyOrderId.toString())
      ? BigInt(record.buyOrderId)
      : BigInt(ethers.keccak256(ethers.toUtf8Bytes(record.buyOrderId.toString())).slice(0, 18));

    const sellId = typeof record.sellOrderId === "number" || /^\d+$/.test(record.sellOrderId.toString())
      ? BigInt(record.sellOrderId)
      : BigInt(ethers.keccak256(ethers.toUtf8Bytes(record.sellOrderId.toString())).slice(0, 18));

    const tradeIdBytes32 = record.tradeId.startsWith("0x") && record.tradeId.length === 66
      ? record.tradeId
      : ethers.keccak256(ethers.toUtf8Bytes(record.tradeId));

    const prevHashBytes = record.previousHash.startsWith("0x") && record.previousHash.length === 66
      ? record.previousHash
      : ethers.ZeroHash;

    const encoded = ethers.solidityPacked(
      [
        "uint256",
        "bytes32",
        "uint256",
        "uint256",
        "string",
        "uint256",
        "uint256",
        "address",
        "address",
        "uint256",
        "bytes32",
      ],
      [
        BigInt(record.recordId),
        tradeIdBytes32,
        buyId,
        sellId,
        record.symbol,
        priceWei,
        qtyWei,
        record.buyer,
        record.seller,
        BigInt(record.timestamp),
        prevHashBytes,
      ]
    );

    return ethers.keccak256(encoded);
  }

  /**
   * Verifies an individual audit record's hash.
   */
  verifyRecord(recordId: number): {
    isValid: boolean;
    storedHash: string;
    recomputedHash: string;
    isTampered: boolean;
  } {
    const record = db.getAuditRecord(recordId);
    if (!record) {
      throw new Error(`Audit record ${recordId} not found`);
    }

    const recomputed = this.computeCanonicalHash({
      recordId: record.recordId,
      tradeId: record.tradeId,
      buyOrderId: record.buyOrderId,
      sellOrderId: record.sellOrderId,
      symbol: record.symbol,
      price: record.price,
      quantity: record.quantity,
      buyer: record.buyerAddress,
      seller: record.sellerAddress,
      timestamp: record.timestamp,
      previousHash: record.previousHash,
    });

    const isValid = recomputed.toLowerCase() === record.canonicalHash.toLowerCase();
    return {
      isValid,
      storedHash: record.canonicalHash,
      recomputedHash: recomputed,
      isTampered: !isValid || !!record.isTampered,
    };
  }

  /**
   * Validates cryptographic chaining across all records in the audit log.
   */
  verifyChainIntegrity(): {
    isIntact: boolean;
    totalRecords: number;
    brokenAtRecordId?: number;
    reason?: string;
  } {
    const records = db.getAllAuditRecords();
    if (records.length === 0) {
      return { isIntact: true, totalRecords: 0 };
    }

    for (let i = 0; i < records.length; i++) {
      const curr = records[i];

      // 1. Verify internal canonical hash
      const recomputed = this.computeCanonicalHash({
        recordId: curr.recordId,
        tradeId: curr.tradeId,
        buyOrderId: curr.buyOrderId,
        sellOrderId: curr.sellOrderId,
        symbol: curr.symbol,
        price: curr.price,
        quantity: curr.quantity,
        buyer: curr.buyerAddress,
        seller: curr.sellerAddress,
        timestamp: curr.timestamp,
        previousHash: curr.previousHash,
      });

      if (recomputed.toLowerCase() !== curr.canonicalHash.toLowerCase() || curr.isTampered) {
        return {
          isIntact: false,
          totalRecords: records.length,
          brokenAtRecordId: curr.recordId,
          reason: `Record #${curr.recordId} has invalid canonical hash. Data has been modified.`,
        };
      }

      // 2. Verify backward link to previous record
      if (i > 0) {
        const prev = records[i - 1];
        if (curr.previousHash.toLowerCase() !== prev.canonicalHash.toLowerCase()) {
          return {
            isIntact: false,
            totalRecords: records.length,
            brokenAtRecordId: curr.recordId,
            reason: `Chain broken at Record #${curr.recordId}: previousHash does not match Record #${prev.recordId} canonicalHash.`,
          };
        }
      }
    }

    return { isIntact: true, totalRecords: records.length };
  }

  /**
   * Builds an off-chain Merkle Tree from all current trade canonical hashes.
   */
  generateMerkleTree(): {
    root: string;
    leaves: string[];
    recordCount: number;
  } {
    const records = db.getAllAuditRecords();
    if (records.length === 0) {
      return { root: ethers.ZeroHash, leaves: [], recordCount: 0 };
    }

    let leaves = records.map((r) => r.canonicalHash);

    // Compute simple binary Merkle tree
    let level = leaves;
    while (level.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          const combined = ethers.solidityPacked(
            ["bytes32", "bytes32"],
            [level[i], level[i + 1]]
          );
          nextLevel.push(ethers.keccak256(combined));
        } else {
          // Odd leaf, promote to next level
          nextLevel.push(level[i]);
        }
      }
      level = nextLevel;
    }

    return {
      root: level[0],
      leaves,
      recordCount: records.length,
    };
  }

  /**
   * Intentionally tampers with a local audit record to demonstrate tamper detection in academic evaluation.
   */
  simulateRecordTampering(recordId: number, fakePrice?: number, fakeQty?: number): AuditRecordModel {
    const record = db.getAuditRecord(recordId);
    if (!record) {
      throw new Error(`Record ${recordId} not found`);
    }

    const tamperedRecord: AuditRecordModel = {
      ...record,
      price: fakePrice ?? record.price + 50.0,
      quantity: fakeQty ?? record.quantity * 2,
      isTampered: true,
      tamperedFields: {
        originalPrice: record.price,
        originalQuantity: record.quantity,
        tamperedAt: new Date().toISOString(),
      },
    };

    db.saveAuditRecord(tamperedRecord);
    return tamperedRecord;
  }

  /**
   * Restores a tampered record back to original integrity.
   */
  restoreRecord(recordId: number): AuditRecordModel {
    const record = db.getAuditRecord(recordId);
    if (!record || !record.isTampered) {
      return record!;
    }

    const restored: AuditRecordModel = {
      ...record,
      price: record.tamperedFields?.originalPrice ?? record.price,
      quantity: record.tamperedFields?.originalQuantity ?? record.quantity,
      isTampered: false,
      tamperedFields: undefined,
    };

    db.saveAuditRecord(restored);
    return restored;
  }
}

export const auditService = new AuditService();
