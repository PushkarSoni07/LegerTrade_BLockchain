import fs from "fs";
import path from "path";

export interface DeployedAddresses {
  network: string;
  chainId: number;
  deployedAt: string;
  contracts: {
    UserRegistry: string;
    CashToken: string;
    AuditLog: string;
    OrderBook: string;
    TradeSettlement: string;
    StockTokens: Record<string, string>;
  };
  demoAccounts: Record<string, string>;
}

// Fallback default addresses if hardhat node hasn't been run yet
const DEFAULT_DEPLOYED: DeployedAddresses = {
  network: "hardhat",
  chainId: 31337,
  deployedAt: new Date().toISOString(),
  contracts: {
    UserRegistry: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    CashToken: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    AuditLog: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
    OrderBook: "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9",
    TradeSettlement: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
    StockTokens: {
      AAPL: "0x610178dA211FEF7D417bC0e6FeD39F05609AD788",
      TSLA: "0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82",
      MSFT: "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1",
      GOOGL: "0x3Aa5ebB10DC797CAC828524e59A333d0A371443c"
    }
  },
  demoAccounts: {
    deployer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    investorAlice: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    investorBob: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    broker: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    auditor: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    regulator: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc"
  }
};

export function getDeployedAddresses(): DeployedAddresses {
  const filePath = path.resolve(__dirname, "../../../blockchain/deployedAddresses.json");
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    } catch (e) {
      console.warn("Failed to parse deployedAddresses.json, falling back to defaults", e);
    }
  }
  return DEFAULT_DEPLOYED;
}

export function getContractAbi(contractName: string): any[] {
  const artifactPath = path.resolve(
    __dirname,
    `../../../blockchain/artifacts/contracts/${contractName}.sol/${contractName}.json`
  );
  if (fs.existsSync(artifactPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
      return data.abi;
    } catch (e) {
      console.warn(`Failed reading artifact for ${contractName}`, e);
    }
  }
  return [];
}
