const matcher = {
  isBlocked: (url, patterns) => {
    return patterns.some(pattern => {
      try {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(url);
      } catch {
        return false;
      }
    });
  }
};

if (typeof module !== 'undefined') module.exports = matcher;