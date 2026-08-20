/**
 * Simple in-memory cache with TTL. Not intended as
 * a replacement for Redis at scale — this is appropriate for
 * caching geocoding results (never change, TTL ~30 days) and
 * weather (time-sensitive, TTL ~15-30 min) in a single-instance
 * or prototype scenario.
 */
export interface CacheEntry<T> {
  value: T;
  storedAt: number;
  ttlMs: number;
}

export class InMemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  set(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      storedAt: Date.now(),
      ttlMs,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.storedAt;
    if (age > entry.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  clear(): void {
    this.cache.clear();
  }
}