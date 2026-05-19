import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export const tags = {
  branches: "branches",
  users: "users",
  mobileLines: "mobile-lines",
  feeRates: "fee-rates",
  float: "float",
  bankAccount: "bank-account",
  shifts: "shifts",
  transactions: "transactions",
  reports: "reports",
  notifications: "notifications",
};

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = 60
): Promise<T> {
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null) return cached;
  } catch {
    // Redis unavailable — fall through to fetcher
  }
  const data = await fetcher();
  try {
    await redis.set(key, data, { ex: ttlSeconds });
  } catch {
    // Redis unavailable — ignore write failure
  }
  return data;
}

export async function invalidateTag(tag: string): Promise<void> {
  try {
    const keys = await redis.keys(`tag:${tag}:*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Redis unavailable — ignore
  }
}

export function cacheKey(tag: string, ...parts: (string | number)[]): string {
  return `tag:${tag}:${parts.join(":")}`;
}
