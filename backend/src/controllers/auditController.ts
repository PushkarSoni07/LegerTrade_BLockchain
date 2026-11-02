import { Request, Response } from "express";
import { db } from "../storage/store";
import { auditService } from "../services/auditService";
import { blockchainService } from "../services/blockchainService";

export const auditController = {
  getRecords(req: Request, res: Response) {
    const { symbol, tradeId, wallet } = req.query;
    let records = db.getAllAuditRecords();

    if (symbol) {
      records = records.filter((r) => r.symbol.toUpperCase() === (symbol as string).toUpperCase());
    }
    if (tradeId) {
      records = records.filter((r) => r.tradeId.toLowerCase().includes((tradeId as string).toLowerCase()));
    }
    if (wallet) {
      const w = (wallet as string).toLowerCase();
      records = records.filter((r) => r.buyerAddress.toLowerCase() === w || r.sellerAddress.toLowerCase() === w);
    }

    return res.json({
      total: records.length,
      records,
    });
  },

  async verifyRecord(req: Request, res: Response) {
    try {
      const recordId = parseInt(req.params.recordId, 10);
      const localResult = auditService.verifyRecord(recordId);

      // Also check on-chain if connected
      const onChainResult = await blockchainService.verifyOnChainRecord(recordId);

      return res.json({
        recordId,
        isTampered: localResult.isTampered,
        localVerification: {
          isValid: localResult.isValid,
          storedHash: localResult.storedHash,
          recomputedHash: localResult.recomputedHash,
        },
        onChainVerification: onChainResult
          ? {
              confirmedOnChain: true,
              matchesLocal: onChainResult.storedHash.toLowerCase() === localResult.storedHash.toLowerCase(),
              onChainStoredHash: onChainResult.storedHash,
            }
          : {
              confirmedOnChain: false,
              note: "Local simulation mode or record not yet included in Hardhat block",
            },
      });
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  },

  verifyChain(req: Request, res: Response) {
    const chainStatus = auditService.verifyChainIntegrity();
    return res.json({
      status: chainStatus.isIntact ? "INTACT" : "COMPROMISED",
      ...chainStatus,
      verifiedAt: new Date().toISOString(),
    });
  },

  getMerkleCheckpoint(req: Request, res: Response) {
    const tree = auditService.generateMerkleTree();
    return res.json({
      merkleRoot: tree.root,
      leavesCount: tree.recordCount,
      leaves: tree.leaves,
      timestamp: new Date().toISOString(),
    });
  },

  tamperRecord(req: Request, res: Response) {
    const recordId = parseInt(req.params.recordId, 10);
    const { fakePrice, fakeQty } = req.body;
    try {
      const tampered = auditService.simulateRecordTampering(recordId, fakePrice, fakeQty);
      return res.json({
        message: `ACADEMIC DEMO: Record #${recordId} has been deliberately altered. Re-run hash verification to observe detection!`,
        tamperedRecord: tampered,
      });
    } catch (err: any) {
      return res.status(404).json({ error: err.message });
    }
  },

  restoreRecord(req: Request, res: Response) {
    const recordId = parseInt(req.params.recordId, 10);
    const restored = auditService.restoreRecord(recordId);
    return res.json({
      message: `Record #${recordId} restored to authentic state.`,
      record: restored,
    });
  },

  exportAuditReport(req: Request, res: Response) {
    const { format } = req.query;
    const records = db.getAllAuditRecords();

    if (format === "csv") {
      const header = "RecordId,TradeId,Symbol,Price,Quantity,Buyer,Seller,Timestamp,PreviousHash,CanonicalHash,IsTampered\n";
      const rows = records
        .map(
          (r) =>
            `${r.recordId},${r.tradeId},${r.symbol},${r.price},${r.quantity},${r.buyerAddress},${r.sellerAddress},${r.timestamp},${r.previousHash},${r.canonicalHash},${r.isTampered ? "TAMPERED" : "VALID"}`
        )
        .join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=ledgertrade_audit_trail.csv");
      return res.send(header + rows);
    }

    return res.json({
      generatedAt: new Date().toISOString(),
      recordCount: records.length,
      records,
    });
  },
};
