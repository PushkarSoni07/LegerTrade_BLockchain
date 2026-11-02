import { db } from "../storage/store";
import { MarketInstrument, MarketPricePoint } from "../types";

const INITIAL_STOCKS: Array<{ symbol: string; name: string; basePrice: number; isin: string }> = [
  { symbol: "AAPL", name: "Apple Inc. (Simulated INR)", basePrice: 1785.0, isin: "IN-SIM-AAPL" },
  { symbol: "TSLA", name: "Tesla Inc. (Simulated INR)", basePrice: 2180.0, isin: "IN-SIM-TSLA" },
  { symbol: "MSFT", name: "Microsoft Corp. (Simulated INR)", basePrice: 4220.0, isin: "IN-SIM-MSFT" },
  { symbol: "GOOGL", name: "Alphabet Inc. (Simulated INR)", basePrice: 1680.0, isin: "IN-SIM-GOOGL" },
];

export class MarketService {
  private timer: NodeJS.Timeout | null = null;

  constructor() {
    this.initMarkets();
  }

  private initMarkets() {
    for (const item of INITIAL_STOCKS) {
      if (!db.getMarket(item.symbol)) {
        const history: MarketPricePoint[] = this.generateHistoricalCandles(item.basePrice, 30);
        const lastCandle = history[history.length - 1];

        const inst: MarketInstrument = {
          symbol: item.symbol,
          name: item.name,
          currentPrice: lastCandle.close,
          change24h: +(lastCandle.close - item.basePrice).toFixed(2),
          change24hPercent: +(((lastCandle.close - item.basePrice) / item.basePrice) * 100).toFixed(2),
          high24h: +(item.basePrice * 1.04).toFixed(2),
          low24h: +(item.basePrice * 0.96).toFixed(2),
          volume24h: 124500,
          isin: item.isin,
          isSimulated: true,
          history,
        };
        db.saveMarket(inst);
      }
    }
  }

  private generateHistoricalCandles(basePrice: number, count: number): MarketPricePoint[] {
    const candles: MarketPricePoint[] = [];
    const now = Math.floor(Date.now() / 1000);
    let price = basePrice * 0.95;

    for (let i = count; i >= 0; i--) {
      const time = now - i * 60; // 1-minute intervals
      const delta = (Math.random() - 0.49) * (basePrice * 0.015);
      const open = +price.toFixed(2);
      price = Math.max(1.0, price + delta);
      const close = +price.toFixed(2);
      const high = +(Math.max(open, close) + Math.random() * (basePrice * 0.005)).toFixed(2);
      const low = +(Math.min(open, close) - Math.random() * (basePrice * 0.005)).toFixed(2);
      const volume = Math.floor(500 + Math.random() * 4500);

      candles.push({ time, open, high, low, close, volume });
    }
    return candles;
  }

  public startPeriodicSimulation(intervalMs: number = 3000) {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tickPrices();
    }, intervalMs);
    console.log(`[MarketService] Periodic synthetic price simulator running (${intervalMs}ms ticks).`);
  }

  public stopPeriodicSimulation() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public tickPrices() {
    const markets = db.getAllMarkets();
    const now = Math.floor(Date.now() / 1000);

    for (const m of markets) {
      // Small random walk with mean reversion towards starting price
      const changePercent = (Math.random() - 0.495) * 0.008; // -0.4% to +0.4%
      const newPrice = +(m.currentPrice * (1 + changePercent)).toFixed(2);
      const diff = +(newPrice - m.currentPrice).toFixed(2);

      // Add to history or update current candle
      const history = [...m.history];
      const lastCandle = history[history.length - 1];

      if (lastCandle && now - lastCandle.time < 60) {
        lastCandle.close = newPrice;
        lastCandle.high = Math.max(lastCandle.high, newPrice);
        lastCandle.low = Math.min(lastCandle.low, newPrice);
        lastCandle.volume += Math.floor(10 + Math.random() * 50);
      } else {
        history.push({
          time: now,
          open: m.currentPrice,
          high: Math.max(m.currentPrice, newPrice),
          low: Math.min(m.currentPrice, newPrice),
          close: newPrice,
          volume: Math.floor(100 + Math.random() * 400),
        });
        if (history.length > 100) history.shift();
      }

      m.currentPrice = newPrice;
      m.change24h = +(m.change24h + diff).toFixed(2);
      m.change24hPercent = +((m.change24h / (newPrice - m.change24h)) * 100).toFixed(2);
      m.high24h = Math.max(m.high24h, newPrice);
      m.low24h = Math.min(m.low24h, newPrice);
      m.volume24h += Math.floor(10 + Math.random() * 50);
      m.history = history;

      db.saveMarket(m);
    }
  }

  public getInstrument(symbol: string): MarketInstrument | undefined {
    return db.getMarket(symbol.toUpperCase());
  }

  public getAllInstruments(): MarketInstrument[] {
    return db.getAllMarkets();
  }
}

export const marketService = new MarketService();
