'use strict';

const matcher = require('../utils/matcher');

describe('matcher', () => {
  beforeEach(() => {
    matcher.clearCache();
  });

  describe('isBlocked', () => {
    test('returns true when URL matches a literal pattern', () => {
      expect(matcher.isBlocked('https://example.com/ad.js', ['https://example.com/ad.js'])).toBe(true);
    });

    test('returns false when URL does not match any pattern', () => {
      expect(matcher.isBlocked('https://example.com/page', ['https://ads.net/ad.js'])).toBe(false);
    });

    test('wildcard * matches any substring', () => {
      expect(matcher.isBlocked('https://ads.example.com/banner.js', ['https://ads.example.com/*'])).toBe(true);
    });

    test('wildcard at start matches prefix-varying URLs', () => {
      expect(matcher.isBlocked('https://cdn.adserver.com/ad.png', ['*adserver.com/ad.png'])).toBe(true);
    });

    test('returns false for empty pattern list', () => {
      expect(matcher.isBlocked('https://example.com/', [])).toBe(false);
    });

    test('returns true if any one pattern in the list matches', () => {
      const patterns = ['https://safe.com/page', '*/tracker.js'];
      expect(matcher.isBlocked('https://evil.com/tracker.js', patterns)).toBe(true);
    });

    test('does not throw on malformed patterns', () => {
      expect(() => matcher.isBlocked('https://example.com/', ['{bad(regex'])).not.toThrow();
    });
  });

  describe('regex caching', () => {
    test('compiles regex only once per pattern (same result on repeated calls)', () => {
      const patterns = ['https://ads.net/*'];
      const url1 = 'https://ads.net/banner.gif';
      const url2 = 'https://ads.net/script.js';

      expect(matcher.isBlocked(url1, patterns)).toBe(true);
      // second call hits the cache — should still return correct result
      expect(matcher.isBlocked(url2, patterns)).toBe(true);
    });

    test('clearCache removes cached entries without breaking subsequent calls', () => {
      const patterns = ['*/ad.js'];
      expect(matcher.isBlocked('https://x.com/ad.js', patterns)).toBe(true);
      matcher.clearCache();
      expect(matcher.isBlocked('https://x.com/ad.js', patterns)).toBe(true);
    });
  });
});
