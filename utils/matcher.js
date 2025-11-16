const escapeRegex = (s) => s.replace(/[-/\\^$+?.()|[\]{}]/g, '\\$&');
const wildcardToRegex = (pattern) => new RegExp('^' + escapeRegex(pattern).replace(/\*/g, '.*') + '$');
const matcher = {
  isBlocked: (url, patterns) => patterns.some(p => {
    try { return wildcardToRegex(p).test(url); } catch { return false; }
  })
};

if (typeof module !== 'undefined') module.exports = matcher;