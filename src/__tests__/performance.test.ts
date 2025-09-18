import { describe, it, expect } from 'vitest';
import { cleanupMemory, debounce, throttle } from '../utils/performance';

describe('Performance utilities', () => {
  describe('debounce', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const debouncedFn = debounce(() => callCount++, 100);
      
      // Call multiple times rapidly
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      expect(callCount).toBe(0); // Should not have been called yet
      
      // Wait for debounce period
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(callCount).toBe(1); // Should have been called once
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      let callCount = 0;
      const throttledFn = throttle(() => callCount++, 100);
      
      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();
      
      expect(callCount).toBe(1); // Should have been called once immediately
      
      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 150));
      
      throttledFn();
      expect(callCount).toBe(2); // Should allow another call
    });
  });

  describe('cleanupMemory', () => {
    it('should not throw errors when called', () => {
      expect(() => cleanupMemory()).not.toThrow();
    });
  });
});