// Simple in-memory sliding window rate limiter for API protection

interface RateLimitStore {
  [key: string]: number[];
}

const store: RateLimitStore = {};

export function checkRateLimit(identifier: string, limit = 20, windowMs = 60000): { success: boolean; remaining: number } {
  const now = Date.now();
  if (!store[identifier]) {
    store[identifier] = [];
  }

  // Filter timestamps within current window
  store[identifier] = store[identifier].filter((timestamp) => now - timestamp < windowMs);

  if (store[identifier].length >= limit) {
    return { success: false, remaining: 0 };
  }

  store[identifier].push(now);
  return { success: true, remaining: limit - store[identifier].length };
}
