'use strict';

// Mock the chrome.storage.local API before requiring storage.js
const storageMock = (() => {
  let store = {};
  return {
    get: jest.fn((keys, cb) => {
      const result = {};
      const keyList = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys));
      keyList.forEach(k => { if (k in store) result[k] = store[k]; });
      if (cb) cb(result);
      return result;
    }),
    set: jest.fn((items, cb) => {
      Object.assign(store, items);
      if (cb) cb();
    }),
    _reset: () => { store = {}; },
    _getAll: () => ({ ...store }),
  };
})();

global.chrome = { storage: { local: storageMock } };

const storage = require('../storage');

describe('storage', () => {
  beforeEach(() => {
    storageMock._reset();
    storageMock.get.mockClear();
    storageMock.set.mockClear();
  });

  // ── getAllowlist ─────────────────────────────────────────────────────────────
  describe('getAllowlist', () => {
    test('returns empty array when nothing is stored', async () => {
      expect(await storage.getAllowlist()).toEqual([]);
    });

    test('returns stored allowlist', async () => {
      storageMock.set({ allowlist: ['example.com', 'test.org'] });
      expect(await storage.getAllowlist()).toEqual(['example.com', 'test.org']);
    });
  });

  // ── getGlobalEnabled ─────────────────────────────────────────────────────────
  describe('getGlobalEnabled', () => {
    test('defaults to true when not set', async () => {
      expect(await storage.getGlobalEnabled()).toBe(true);
    });

    test('returns false when set to false', async () => {
      storageMock.set({ globalEnabled: false });
      expect(await storage.getGlobalEnabled()).toBe(false);
    });

    test('returns true when set to true', async () => {
      storageMock.set({ globalEnabled: true });
      expect(await storage.getGlobalEnabled()).toBe(true);
    });
  });

  // ── setGlobalEnabled ─────────────────────────────────────────────────────────
  describe('setGlobalEnabled', () => {
    test('coerces truthy value to boolean true', async () => {
      await storage.setGlobalEnabled(1);
      expect(storageMock._getAll().globalEnabled).toBe(true);
    });

    test('coerces falsy value to boolean false', async () => {
      await storage.setGlobalEnabled(0);
      expect(storageMock._getAll().globalEnabled).toBe(false);
    });
  });

  // ── toggleGlobal ─────────────────────────────────────────────────────────────
  describe('toggleGlobal', () => {
    test('flips from default true to false', async () => {
      const result = await storage.toggleGlobal();
      expect(result).toBe(false);
      expect(storageMock._getAll().globalEnabled).toBe(false);
    });

    test('flips from false back to true', async () => {
      storageMock.set({ globalEnabled: false });
      const result = await storage.toggleGlobal();
      expect(result).toBe(true);
    });
  });

  // ── toggleSite ───────────────────────────────────────────────────────────────
  describe('toggleSite', () => {
    test('adds a hostname that is not in the list', async () => {
      const list = await storage.toggleSite('example.com');
      expect(list).toContain('example.com');
    });

    test('removes a hostname that is already in the list', async () => {
      storageMock.set({ allowlist: ['example.com', 'other.net'] });
      const list = await storage.toggleSite('example.com');
      expect(list).not.toContain('example.com');
      expect(list).toContain('other.net');
    });

    test('persists changes to storage', async () => {
      await storage.toggleSite('persist.io');
      expect(storageMock._getAll().allowlist).toContain('persist.io');
    });
  });

  // ── isAllowed ────────────────────────────────────────────────────────────────
  describe('isAllowed', () => {
    test('returns false for unlisted hostname', async () => {
      expect(await storage.isAllowed('notlisted.com')).toBe(false);
    });

    test('returns true for listed hostname', async () => {
      storageMock.set({ allowlist: ['allowed.com'] });
      expect(await storage.isAllowed('allowed.com')).toBe(true);
    });
  });
});
