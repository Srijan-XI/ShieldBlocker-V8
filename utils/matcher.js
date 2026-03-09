const escapeRegex = (s) => s.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');

// Cache compiled RegExp objects to avoid recompilation on every call.
const _regexCache = new Map();

function wildcardToRegex(pattern) {
  if (_regexCache.has(pattern)) return _regexCache.get(pattern);
  const re = new RegExp('^' + escapeRegex(pattern).replace(/\*/g, '.*') + '$');
  _regexCache.set(pattern, re);
  return re;
}

const matcher = {
  isBlocked: (url, patterns) => patterns.some(p => {
    try { return wildcardToRegex(p).test(url); } catch { return false; }
  }),
  /** Expose for testing / cache management. */
  clearCache: () => _regexCache.clear(),
};

if (typeof module !== 'undefined') module.exports = matcher;