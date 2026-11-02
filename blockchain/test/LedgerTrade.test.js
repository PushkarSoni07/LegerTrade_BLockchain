const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LedgerTrade Smart Contract Suite", function () {
  let deployer, broker, alice, bob, charlie, auditor, regulator;
  let userRegistry, cashToken, auditLog, orderBook, tradeSettlement;
  let stockAAPL, stockTSLA;

  const parse18 = (val) => ethers.parseEther(val.toString());
  const format18 = (val) => ethers.formatEther(val);

  beforeEach(async function () {
    [deployer, broker, alice, bob, charlie, auditor, regulator] = await ethers.getSigners();

    // 1. UserRegistry
    const UserRegistry = await ethers.getContractFactory("UserRegistry");
    userRegistry = await UserRegistry.deploy();
    await userRegistry.waitForDeployment();

    // 2. CashToken
    const CashToken = await ethers.getContractFactory("CashToken");
    cashToken = await CashToken.deploy();
    await cashToken.waitForDeployment();

    // 3. AuditLog
    const AuditLog = await ethers.getContractFactory("AuditLog");
    auditLog = await AuditLog.deploy();
    await auditLog.waitForDeployment();

    // 4. OrderBook
    const OrderBook = await ethers.getContractFactory("OrderBook");
    orderBook = await OrderBook.deploy(await userRegistry.getAddress());
    await orderBook.waitForDeployment();

    // 5. TradeSettlement
    const TradeSettlement = await ethers.getContractFactory("TradeSettlement");
    tradeSettlement = await TradeSettlement.deploy(
      await userRegistry.getAddress(),
      await cashToken.getAddress(),
      await orderBook.getAddress(),
      await auditLog.getAddress()
    );
    await tradeSettlement.waitForDeployment();

    // 6. Connect permissions
    await orderBook.setSettlementContract(await tradeSettlement.getAddress());
    await auditLog.setAuthorizedLogger(await tradeSettlement.getAddress(), true);
    await cashToken.setAuthorizedSettler(await tradeSettlement.getAddress(), true);
    await tradeSettlement.setAuthorizedBroker(broker.address, true);

    // 7. Deploy StockTokens
    const StockToken = await ethers.getContractFactory("StockToken");
    stockAAPL = await StockToken.deploy("Simulated Apple", "sAAPL", "Apple Inc.", "US0378331005");
    await stockAAPL.waitForDeployment();
    await stockAAPL.setAuthorizedSettler(await tradeSettlement.getAddress(), true);
    await tradeSettlement.registerStockToken("AAPL", await stockAAPL.getAddress());

    stockTSLA = await StockToken.deploy("Simulated Tesla", "sTSLA", "Tesla Inc.", "US88160R1014");
    await stockTSLA.waitForDeployment();
    await stockTSLA.setAuthorizedSettler(await tradeSettlement.getAddress(), true);
    await tradeSettlement.registerStockToken("TSLA", await stockTSLA.getAddress());

    // 8. Register users
    // Role enum: 1=INVESTOR, 2=BROKER, 3=AUDITOR, 4=REGULATOR
    // Kyc enum: 2=APPROVED
    await userRegistry.registerUser(alice.address, "Alice", 1, 2);
    await userRegistry.registerUser(bob.address, "Bob", 1, 2);
    await userRegistry.registerUser(broker.address, "Broker", 2, 2);
    await userRegistry.registerUser(auditor.address, "Auditor", 3, 2);
    await userRegistry.registerUser(regulator.address, "Regulator", 4, 2);

    // Fund accounts
    await cashToken.requestDemoFunds(alice.address, parse18("50000"));
    await cashToken.requestDemoFunds(bob.address, parse18("50000"));

    await stockAAPL.mint(bob.address, parse18("100"));
    await stockTSLA.mint(alice.address, parse18("50"));
  });

  describe("1. User Registration & Access Control", function () {
    it("should correctly record registered users with demo KYC status", async function () {
      const aliceProfile = await userRegistry.getUser(alice.address);
      expect(aliceProfile.demoUsername).to.equal("Alice");
      expect(aliceProfile.role).to.equal(1n); // INVESTOR
      expect(aliceProfile.kycStatus).to.equal(2n); // APPROVED
      expect(await userRegistry.isKycApproved(alice.address)).to.be.true;
    });

    it("should allow self-registration for demo investors", async function () {
      await userRegistry.connect(charlie).selfRegisterInvestor("Charlie Investor");
      const charlieProfile = await userRegistry.getUser(charlie.address);
      expect(charlieProfile.demoUsername).to.equal("Charlie Investor");
      expect(await userRegistry.isKycApproved(charlie.address)).to.be.true;
    });

    it("should reject order placement from unapproved/unregistered users", async function () {
      await expect(
        orderBook.connect(charlie).createOrder("AAPL", 0, 1, parse18("150"), parse18("10"))
      ).to.be.revertedWith("OrderBook: trader must have approved KYC");
    });
  });

  describe("2. Order Placement & Cancellation", function () {
    it("should create buy and sell limit orders and emit events", async function () {
      const tx = await orderBook.connect(alice).createOrder("AAPL", 0, 1, parse18("150"), parse18("10"));
      await expect(tx).to.emit(orderBook, "OrderCreated");

      const order = await orderBook.getOrder(0);
      expect(order.trader).to.equal(alice.address);
      expect(order.symbol).to.equal("AAPL");
      expect(order.side).to.equal(0n); // BUY
      expect(order.price).to.equal(parse18("150"));
      expect(order.quantity).to.equal(parse18("10"));
      expect(order.status).to.equal(0n); // OPEN
    });

    it("should allow the order creator to cancel an open order", async function () {
      await orderBook.connect(alice).createOrder("AAPL", 0, 1, parse18("150"), parse18("10"));
      await orderBook.connect(alice).cancelOrder(0);

      const order = await orderBook.getOrder(0);
      expect(order.status).to.equal(3n); // CANCELLED
    });

    it("should prevent unauthorized users from cancelling another trader's order", async function () {
      await orderBook.connect(alice).createOrder("AAPL", 0, 1, parse18("150"), parse18("10"));
      await expect(
        orderBook.connect(bob).cancelOrder(0)
      ).to.be.revertedWith("OrderBook: only order owner can cancel");
    });
  });

  describe("3. Atomic Delivery-versus-Payment (DvP) Settlement", function () {
    beforeEach(async function () {
      // Alice wants to BUY 10 AAPL at $150 limit
      await orderBook.connect(alice).createOrder("AAPL", 0, 1, parse18("150"), parse18("10")); // Order 0
      // Bob wants to SELL 10 AAPL at $150 limit
      await orderBook.connect(bob).createOrder("AAPL", 1, 1, parse18("150"), parse18("10")); // Order 1

      // Approve allowances for Settlement contract
      const settlementAddr = await tradeSettlement.getAddress();
      await cashToken.connect(alice).approve(settlementAddr, parse18("10000"));
      await stockAAPL.connect(bob).approve(settlementAddr, parse18("100"));
    });

    it("should settle atomically: transfer shares to buyer and cash to seller", async function () {
      const aliceCashBefore = await cashToken.balanceOf(alice.address);
      const bobCashBefore = await cashToken.balanceOf(bob.address);
      const aliceStockBefore = await stockAAPL.balanceOf(alice.address);
      const bobStockBefore = await stockAAPL.balanceOf(bob.address);

      // Match 10 AAPL at $150 => $1,500 total cost
      const matchPrice = parse18("150");
      const matchQty = parse18("10");
      const expectedCost = parse18("1500");

      const tx = await tradeSettlement.connect(broker).settleMatchedTrade(0, 1, matchPrice, matchQty);
      await expect(tx).to.emit(tradeSettlement, "TradeSettled");

      // Verify asset transfers
      expect(await cashToken.balanceOf(alice.address)).to.equal(aliceCashBefore - expectedCost);
      expect(await cashToken.balanceOf(bob.address)).to.equal(bobCashBefore + expectedCost);
      expect(await stockAAPL.balanceOf(alice.address)).to.equal(aliceStockBefore + matchQty);
      expect(await stockAAPL.balanceOf(bob.address)).to.equal(bobStockBefore - matchQty);

      // Verify order book statuses are updated to FILLED
      const buyOrder = await orderBook.getOrder(0);
      const sellOrder = await orderBook.getOrder(1);
      expect(buyOrder.status).to.equal(2n); // FILLED
      expect(sellOrder.status).to.equal(2n); // FILLED
    });

    it("should support partial fills and correct remaining amounts", async function () {
      const matchPrice = parse18("150");
      const matchQty = parse18("4"); // partial 4 of 10

      await tradeSettlement.connect(broker).settleMatchedTrade(0, 1, matchPrice, matchQty);

      const buyOrder = await orderBook.getOrder(0);
      expect(buyOrder.filledQty).to.equal(matchQty);
      expect(buyOrder.status).to.equal(1n); // PARTIALLY_FILLED
    });

    it("should reject duplicate fills exceeding order quantity", async function () {
      const matchPrice = parse18("150");
      const matchQty = parse18("10");

      await tradeSettlement.connect(broker).settleMatchedTrade(0, 1, matchPrice, matchQty);

      // Try filling again
      await expect(
        tradeSettlement.connect(broker).settleMatchedTrade(0, 1, matchPrice, matchQty)
      ).to.be.revertedWith("TradeSettlement: buy order not fillable");
    });

    it("should revert atomically if buyer has insufficient cash allowance", async function () {
      // Create new buy order for Charlie with insufficient allowance
      await userRegistry.connect(charlie).selfRegisterInvestor("Charlie");
      await orderBook.connect(charlie).createOrder("AAPL", 0, 1, parse18("150"), parse18("5")); // Order 2

      // Charlie has 0 sUSD and 0 allowance
      await expect(
        tradeSettlement.connect(broker).settleMatchedTrade(2, 1, parse18("150"), parse18("5"))
      ).to.be.reverted;
    });

    it("should enforce price limit: buyer cannot be matched above their limit price", async function () {
      // Alice's limit was $150. Trying to match at $155 must revert.
      await expect(
        tradeSettlement.connect(broker).settleMatchedTrade(0, 1, parse18("155"), parse18("5"))
      ).to.be.revertedWith("TradeSettlement: matchPrice exceeds buyer limit");
    });
  });

  describe("4. Audit Log Integrity & Tamper Detection", function () {
    it("should record canonical trade hashes and build a verifiable chain", async function () {
      // Alice buys 5 AAPL from Bob
      const settlementAddr = await tradeSettlement.getAddress();
      await cashToken.connect(alice).approve(settlementAddr, parse18("10000"));
      await stockAAPL.connect(bob).approve(settlementAddr, parse18("100"));

      await orderBook.connect(alice).createOrder("AAPL", 0, 1, parse18("150"), parse18("5"));
      await orderBook.connect(bob).createOrder("AAPL", 1, 1, parse18("150"), parse18("5"));

      await tradeSettlement.connect(broker).settleMatchedTrade(0, 1, parse18("150"), parse18("5"));

      expect(await auditLog.getTotalRecords()).to.equal(1n);

      const record0 = await auditLog.getRecord(0);
      expect(record0.symbol).to.equal("AAPL");
      expect(record0.previousHash).to.equal(ethers.ZeroHash);

      // Verify hash recomputation matches stored hash
      const [isValid, recomputed, stored] = await auditLog.verifyRecord(0);
      expect(isValid).to.be.true;
      expect(recomputed).to.equal(stored);

      // Verify chain integrity
      const [isIntact] = await auditLog.verifyChainIntegrity(0, 0);
      expect(isIntact).to.be.true;
    });

    it("should verify chained hashes across sequential trades", async function () {
      const settlementAddr = await tradeSettlement.getAddress();
      await cashToken.connect(alice).approve(settlementAddr, parse18("20000"));
      await stockAAPL.connect(bob).approve(settlementAddr, parse18("100"));

      // Trade 1
      await orderBook.connect(alice).createOrder("AAPL", 0, 1, parse18("150"), parse18("5"));
      await orderBook.connect(bob).createOrder("AAPL", 1, 1, parse18("150"), parse18("5"));
      await tradeSettlement.connect(broker).settleMatchedTrade(0, 1, parse18("150"), parse18("5"));

      // Trade 2
      await orderBook.connect(alice).createOrder("AAPL", 0, 1, parse18("152"), parse18("5"));
      await orderBook.connect(bob).createOrder("AAPL", 1, 1, parse18("152"), parse18("5"));
      await tradeSettlement.connect(broker).settleMatchedTrade(2, 3, parse18("152"), parse18("5"));

      expect(await auditLog.getTotalRecords()).to.equal(2n);

      const rec0 = await auditLog.getRecord(0);
      const rec1 = await auditLog.getRecord(1);

      // Record 1's previousHash MUST match Record 0's canonicalHash
      expect(rec1.previousHash).to.equal(rec0.canonicalHash);

      const [chainValid] = await auditLog.verifyChainIntegrity(0, 1);
      expect(chainValid).to.be.true;
    });
  });
});
