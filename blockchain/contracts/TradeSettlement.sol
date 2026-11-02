// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./UserRegistry.sol";
import "./CashToken.sol";
import "./StockToken.sol";
import "./OrderBook.sol";
import "./AuditLog.sol";

/**
 * @title TradeSettlement
 * @notice Executes atomic Delivery-versus-Payment (DvP) settlement between matched orders.
 * @dev Enforces independent on-chain validation of counter-orders, balance solvency,
 *      price-time priority criteria, and immutable audit recording.
 */
contract TradeSettlement is Ownable, ReentrancyGuard {
    UserRegistry public immutable userRegistry;
    CashToken public immutable cashToken;
    OrderBook public immutable orderBook;
    AuditLog public immutable auditLog;

    mapping(string => address) public stockTokens;
    mapping(address => bool) public authorizedBrokers;

    event StockTokenRegistered(string indexed symbol, address indexed tokenAddress);
    event BrokerUpdated(address indexed broker, bool isAuthorized);
    event TradeSettled(
        bytes32 indexed tradeId,
        uint256 indexed buyOrderId,
        uint256 indexed sellOrderId,
        string symbol,
        uint256 matchPrice,
        uint256 matchQty,
        uint256 totalCost,
        address buyer,
        address seller,
        uint256 auditRecordId,
        bytes32 canonicalHash,
        uint256 timestamp
    );

    modifier onlyBrokerOrOwner() {
        require(msg.sender == owner() || authorizedBrokers[msg.sender], "TradeSettlement: unauthorized caller");
        _;
    }

    constructor(
        address _userRegistry,
        address _cashToken,
        address _orderBook,
        address _auditLog
    ) Ownable() {
        require(_userRegistry != address(0), "Invalid userRegistry");
        require(_cashToken != address(0), "Invalid cashToken");
        require(_orderBook != address(0), "Invalid orderBook");
        require(_auditLog != address(0), "Invalid auditLog");

        userRegistry = UserRegistry(_userRegistry);
        cashToken = CashToken(_cashToken);
        orderBook = OrderBook(_orderBook);
        auditLog = AuditLog(_auditLog);
    }

    function registerStockToken(string calldata symbol, address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "TradeSettlement: invalid token address");
        stockTokens[symbol] = tokenAddress;
        emit StockTokenRegistered(symbol, tokenAddress);
    }

    function setAuthorizedBroker(address broker, bool isAuthorized) external onlyOwner {
        authorizedBrokers[broker] = isAuthorized;
        emit BrokerUpdated(broker, isAuthorized);
    }

    /**
     * @notice Performs atomic Delivery-versus-Payment (DvP) trade settlement.
     * @param buyOrderId Index of buy order in OrderBook
     * @param sellOrderId Index of sell order in OrderBook
     * @param matchPrice Execution price in 18 decimal fixed units
     * @param matchQty Execution quantity in 18 decimal share units
     */
    function settleMatchedTrade(
        uint256 buyOrderId,
        uint256 sellOrderId,
        uint256 matchPrice,
        uint256 matchQty
    ) external nonReentrant onlyBrokerOrOwner returns (bytes32 tradeId, uint256 auditRecordId) {
        require(matchQty > 0, "TradeSettlement: matchQty must be positive");
        require(matchPrice > 0, "TradeSettlement: matchPrice must be positive");

        OrderBook.Order memory buyOrder = orderBook.getOrder(buyOrderId);
        OrderBook.Order memory sellOrder = orderBook.getOrder(sellOrderId);

        // 1. Validate sides
        require(buyOrder.side == OrderBook.Side.BUY, "TradeSettlement: buyOrderId is not a BUY order");
        require(sellOrder.side == OrderBook.Side.SELL, "TradeSettlement: sellOrderId is not a SELL order");

        // 2. Validate symbol match
        require(
            keccak256(bytes(buyOrder.symbol)) == keccak256(bytes(sellOrder.symbol)),
            "TradeSettlement: symbol mismatch"
        );

        address stockAddress = stockTokens[buyOrder.symbol];
        require(stockAddress != address(0), "TradeSettlement: stock symbol not registered");

        // 3. Validate participant KYC status
        require(userRegistry.isKycApproved(buyOrder.trader), "TradeSettlement: buyer KYC not approved");
        require(userRegistry.isKycApproved(sellOrder.trader), "TradeSettlement: seller KYC not approved");

        // 4. Validate order statuses
        require(
            buyOrder.status == OrderBook.OrderStatus.OPEN || buyOrder.status == OrderBook.OrderStatus.PARTIALLY_FILLED,
            "TradeSettlement: buy order not fillable"
        );
        require(
            sellOrder.status == OrderBook.OrderStatus.OPEN || sellOrder.status == OrderBook.OrderStatus.PARTIALLY_FILLED,
            "TradeSettlement: sell order not fillable"
        );

        // 5. Validate fill quantities against unfilled amounts
        uint256 buyRemaining = buyOrder.quantity - buyOrder.filledQty;
        uint256 sellRemaining = sellOrder.quantity - sellOrder.filledQty;
        require(matchQty <= buyRemaining, "TradeSettlement: matchQty exceeds buy order remaining");
        require(matchQty <= sellRemaining, "TradeSettlement: matchQty exceeds sell order remaining");

        // 6. Validate price limits
        if (buyOrder.orderType == OrderBook.OrderType.LIMIT) {
            require(matchPrice <= buyOrder.price, "TradeSettlement: matchPrice exceeds buyer limit");
        }
        if (sellOrder.orderType == OrderBook.OrderType.LIMIT) {
            require(matchPrice >= sellOrder.price, "TradeSettlement: matchPrice below seller limit");
        }

        // 7. Calculate total cash required: (matchQty * matchPrice) / 1e18
        uint256 totalCost = (matchQty * matchPrice) / 1e18;
        require(totalCost > 0, "TradeSettlement: totalCost calculation underflow");

        // 8. Execute ATOMIC Delivery-versus-Payment (DvP)
        // Cash transfer from buyer to seller
        bool cashTransferred = cashToken.transferFrom(buyOrder.trader, sellOrder.trader, totalCost);
        require(cashTransferred, "TradeSettlement: cash transfer failed");

        // Stock token transfer from seller to buyer
        StockToken stockToken = StockToken(stockAddress);
        bool stockTransferred = stockToken.transferFrom(sellOrder.trader, buyOrder.trader, matchQty);
        require(stockTransferred, "TradeSettlement: stock token transfer failed");

        // 9. Update order fills in OrderBook
        orderBook.recordFill(buyOrderId, matchQty);
        orderBook.recordFill(sellOrderId, matchQty);

        // 10. Generate deterministic unique trade ID
        tradeId = keccak256(
            abi.encodePacked(
                buyOrderId,
                sellOrderId,
                buyOrder.trader,
                sellOrder.trader,
                matchPrice,
                matchQty,
                block.timestamp,
                block.number
            )
        );

        // 11. Record into chained AuditLog
        bytes32 canonicalHash;
        (auditRecordId, canonicalHash) = auditLog.recordTrade(
            tradeId,
            buyOrderId,
            sellOrderId,
            buyOrder.symbol,
            matchPrice,
            matchQty,
            buyOrder.trader,
            sellOrder.trader
        );

        emit TradeSettled(
            tradeId,
            buyOrderId,
            sellOrderId,
            buyOrder.symbol,
            matchPrice,
            matchQty,
            totalCost,
            buyOrder.trader,
            sellOrder.trader,
            auditRecordId,
            canonicalHash,
            block.timestamp
        );

        return (tradeId, auditRecordId);
    }
}
