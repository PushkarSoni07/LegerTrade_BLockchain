"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blockchainService = exports.BlockchainService = void 0;
const ethers_1 = require("ethers");
const env_1 = require("../config/env");
const contracts_1 = require("../config/contracts");
class BlockchainService {
    provider;
    deployerSigner = null;
    isConnected = false;
    deployed = (0, contracts_1.getDeployedAddresses)();
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(env_1.ENV.BLOCKCHAIN_RPC_URL);
        this.initProvider();
    }
    async initProvider() {
        try {
            const network = await this.provider.getNetwork();
            this.isConnected = true;
            const accounts = await this.provider.listAccounts();
            if (accounts.length > 0) {
                this.deployerSigner = await this.provider.getSigner(0);
            }
            console.log(`[BlockchainService] Connected to Hardhat Ethereum node (Chain ID: ${network.chainId}).`);
        }
        catch (err) {
            this.isConnected = false;
            console.warn("[BlockchainService] Hardhat RPC node not reachable. Running in local simulation mode.");
        }
    }
    async getStatus() {
        try {
            const blockNumber = await this.provider.getBlockNumber();
            const network = await this.provider.getNetwork();
            this.isConnected = true;
            return {
                connected: true,
                rpcUrl: env_1.ENV.BLOCKCHAIN_RPC_URL,
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
        }
        catch (err) {
            return {
                connected: false,
                rpcUrl: env_1.ENV.BLOCKCHAIN_RPC_URL,
                contracts: this.deployed.contracts,
                demoAccounts: this.deployed.demoAccounts,
            };
        }
    }
    async settleTradeOnChain(params) {
        if (this.isConnected && this.deployerSigner) {
            try {
                const settlementAbi = (0, contracts_1.getContractAbi)("TradeSettlement");
                if (settlementAbi.length > 0) {
                    const settlementContract = new ethers_1.ethers.Contract(this.deployed.contracts.TradeSettlement, settlementAbi, this.deployerSigner);
                    const priceWei = ethers_1.ethers.parseEther(params.matchPrice.toFixed(6));
                    const qtyWei = ethers_1.ethers.parseEther(params.matchQty.toFixed(6));
                    const tx = await settlementContract.settleMatchedTrade(params.buyOrderId, params.sellOrderId, priceWei, qtyWei);
                    const receipt = await tx.wait();
                    // Parse TradeSettled event
                    const iface = new ethers_1.ethers.Interface(settlementAbi);
                    let auditRecordId = 0;
                    let canonicalHash = ethers_1.ethers.ZeroHash;
                    for (const log of receipt.logs) {
                        try {
                            const parsed = iface.parseLog(log);
                            if (parsed && parsed.name === "TradeSettled") {
                                auditRecordId = Number(parsed.args.auditRecordId);
                                canonicalHash = parsed.args.canonicalHash;
                            }
                        }
                        catch (e) {
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
            }
            catch (err) {
                console.warn("[BlockchainService] On-chain settlement transaction reverted or failed:", err);
            }
        }
        // Deterministic simulated receipt fallback
        const simulatedBlock = 1000 + Math.floor(Date.now() / 15000);
        const simulatedTxHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`SIMULATED_TX_${params.buyOrderId}_${params.sellOrderId}_${Date.now()}`));
        const simulatedHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(`SIMULATED_CANONICAL_${params.symbol}_${params.matchPrice}_${params.matchQty}`));
        return {
            success: true,
            txHash: simulatedTxHash,
            blockNumber: simulatedBlock,
            auditRecordId: 0,
            canonicalHash: simulatedHash,
        };
    }
    async verifyOnChainRecord(recordId) {
        if (!this.isConnected)
            return null;
        try {
            const auditAbi = (0, contracts_1.getContractAbi)("AuditLog");
            const auditContract = new ethers_1.ethers.Contract(this.deployed.contracts.AuditLog, auditAbi, this.provider);
            const [isValid, recomputedHash, storedHash] = await auditContract.verifyRecord(recordId);
            return { isValid, recomputedHash, storedHash };
        }
        catch (err) {
            return null;
        }
    }
}
exports.BlockchainService = BlockchainService;
exports.blockchainService = new BlockchainService();
