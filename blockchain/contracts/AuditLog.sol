// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title AuditLog
 * @notice Cryptographically chained tamper-evident audit ledger and Merkle root verification.
 * @dev Distinguishes between Ethereum block layer and application-level trade event audit chain.
 */
contract AuditLog is Ownable {
    struct AuditRecord {
        uint256 recordId;
        bytes32 tradeId;
        uint256 buyOrderId;
        uint256 sellOrderId;
        string symbol;
        uint256 price;       // in simulated USD units (18 decimals)
        uint256 quantity;    // in stock token units (18 decimals)
        address buyer;
        address seller;
        uint256 timestamp;
        bytes32 previousHash;
        bytes32 canonicalHash;
    }

    struct MerkleBatch {
        uint256 batchId;
        bytes32 merkleRoot;
        uint256 startRecordId;
        uint256 endRecordId;
        uint256 recordCount;
        uint256 timestamp;
        address submittedBy;
    }

    mapping(address => bool) public authorizedLoggers;
    AuditRecord[] private _auditRecords;
    MerkleBatch[] private _merkleBatches;

    event TradeRecorded(
        uint256 indexed recordId,
        bytes32 indexed tradeId,
        string symbol,
        uint256 price,
        uint256 quantity,
        bytes32 canonicalHash,
        bytes32 previousHash
    );

    event MerkleBatchSubmitted(
        uint256 indexed batchId,
        bytes32 indexed merkleRoot,
        uint256 startRecordId,
        uint256 endRecordId,
        uint256 recordCount
    );

    event LoggerUpdated(address indexed logger, bool isAuthorized);

    modifier onlyLogger() {
        require(msg.sender == owner() || authorizedLoggers[msg.sender], "AuditLog: unauthorized logger");
        _;
    }

    constructor() Ownable() {}

    function setAuthorizedLogger(address logger, bool isAuthorized) external onlyOwner {
        authorizedLoggers[logger] = isAuthorized;
        emit LoggerUpdated(logger, isAuthorized);
    }

    /**
     * @notice Computes canonical keccak256 hash for a trade record.
     */
    function computeCanonicalHash(
        uint256 recordId,
        bytes32 tradeId,
        uint256 buyOrderId,
        uint256 sellOrderId,
        string memory symbol,
        uint256 price,
        uint256 quantity,
        address buyer,
        address seller,
        uint256 timestamp,
        bytes32 previousHash
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encodePacked(
                recordId,
                tradeId,
                buyOrderId,
                sellOrderId,
                symbol,
                price,
                quantity,
                buyer,
                seller,
                timestamp,
                previousHash
            )
        );
    }

    /**
     * @notice Appends a newly settled trade into the immutable, cryptographically chained audit log.
     */
    function recordTrade(
        bytes32 tradeId,
        uint256 buyOrderId,
        uint256 sellOrderId,
        string calldata symbol,
        uint256 price,
        uint256 quantity,
        address buyer,
        address seller
    ) external onlyLogger returns (uint256 recordId, bytes32 canonicalHash) {
        recordId = _auditRecords.length;
        bytes32 prevHash = bytes32(0);
        if (recordId > 0) {
            prevHash = _auditRecords[recordId - 1].canonicalHash;
        }

        uint256 currentTime = block.timestamp;

        canonicalHash = computeCanonicalHash(
            recordId,
            tradeId,
            buyOrderId,
            sellOrderId,
            symbol,
            price,
            quantity,
            buyer,
            seller,
            currentTime,
            prevHash
        );

        AuditRecord memory record = AuditRecord({
            recordId: recordId,
            tradeId: tradeId,
            buyOrderId: buyOrderId,
            sellOrderId: sellOrderId,
            symbol: symbol,
            price: price,
            quantity: quantity,
            buyer: buyer,
            seller: seller,
            timestamp: currentTime,
            previousHash: prevHash,
            canonicalHash: canonicalHash
        });

        _auditRecords.push(record);

        emit TradeRecorded(
            recordId,
            tradeId,
            symbol,
            price,
            quantity,
            canonicalHash,
            prevHash
        );

        return (recordId, canonicalHash);
    }

    /**
     * @notice Submit a Merkle root batch for checkpointing off-chain audit trees.
     */
    function submitMerkleBatch(
        bytes32 merkleRoot,
        uint256 startRecordId,
        uint256 endRecordId
    ) external onlyLogger returns (uint256 batchId) {
        require(endRecordId >= startRecordId, "AuditLog: invalid record range");
        require(endRecordId < _auditRecords.length, "AuditLog: endRecordId out of bounds");

        batchId = _merkleBatches.length;
        uint256 count = (endRecordId - startRecordId) + 1;

        _merkleBatches.push(
            MerkleBatch({
                batchId: batchId,
                merkleRoot: merkleRoot,
                startRecordId: startRecordId,
                endRecordId: endRecordId,
                recordCount: count,
                timestamp: block.timestamp,
                submittedBy: msg.sender
            })
        );

        emit MerkleBatchSubmitted(batchId, merkleRoot, startRecordId, endRecordId, count);
        return batchId;
    }

    /**
     * @notice Verifies an individual record's hash validity.
     */
    function verifyRecord(uint256 recordId)
        external
        view
        returns (
            bool isValid,
            bytes32 recomputedHash,
            bytes32 storedHash
        )
    {
        require(recordId < _auditRecords.length, "AuditLog: record does not exist");
        AuditRecord memory rec = _auditRecords[recordId];

        recomputedHash = computeCanonicalHash(
            rec.recordId,
            rec.tradeId,
            rec.buyOrderId,
            rec.sellOrderId,
            rec.symbol,
            rec.price,
            rec.quantity,
            rec.buyer,
            rec.seller,
            rec.timestamp,
            rec.previousHash
        );

        storedHash = rec.canonicalHash;
        isValid = (recomputedHash == storedHash);
        return (isValid, recomputedHash, storedHash);
    }

    /**
     * @notice Validates cryptographic chain integrity across a sequential range of records.
     */
    function verifyChainIntegrity(uint256 startIndex, uint256 endIndex)
        external
        view
        returns (bool isIntact, uint256 brokenAtRecordId)
    {
        require(endIndex < _auditRecords.length, "AuditLog: endIndex out of bounds");
        require(startIndex <= endIndex, "AuditLog: invalid range");

        for (uint256 i = startIndex; i <= endIndex; i++) {
            AuditRecord memory curr = _auditRecords[i];
            bytes32 recomputed = computeCanonicalHash(
                curr.recordId,
                curr.tradeId,
                curr.buyOrderId,
                curr.sellOrderId,
                curr.symbol,
                curr.price,
                curr.quantity,
                curr.buyer,
                curr.seller,
                curr.timestamp,
                curr.previousHash
            );

            if (recomputed != curr.canonicalHash) {
                return (false, i);
            }

            if (i > startIndex) {
                AuditRecord memory prev = _auditRecords[i - 1];
                if (curr.previousHash != prev.canonicalHash) {
                    return (false, i);
                }
            }
        }

        return (true, 0);
    }

    /**
     * @notice Verifies a Merkle proof against a stored Merkle root batch.
     */
    function verifyProof(
        uint256 batchId,
        bytes32 leaf,
        bytes32[] calldata proof
    ) external view returns (bool) {
        require(batchId < _merkleBatches.length, "AuditLog: batch does not exist");
        bytes32 root = _merkleBatches[batchId].merkleRoot;
        return MerkleProof.verify(proof, root, leaf);
    }

    function getRecord(uint256 recordId) external view returns (AuditRecord memory) {
        require(recordId < _auditRecords.length, "AuditLog: record out of bounds");
        return _auditRecords[recordId];
    }

    function getTotalRecords() external view returns (uint256) {
        return _auditRecords.length;
    }

    function getTotalBatches() external view returns (uint256) {
        return _merkleBatches.length;
    }

    function getBatch(uint256 batchId) external view returns (MerkleBatch memory) {
        require(batchId < _merkleBatches.length, "AuditLog: batch out of bounds");
        return _merkleBatches[batchId];
    }
}
