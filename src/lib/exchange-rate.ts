const FRANKFURTER_BASE = "https://api.frankfurter.dev/v1";

const rateCache = new Map<string, { rate: number; fetchedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h — historical rates don't change

export async function getExchangeRate(
  date: string,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) return 1;

  const cacheKey = `${date}:${fromCurrency}:${toCurrency}`;
  const cached = rateCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.rate;
  }

  const url = `${FRANKFURTER_BASE}/${date}?from=${fromCurrency}&to=${toCurrency}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Exchange rate API error: ${res.status}`);
  }

  const data = await res.json();
  const rate = data.rates?.[toCurrency];
  if (!rate) {
    throw new Error(`No rate found for ${toCurrency}`);
  }

  if (rateCache.size >= 1000) {
    const oldestKey = rateCache.keys().next().value;
    if (oldestKey !== undefined) rateCache.delete(oldestKey);
  }
  rateCache.set(cacheKey, { rate, fetchedAt: Date.now() });
  return rate;
}

let currenciesCache: Record<string, string> | null = null;

export async function getCurrencies(): Promise<Record<string, string>> {
  if (currenciesCache) return currenciesCache;
  const res = await fetch(`${FRANKFURTER_BASE}/currencies`);
  if (!res.ok) throw new Error("Failed to fetch currencies");
  currenciesCache = await res.json();
  return currenciesCache!;
}
