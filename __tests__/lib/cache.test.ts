import apiCache, { withCache } from '../../lib/cache';

describe('API Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    apiCache.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Basic cache operations', () => {
    it('stores and retrieves values correctly', () => {
      apiCache.set('test-key', { data: 'test-value' }, 60);
      expect(apiCache.get('test-key')).toEqual({ data: 'test-value' });
    });

    it('returns null for non-existent keys', () => {
      expect(apiCache.get('non-existent')).toBeNull();
    });

    it('deletes values correctly', () => {
      apiCache.set('test-key', { data: 'test-value' }, 60);
      apiCache.delete('test-key');
      expect(apiCache.get('test-key')).toBeNull();
    });

    it('clears all values correctly', () => {
      apiCache.set('test-key-1', { data: 'test-value-1' }, 60);
      apiCache.set('test-key-2', { data: 'test-value-2' }, 60);
      apiCache.clear();
      expect(apiCache.get('test-key-1')).toBeNull();
      expect(apiCache.get('test-key-2')).toBeNull();
    });

    it('returns list of keys', () => {
      apiCache.set('test-key-1', { data: 'test-value-1' }, 60);
      apiCache.set('test-key-2', { data: 'test-value-2' }, 60);
      expect(apiCache.keys()).toEqual(['test-key-1', 'test-key-2']);
    });
  });

  describe('Cache expiration', () => {
    it('expires values after TTL', () => {
      apiCache.set('expiring-key', { data: 'test-value' }, 5); // 5 seconds TTL
      
      // Value should be available initially
      expect(apiCache.get('expiring-key')).toEqual({ data: 'test-value' });
      
      // Fast-forward time by 6 seconds
      jest.advanceTimersByTime(6000);
      
      // Value should be expired now
      expect(apiCache.get('expiring-key')).toBeNull();
    });

    it('cleans expired entries on cleanExpired', () => {
      apiCache.set('expired-key-1', { data: 'value-1' }, 5);
      apiCache.set('expired-key-2', { data: 'value-2' }, 10);
      apiCache.set('valid-key', { data: 'value-3' }, 60);
      
      // Fast-forward time by 7 seconds
      jest.advanceTimersByTime(7000);
      
      // Should have 2 keys still (1 expired but not cleaned yet, 1 valid)
      expect(apiCache.keys().length).toBe(3);
      
      // Clean expired entries
      apiCache.cleanExpired();
      
      // Should have only 1 valid key remaining
      expect(apiCache.keys().length).toBe(2);
      expect(apiCache.get('expired-key-1')).toBeNull();
      expect(apiCache.get('expired-key-2')).not.toBeNull();
      expect(apiCache.get('valid-key')).not.toBeNull();
    });
  });

  describe('withCache wrapper function', () => {
    it('caches function results correctly', async () => {
      const mockFn = jest.fn().mockResolvedValue({ data: 'test-result' });
      const cachedFn = withCache(
        mockFn,
        (...args) => `test-key-${JSON.stringify(args)}`,
        60
      );
      
      // First call should execute the function
      const result1 = await cachedFn('arg1', 'arg2');
      expect(result1).toEqual({ data: 'test-result' });
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Second call with same args should use cached value
      const result2 = await cachedFn('arg1', 'arg2');
      expect(result2).toEqual({ data: 'test-result' });
      expect(mockFn).toHaveBeenCalledTimes(1); // Still only called once
      
      // Call with different args should execute function again
      await cachedFn('arg3');
      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it('respects TTL for cached function results', async () => {
      const mockFn = jest.fn().mockResolvedValue({ data: 'test-result' });
      const cachedFn = withCache(
        mockFn,
        () => 'test-key',
        5 // 5 seconds TTL
      );
      
      // First call
      await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Call within TTL
      await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(1); // Still only called once
      
      // Fast-forward time by 6 seconds
      jest.advanceTimersByTime(6000);
      
      // Call after TTL expired
      await cachedFn();
      expect(mockFn).toHaveBeenCalledTimes(2); // Called again
    });
  });
});