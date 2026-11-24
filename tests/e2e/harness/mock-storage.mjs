/**
 * In-Memory LocalStorage Mock for E2E Test Suite
 * Fully implements Web Storage API interface with testing snapshots and global install/uninstall
 */
export class MockStorage {
  constructor(initialData = {}) {
    this._store = new Map();
    if (initialData && typeof initialData === 'object') {
      for (const [k, v] of Object.entries(initialData)) {
        this.setItem(k, v);
      }
    }
  }

  get length() {
    return this._store.size;
  }

  getItem(key) {
    const stringKey = String(key);
    if (!this._store.has(stringKey)) {
      return null;
    }
    return this._store.get(stringKey);
  }

  setItem(key, value) {
    const stringKey = String(key);
    const stringValue = String(value);
    this._store.set(stringKey, stringValue);
  }

  removeItem(key) {
    const stringKey = String(key);
    this._store.delete(stringKey);
  }

  clear() {
    this._store.clear();
  }

  key(index) {
    const idx = Number(index);
    if (isNaN(idx) || idx < 0 || idx >= this._store.size) {
      return null;
    }
    return Array.from(this._store.keys())[idx] ?? null;
  }

  hasItem(key) {
    return this._store.has(String(key));
  }

  dump() {
    const obj = {};
    for (const [k, v] of this._store.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  load(data) {
    this.clear();
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        this.setItem(k, v);
      }
    }
  }

  installGlobally() {
    this._originalLocalStorage = globalThis.localStorage;
    globalThis.localStorage = this;
    if (typeof globalThis.window === 'object' && globalThis.window !== null) {
      globalThis.window.localStorage = this;
    }
    return this;
  }

  uninstall() {
    if (this._originalLocalStorage !== undefined) {
      globalThis.localStorage = this._originalLocalStorage;
      if (typeof globalThis.window === 'object' && globalThis.window !== null) {
        globalThis.window.localStorage = this._originalLocalStorage;
      }
    } else {
      delete globalThis.localStorage;
      if (typeof globalThis.window === 'object' && globalThis.window !== null) {
        delete globalThis.window.localStorage;
      }
    }
  }
}

export function createMockStorage(initialData = {}) {
  return new MockStorage(initialData);
}

export default MockStorage;
