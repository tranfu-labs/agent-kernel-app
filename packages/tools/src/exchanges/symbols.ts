export function normalizeSymbol(symbol: string): string {
  const normalized = symbol.trim().replace(/[\s/_-]+/g, "").toUpperCase();
  if (!normalized) {
    throw new Error("Symbol must not be empty.");
  }
  if (!/^[A-Z0-9]+$/.test(normalized)) {
    throw new Error(`Unsupported symbol format: ${symbol}`);
  }
  return normalized;
}

export function normalizeSymbols(symbols: string[]): string[] {
  return [...new Set(symbols.map(normalizeSymbol))];
}

export function toBinanceUsdsFuturesSymbol(symbol: string): string {
  return normalizeSymbol(symbol);
}

export function toBitgetUsdtFuturesSymbol(symbol: string): string {
  return normalizeSymbol(symbol);
}
