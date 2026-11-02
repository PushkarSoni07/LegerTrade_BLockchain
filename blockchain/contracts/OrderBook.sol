// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./UserRegistry.sol";

/**
 * @title OrderBook
 * @notice Maintains order states, price-time priority validation, and active trading orders.
 */
contract OrderBook is Ownable {
    enum Side { BUY, SELL }
    enum OrderType { MARKET, LIMIT }
    enum OrderStatus { OPEN, PARTIALLY_FILLED, FILLED, CANCELLED }

    struct Order {
        uint256 id;
        address trader;
        string symbol;
        Side side;
        OrderType orderType;
        uint256 price;       // 18 decimals, fixed point USD
        uint256 quantity;    // 18 decimals, share units
        uint256 filledQty;   // 18 decimals, filled units
        uint256 timestamp;
        OrderStatus status;
    }

    UserRegistry public immutable userRegistry;
    address public settlementContract;

    Order[] private _orders;
    mapping(address => uint256[]) private _traderOrderIds;
    mapping(string => uint256[]) private _symbolOrderIds;

    event OrderCreated(
        uint256 indexed id,
        address indexed trader,
        string symbol,
        Side side,
        OrderType orderType,
        uint256 price,
        uint256 quantity,
        uint256 timestamp
    );

    event OrderCancelled(uint256 indexed id, address indexed trader);
    event OrderStatusUpdated(uint256 indexed id, OrderStatus newStatus, uint256 filledQty);
    event SettlementContractUpdated(address indexed settlementContract);

    modifier onlySettlementOrOwner() {
        require(msg.sender == settlementContract || msg.sender == owner(), "OrderBook: unauthorized caller");
        _;
    }

    constructor(address _userRegistry) Ownable() {
        require(_userRegistry != address(0), "OrderBook: invalid userRegistry");
        userRegistry = UserRegistry(_userRegistry);
    }

    function setSettlementContract(address _settlementContract) external onlyOwner {
        require(_settlementContract != address(0), "OrderBook: invalid address");
        settlementContract = _settlementContract;
        emit SettlementContractUpdated(_settlementContract);
    }

    /**
     * @notice Place an order into the order book.
     */
    function createOrder(
        string calldata symbol,
        Side side,
        OrderType orderType,
        uint256 price,
        uint256 quantity
    ) external returns (uint256 orderId) {
        require(userRegistry.isKycApproved(msg.sender), "OrderBook: trader must have approved KYC");
        require(bytes(symbol).length > 0, "OrderBook: symbol required");
        require(quantity > 0, "OrderBook: quantity must be greater than zero");
        if (orderType == OrderType.LIMIT) {
            require(price > 0, "OrderBook: limit price must be positive");
        }

        orderId = _orders.length;

        Order memory newOrder = Order({
            id: orderId,
            trader: msg.sender,
            symbol: symbol,
            side: side,
            orderType: orderType,
            price: price,
            quantity: quantity,
            filledQty: 0,
            timestamp: block.timestamp,
            status: OrderStatus.OPEN
        });

        _orders.push(newOrder);
        _traderOrderIds[msg.sender].push(orderId);
        _symbolOrderIds[symbol].push(orderId);

        emit OrderCreated(
            orderId,
            msg.sender,
            symbol,
            side,
            orderType,
            price,
            quantity,
            block.timestamp
        );

        return orderId;
    }

    /**
     * @notice Cancel an open or partially filled order.
     */
    function cancelOrder(uint256 orderId) external {
        require(orderId < _orders.length, "OrderBook: order does not exist");
        Order storage order = _orders[orderId];
        require(order.trader == msg.sender || msg.sender == owner(), "OrderBook: only order owner can cancel");
        require(
            order.status == OrderStatus.OPEN || order.status == OrderStatus.PARTIALLY_FILLED,
            "OrderBook: order cannot be cancelled"
        );

        order.status = OrderStatus.CANCELLED;
        emit OrderCancelled(orderId, msg.sender);
        emit OrderStatusUpdated(orderId, OrderStatus.CANCELLED, order.filledQty);
    }

    /**
     * @notice Called strictly by authorized TradeSettlement to record fills.
     */
    function recordFill(uint256 orderId, uint256 fillQty) external onlySettlementOrOwner {
        require(orderId < _orders.length, "OrderBook: order does not exist");
        Order storage order = _orders[orderId];
        require(
            order.status == OrderStatus.OPEN || order.status == OrderStatus.PARTIALLY_FILLED,
            "OrderBook: order not active"
        );
        require(order.filledQty + fillQty <= order.quantity, "OrderBook: fill exceeds order quantity");

        order.filledQty += fillQty;
        if (order.filledQty == order.quantity) {
            order.status = OrderStatus.FILLED;
        } else {
            order.status = OrderStatus.PARTIALLY_FILLED;
        }

        emit OrderStatusUpdated(orderId, order.status, order.filledQty);
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        require(orderId < _orders.length, "OrderBook: order does not exist");
        return _orders[orderId];
    }

    function getTotalOrders() external view returns (uint256) {
        return _orders.length;
    }

    function getTraderOrderIds(address trader) external view returns (uint256[] memory) {
        return _traderOrderIds[trader];
    }

    function getSymbolOrderIds(string calldata symbol) external view returns (uint256[] memory) {
        return _symbolOrderIds[symbol];
    }
}
