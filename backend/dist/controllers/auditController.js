"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditController = void 0;
const store_1 = require("../storage/store");
const auditService_1 = require("../services/auditService");
const blockchainService_1 = require("../services/blockchainService");
exports.auditController = {
    getRecords(req, res) {
        const { symbol, tradeId, wallet } = req.query;
        let records = store_1.db.getAllAuditRecords();
        if (symbol) {
            records = records.filter((r) => r.symbol.toUpperCase() === symbol.toUpperCase());
        }
        if (tradeId) {
            records = records.filter((r) => r.tradeId.toLowerCase().includes(tradeId.toLowerCase()));
        }
        if (wallet) {
            const w = wallet.toLowerCase();
            records = records.filter((r) => r.buyerAddress.toLowerCase() === w || r.sellerAddress.toLowerCase() === w);
        }
        return res.json({
            total: records.length,
            records,
        });
    },
    async verifyRecord(req, res) {
        try {
            const recordId = parseInt(req.params.recordId, 10);
            const localResult = auditService_1.auditService.verifyRecord(recordId);
            // Also check on-chain if connected
            const onChainResult = await blockchainService_1.blockchainService.verifyOnChainRecord(recordId);
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
        }
        catch (err) {
            return res.status(404).json({ error: err.message });
        }
    },
    verifyChain(req, res) {
        const chainStatus = auditService_1.auditService.verifyChainIntegrity();
        return res.json({
            status: chainStatus.isIntact ? "INTACT" : "COMPROMISED",
            ...chainStatus,
            verifiedAt: new Date().toISOString(),
        });
    },
    getMerkleCheckpoint(req, res) {
        const tree = auditService_1.auditService.generateMerkleTree();
        return res.json({
            merkleRoot: tree.root,
            leavesCount: tree.recordCount,
            leaves: tree.leaves,
            timestamp: new Date().toISOString(),
        });
    },
    tamperRecord(req, res) {
        const recordId = parseInt(req.params.recordId, 10);
        const { fakePrice, fakeQty } = req.body;
        try {
            const tampered = auditService_1.auditService.simulateRecordTampering(recordId, fakePrice, fakeQty);
            return res.json({
                message: `ACADEMIC DEMO: Record #${recordId} has been deliberately altered. Re-run hash verification to observe detection!`,
                tamperedRecord: tampered,
            });
        }
        catch (err) {
            return res.status(404).json({ error: err.message });
        }
    },
    restoreRecord(req, res) {
        const recordId = parseInt(req.params.recordId, 10);
        const restored = auditService_1.auditService.restoreRecord(recordId);
        return res.json({
            message: `Record #${recordId} restored to authentic state.`,
            record: restored,
        });
    },
    exportAuditReport(req, res) {
        const { format } = req.query;
        const records = store_1.db.getAllAuditRecords();
        if (format === "csv") {
            const header = "RecordId,TradeId,Symbol,Price,Quantity,Buyer,Seller,Timestamp,PreviousHash,CanonicalHash,IsTampered\n";
            const rows = records
                .map((r) => `${r.recordId},${r.tradeId},${r.symbol},${r.price},${r.quantity},${r.buyerAddress},${r.sellerAddress},${r.timestamp},${r.previousHash},${r.canonicalHash},${r.isTampered ? "TAMPERED" : "VALID"}`)
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
