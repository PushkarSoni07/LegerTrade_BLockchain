const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer, broker, investorAlice, investorBob, auditor, regulator] = await hre.ethers.getSigners();
  console.log("--------------------------------------------------");
  console.log("Deploying LedgerTrade smart contracts with account:", deployer.address);
  console.log("--------------------------------------------------");

  // 1. Deploy UserRegistry
  const UserRegistry = await hre.ethers.getContractFactory("UserRegistry");
  const userRegistry = await UserRegistry.deploy();
  await userRegistry.waitForDeployment();
  const userRegistryAddress = await userRegistry.getAddress();
  console.log("UserRegistry deployed at:", userRegistryAddress);

  // 2. Deploy CashToken (sUSD)
  const CashToken = await hre.ethers.getContractFactory("CashToken");
  const cashToken = await CashToken.deploy();
  await cashToken.waitForDeployment();
  const cashTokenAddress = await cashToken.getAddress();
  console.log("CashToken (sUSD) deployed at:", cashTokenAddress);

  // 3. Deploy AuditLog
  const AuditLog = await hre.ethers.getContractFactory("AuditLog");
  const auditLog = await AuditLog.deploy();
  await auditLog.waitForDeployment();
  const auditLogAddress = await auditLog.getAddress();
  console.log("AuditLog deployed at:", auditLogAddress);

  // 4. Deploy OrderBook
  const OrderBook = await hre.ethers.getContractFactory("OrderBook");
  const orderBook = await OrderBook.deploy(userRegistryAddress);
  await orderBook.waitForDeployment();
  const orderBookAddress = await orderBook.getAddress();
  console.log("OrderBook deployed at:", orderBookAddress);

  // 5. Deploy TradeSettlement
  const TradeSettlement = await hre.ethers.getContractFactory("TradeSettlement");
  const tradeSettlement = await TradeSettlement.deploy(
    userRegistryAddress,
    cashTokenAddress,
    orderBookAddress,
    auditLogAddress
  );
  await tradeSettlement.waitForDeployment();
  const tradeSettlementAddress = await tradeSettlement.getAddress();
  console.log("TradeSettlement deployed at:", tradeSettlementAddress);

  // 6. Connect permissions
  console.log("Setting up authorization bindings...");
  await orderBook.setSettlementContract(tradeSettlementAddress);
  await auditLog.setAuthorizedLogger(tradeSettlementAddress, true);
  await cashToken.setAuthorizedSettler(tradeSettlementAddress, true);
  if (broker) {
    await tradeSettlement.setAuthorizedBroker(broker.address, true);
    await tradeSettlement.setAuthorizedBroker(deployer.address, true);
  }

  // 7. Deploy simulated StockTokens: AAPL, TSLA, MSFT, GOOGL
  const StockToken = await hre.ethers.getContractFactory("StockToken");
  const stockSymbols = [
    { symbol: "AAPL", name: "Simulated Apple Inc.", isin: "US0378331005" },
    { symbol: "TSLA", name: "Simulated Tesla Inc.", isin: "US88160R1014" },
    { symbol: "MSFT", name: "Simulated Microsoft Corp.", isin: "US5949181045" },
    { symbol: "GOOGL", name: "Simulated Alphabet Inc.", isin: "US02079K3059" }
  ];

  const stockAddresses = {};
  for (const item of stockSymbols) {
    const stock = await StockToken.deploy(
      `Simulated ${item.symbol}`,
      `s${item.symbol}`,
      item.name,
      item.isin
    );
    await stock.waitForDeployment();
    const addr = await stock.getAddress();
    stockAddresses[item.symbol] = addr;

    await stock.setAuthorizedSettler(tradeSettlementAddress, true);
    await tradeSettlement.registerStockToken(item.symbol, addr);
    console.log(`StockToken s${item.symbol} deployed at:`, addr);
  }

  // 8. Setup Demo Users in UserRegistry & fund demo balances
  console.log("Configuring demo accounts and funding simulated assets...");

  // Role enum: 1=INVESTOR, 2=BROKER, 3=AUDITOR, 4=REGULATOR
  // Kyc enum: 2=APPROVED
  if (investorAlice) {
    await userRegistry.registerUser(investorAlice.address, "Alice Investor", 1, 2);
    // Give Alice 100,000 sUSD
    await cashToken.requestDemoFunds(investorAlice.address, hre.ethers.parseEther("100000"));
    // Give Alice 500 AAPL and 200 TSLA
    const aaplToken = await hre.ethers.getContractAt("StockToken", stockAddresses["AAPL"]);
    const tslaToken = await hre.ethers.getContractAt("StockToken", stockAddresses["TSLA"]);
    await aaplToken.mint(investorAlice.address, hre.ethers.parseEther("500"));
    await tslaToken.mint(investorAlice.address, hre.ethers.parseEther("200"));
  }

  if (investorBob) {
    await userRegistry.registerUser(investorBob.address, "Bob Investor", 1, 2);
    // Give Bob 100,000 sUSD
    await cashToken.requestDemoFunds(investorBob.address, hre.ethers.parseEther("100000"));
    // Give Bob 300 MSFT and 150 GOOGL
    const msftToken = await hre.ethers.getContractAt("StockToken", stockAddresses["MSFT"]);
    const googlToken = await hre.ethers.getContractAt("StockToken", stockAddresses["GOOGL"]);
    await msftToken.mint(investorBob.address, hre.ethers.parseEther("300"));
    await googlToken.mint(investorBob.address, hre.ethers.parseEther("150"));
  }

  if (broker) {
    await userRegistry.registerUser(broker.address, "Charles Broker", 2, 2);
  }
  if (auditor) {
    await userRegistry.registerUser(auditor.address, "Diana Auditor", 3, 2);
  }
  if (regulator) {
    await userRegistry.registerUser(regulator.address, "Edward Regulator", 4, 2);
  }

  // Register deployer as broker/admin (deployer already has 10M sUSD from constructor)
  await userRegistry.registerUser(deployer.address, "Admin Deployer", 2, 2);

  const deploymentData = {
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    contracts: {
      UserRegistry: userRegistryAddress,
      CashToken: cashTokenAddress,
      AuditLog: auditLogAddress,
      OrderBook: orderBookAddress,
      TradeSettlement: tradeSettlementAddress,
      StockTokens: stockAddresses,
    },
    demoAccounts: {
      deployer: deployer.address,
      investorAlice: investorAlice ? investorAlice.address : null,
      investorBob: investorBob ? investorBob.address : null,
      broker: broker ? broker.address : null,
      auditor: auditor ? auditor.address : null,
      regulator: regulator ? regulator.address : null,
    }
  };

  const outputPath = path.join(__dirname, "../deployedAddresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
  console.log("Deployment manifest saved to:", outputPath);
  console.log("--------------------------------------------------");
  console.log("LedgerTrade smart contracts deployed successfully!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
