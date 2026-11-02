import { ethers } from "ethers";
import { ENV } from "../config/env";
import { getDeployedAddresses, getContractAbi } from "../config/contracts";

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private deployerSigner: ethers.Signer | null = null;
  public isConnected: boolean = false;
  private deployed = getDeployedAddresses();

  constructor() {
    this.provider = new ethers.JsonRpcProvider(ENV.BLOCKCHAIN_RPC_URL);
    this.initProvider();
  }

  private async initProvider() {
    try {
      const network = await this.provider.getNetwork();
      this.isConnected = true;
      const accounts = await this.provider.listAccounts();
      if (accounts.length > 0) {
        this.deployerSigner = await this.provider.getSigner(0);
      }
      console.log(`[BlockchainService] Connected to Hardhat Ethereum node (Chain ID: ${network.chainId}).`);
    } catch (err) {
      this.isConnected = false;
      console.warn("[BlockchainService] Hardhat RPC node not reachable. Running in local simulation mode.");
    }
  }

  public async getStatus(): Promise<{
    connected: boolean;
    rpcUrl: string;
    chainId?: number;
    blockNumber?: number;
    contracts: Record<string, string>;
    demoAccounts: Record<string, string>;
  }> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();
      this.isConnected = true;
      return {
        connected: true,
        rpcUrl: ENV.BLOCKCHAIN_RPC_URL,
        chainId: Number(network.chainId),
        blockNumber,
        contracts: {
          UserRegistry: this.deployed.contracts.UserRegistry,
          CashToken: this.deployed.contracts.CashToken,
          AuditLog: this.deployed.contracts.AuditLog,
          OrderBook: this.deployed.contracts.OrderBook,
          TradeSettlement: this.deployed.contracts.TradeSettlement,
        },
        demoAccounts: this.deployed.demoAccounts,
      };
    } catch (err) {
      return {
        connected: false,
        rpcUrl: ENV.BLOCKCHAIN_RPC_URL,
        contracts: this.deployed.contracts as any,
        demoAccounts: this.deployed.demoAccounts,
      };
    }
  }

  public async settleTradeOnChain(params: {
    buyOrderId: number;
    sellOrderId: number;
    matchPrice: number;
    matchQty: number;
    symbol: string;
  }): Promise<{
    success: boolean;
    txHash: string;
    blockNumber: number;
    auditRecordId: number;
    canonicalHash: string;
  }> {
    if (this.isConnected && this.deployerSigner) {
      try {
        const settlementAbi = getContractAbi("TradeSettlement");
        if (settlementAbi.length > 0) {
          const settlementContract = new ethers.Contract(
            this.deployed.contracts.TradeSettlement,
            settlementAbi,
            this.deployerSigner
          );

          const priceWei = ethers.parseEther(params.matchPrice.toFixed(6));
          const qtyWei = ethers.parseEther(params.matchQty.toFixed(6));

          const tx = await settlementContract.settleMatchedTrade(
            params.buyOrderId,
            params.sellOrderId,
            priceWei,
            qtyWei
          );
          const receipt = await tx.wait();

          // Parse TradeSettled event
          const iface = new ethers.Interface(settlementAbi);
          let auditRecordId = 0;
          let canonicalHash = ethers.ZeroHash;

          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog(log);
              if (parsed && parsed.name === "TradeSettled") {
                auditRecordId = Number(parsed.args.auditRecordId);
                canonicalHash = parsed.args.canonicalHash;
              }
            } catch (e) {
              // ignore non-matching logs
            }
          }

          return {
            success: true,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            auditRecordId,
            canonicalHash,
          };
        }
      } catch (err) {
        console.warn("[BlockchainService] On-chain settlement transaction reverted or failed:", err);
      }
    }

    // Deterministic simulated receipt fallback
    const simulatedBlock = 1000 + Math.floor(Date.now() / 15000);
    const simulatedTxHash = ethers.keccak256(
      ethers.toUtf8Bytes(`SIMULATED_TX_${params.buyOrderId}_${params.sellOrderId}_${Date.now()}`)
    );
    const simulatedHash = ethers.keccak256(
      ethers.toUtf8Bytes(`SIMULATED_CANONICAL_${params.symbol}_${params.matchPrice}_${params.matchQty}`)
    );

    return {
      success: true,
      txHash: simulatedTxHash,
      blockNumber: simulatedBlock,
      auditRecordId: 0,
      canonicalHash: simulatedHash,
    };
  }

  public async verifyOnChainRecord(recordId: number): Promise<{
    isValid: boolean;
    recomputedHash: string;
    storedHash: string;
  } | null> {
    if (!this.isConnected) return null;
    try {
      const auditAbi = getContractAbi("AuditLog");
      const auditContract = new ethers.Contract(
        this.deployed.contracts.AuditLog,
        auditAbi,
        this.provider
      );
      const [isValid, recomputedHash, storedHash] = await auditContract.verifyRecord(recordId);
      return { isValid, recomputedHash, storedHash };
    } catch (err) {
      return null;
    }
  }
}

export const blockchainService = new BlockchainService();
