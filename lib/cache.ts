/**
 * Type definition for cache entries
 * @property {any} data - The cached data
 * @property {number} expiresAt - Timestamp in milliseconds when the cache entry expires
 */
type CacheContent = {
  data: any;
  expiresAt: number;
};

/**
 * Simple in-memory cache for API responses
 * 
 * @class ApiCache
 * @description Provides a TTL-based caching mechanism for API responses to reduce
 * the number of requests to the Strapi backend and improve performance
 */
class ApiCache {
  private cache: Map<string, CacheContent>;
  
  constructor() {
    this.cache = new Map();
  }
  
  /**
   * Set a value in the cache with an expiration time
   * 
   * @param {string} key - Cache key to store the value under
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time-to-live in seconds before the entry expires
   * 
   * @example
   * ```typescript
   * // Cache API response for 5 minutes
   * apiCache.set('home-page', pageData, 300);
   * ```
   */
  set(key: string, value: any, ttlSeconds: number = 60): void {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data: value, expiresAt });
  }
  
  /**
   * Get a value from the cache
   * 
   * @param {string} key - Cache key to retrieve
   * @returns {any | null} The cached value or null if not found or expired
   * 
   * @example
   * ```typescript
   * // Try to get cached page data
   * const cachedData = apiCache.get('home-page');
   * if (cachedData) {
   *   return cachedData;
   * } else {
   *   // Fetch and cache fresh data
   * }
   * ```
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
   * 
   * @param {string} key - Cache key to delete
   * 
   * @example
   * ```typescript
   * // Remove cached data when it becomes invalid
   * apiCache.delete('home-page');
   * ```
   */
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  /**
   * Clear the entire cache
   * 
   * @example
   * ```typescript
   * // Clear all cached data, e.g., when user logs out
   * apiCache.clear();
   * ```
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get a list of all cache keys
   * 
   * @returns {string[]} Array of all cache keys currently stored
   * 
   * @example
   * ```typescript
   * // List all cached entries for debugging
   * console.log('Currently cached keys:', apiCache.keys());
   * ```
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
  
  /**
   * Clean up expired cache entries to free memory
   * 
   * @example
   * ```typescript
   * // Manually clean expired entries
   * apiCache.cleanExpired();
   * ```
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
 * Get data from cache or fetch it using the provided function
 * 
 * @param {string} key - Cache key to store/retrieve the data
 * @param {Function} fetchFn - Async function to call if data is not in cache
 * @param {number} ttlSeconds - Time-to-live in seconds before cached data expires
 * @returns {Promise<T>} - Data either from cache or freshly fetched
 * 
 * @example
 * ```typescript
 * // Get page data with 5-minute TTL
 * export async function getHomePage() {
 *   return getCachedData(
 *     'home-page',
 *     () => fetchAPI('/pages/home'),
 *     300
 *   );
 * }
 * ```
 */
export async function getCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 60
): Promise<T> {
  const cached = apiCache.get(key);
  
  if (cached !== null) {
    return cached as T;
  }
  
  const freshData = await fetchFn();
  apiCache.set(key, freshData, ttlSeconds);
  return freshData;
}

/**
 * Wrap an async function with caching functionality
 * 
 * @template T - Type of the wrapped function
 * @param {T} fn - Function to wrap with caching
 * @param {Function} keyFn - Function to generate cache key from arguments
 * @param {number} ttlSeconds - Time-to-live in seconds before cached data expires
 * @returns {Function} - Wrapped function with same signature as the original
 * 
 * @example
 * ```typescript
 * // Create a cached version of getPageBySlug with 10-minute TTL
 * const getCachedPageBySlug = withCache(
 *   getPageBySlug, 
 *   (slug) => `page-${slug}`,
 *   600
 * );
 * 
 * // Use the cached function just like the original
 * const page = await getCachedPageBySlug('about-us');
 * ```
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