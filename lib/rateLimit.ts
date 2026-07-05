// lib/rateLimit.ts
// For production, replace with Redis/Upstash rate limiting.

const LIMIT = 60;           // max requests
const WINDOW_MS = 60_000;   // 60-second rolling window

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// In-memory store keyed by IP address
const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries so the Map doesn't grow unboundedly.
// Runs every 5 minutes in environments that keep the process alive.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of store.entries()) {
      if (now - entry.windowStart >= WINDOW_MS) {
        store.delete(ip);
      }
    }
  }, 5 * 60_000);
}

/**
 * Checks whether the given IP is within the rate limit.
 * Mutates the store to increment the counter.
 *
 * @param ip - The client IP address.
 * @returns `{ allowed, remaining }` where `remaining` is the number of
 *          requests still permitted in the current window.
 */
export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    // Start a fresh window
    store.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: LIMIT - 1 };
  }

  // Within the current window
  entry.count += 1;

  if (entry.count > LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: LIMIT - entry.count };
}
