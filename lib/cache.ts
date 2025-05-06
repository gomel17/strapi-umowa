type CacheContent = {
  data: any;
  expiresAt: number;
};

/**
 * Simple in-memory cache for API responses
 */
class ApiCache {
  private cache: Map<string, CacheContent>;
  
  constructor() {
    this.cache = new Map();
  }
  
  /**
   * Set a value in the cache with an expiration time
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds
   */
  set(key: string, value: any, ttlSeconds: number = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data: value, expiresAt });
  }
  
  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or null if not found or expired
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    
    // Return null if not found
    if (!cached) {
      return null;
    }
    
    // Return null if expired
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  /**
   * Delete a value from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get a list of all cache keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Clean up expired cache entries
   */
  cleanExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Export a singleton instance
const apiCache = new ApiCache();
export default apiCache;

// Set up a periodic cleanup every 5 minutes (if code is running on server)
if (typeof window === 'undefined') {
  setInterval(() => {
    apiCache.cleanExpired();
  }, 5 * 60 * 1000);
}

/**
 * Wrap an async function with caching
 * @param fn Function to wrap
 * @param keyFn Function to generate cache key
 * @param ttlSeconds Time to live in seconds
 */
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyFn: (...args: Parameters<T>) => string,
  ttlSeconds: number = 60
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async function(...args: Parameters<T>): Promise<ReturnType<T>> {
    const cacheKey = keyFn(...args);
    const cached = apiCache.get(cacheKey);
    
    if (cached !== null) {
      return cached as ReturnType<T>;
    }
    
    const result = await fn(...args);
    apiCache.set(cacheKey, result, ttlSeconds);
    return result;
  };
}