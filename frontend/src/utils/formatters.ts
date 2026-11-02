/**
 * LedgerTrade - Indian Rupee (INR) and Number Formatting Utilities
 * Adheres strictly to the Indian numbering system (Lakhs, Crores, ₹ formatting).
 */

interface FormatINROptions {
  showSign?: boolean;
  decimals?: number;
  compact?: boolean;
  useSymbol?: boolean;
}

/**
 * Formats a numeric value into an Indian Rupee string (e.g. ₹72,300.00, ₹1,25,000.00, ₹15.50 L)
 */
export function formatINR(value: number | string | undefined | null, options?: FormatINROptions): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "₹0.00";

  const decimals = options?.decimals ?? 2;
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const symbol = options?.useSymbol !== false ? "₹" : "";

  // Compact mode for large valuations (Lakhs & Crores)
  if (options?.compact) {
    if (absNum >= 10000000) {
      // 1 Crore = 10,000,000
      const cr = (absNum / 10000000).toFixed(decimals);
      const str = `${symbol}${cr} Cr`;
      return isNegative ? `-${str}` : options?.showSign && num > 0 ? `+${str}` : str;
    } else if (absNum >= 100000) {
      // 1 Lakh = 100,000
      const lk = (absNum / 100000).toFixed(decimals);
      const str = `${symbol}${lk} L`;
      return isNegative ? `-${str}` : options?.showSign && num > 0 ? `+${str}` : str;
    }
  }

  // Standard Indian formatting (e.g., 1,25,000.00)
  const formatted = absNum.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const sign = isNegative ? "-" : options?.showSign && num > 0 ? "+" : "";
  return `${sign}${symbol}${formatted}`;
}

/**
 * Formats with an explicit plus/minus sign (e.g., +₹1,450.00 or -₹320.00)
 */
export function formatINRSigned(value: number | string | undefined | null, decimals = 2): string {
  return formatINR(value, { showSign: true, decimals });
}

/**
 * Formats a plain number with Indian numbering grouping (e.g. 1,25,000)
 */
export function formatNumberIN(value: number | string | undefined | null, decimals = 0): string {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return "0";
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
