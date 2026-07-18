interface CacheEntry<T> {
  value: T;
  expiry: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? 300; // default 5 minutes
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl * 1000,
    });
  }

  del(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): string[] {
    return Array.from(this.store.keys());
  }

  size(): number {
    return this.store.size;
  }
}

export const cache = new InMemoryCache();
export { InMemoryCache };
