/**
 * DOM, Media Query, and Telemetry Mocks for E2E Test Suite
 * Provides matchMedia emulation, scroll telemetry, Lenis/GSAP mocks,
 * SSR HTML inspectors, and global browser environment setup/teardown.
 */

export class MockMediaQueryList {
  constructor(media, initialMatches = false) {
    this.media = media;
    this._matches = Boolean(initialMatches);
    this._listeners = new Set();
    this.onchange = null;
  }

  get matches() {
    return this._matches;
  }

  setMatches(newMatches) {
    const prev = this._matches;
    this._matches = Boolean(newMatches);
    if (prev !== this._matches) {
      const event = { matches: this._matches, media: this.media, target: this, type: 'change' };
      if (typeof this.onchange === 'function') {
        this.onchange(event);
      }
      for (const listener of this._listeners) {
        try {
          listener(event);
        } catch (err) {
          console.error('Error in media query listener:', err);
        }
      }
    }
  }

  addEventListener(type, listener) {
    if (type === 'change' && typeof listener === 'function') {
      this._listeners.add(listener);
    }
  }

  removeEventListener(type, listener) {
    if (type === 'change') {
      this._listeners.delete(listener);
    }
  }

  addListener(listener) {
    this.addEventListener('change', listener);
  }

  removeListener(listener) {
    this.removeEventListener('change', listener);
  }

  dispatchEvent(event) {
    if (event.type === 'change') {
      if (typeof this.onchange === 'function') this.onchange(event);
      for (const listener of this._listeners) listener(event);
      return true;
    }
    return false;
  }
}

export function createMockMatchMedia(initialConfig = {}) {
  const queryLists = new Map();
  const config = {
    reducedMotion: false,
    pointerFine: true,
    darkMode: true,
    ...initialConfig,
  };

  const matchMedia = (query) => {
    if (queryLists.has(query)) {
      return queryLists.get(query);
    }

    let matches = false;
    if (query.includes('prefers-reduced-motion: reduce')) {
      matches = Boolean(config.reducedMotion);
    } else if (query.includes('pointer: fine')) {
      matches = Boolean(config.pointerFine);
    } else if (query.includes('pointer: coarse')) {
      matches = !config.pointerFine;
    } else if (query.includes('prefers-color-scheme: dark')) {
      matches = Boolean(config.darkMode);
    } else if (query.includes('prefers-color-scheme: light')) {
      matches = !config.darkMode;
    }

    const mql = new MockMediaQueryList(query, matches);
    queryLists.set(query, mql);
    return mql;
  };

  matchMedia.setConfig = (newConfig) => {
    Object.assign(config, newConfig);
    for (const [query, mql] of queryLists.entries()) {
      if (query.includes('prefers-reduced-motion: reduce')) {
        mql.setMatches(Boolean(config.reducedMotion));
      } else if (query.includes('pointer: fine')) {
        mql.setMatches(Boolean(config.pointerFine));
      } else if (query.includes('pointer: coarse')) {
        mql.setMatches(!config.pointerFine);
      } else if (query.includes('prefers-color-scheme: dark')) {
        mql.setMatches(Boolean(config.darkMode));
      } else if (query.includes('prefers-color-scheme: light')) {
        mql.setMatches(!config.darkMode);
      }
    }
  };

  matchMedia.getQueryList = (query) => queryLists.get(query);
  return matchMedia;
}

export class ScrollTelemetry {
  constructor() {
    this.scrollX = 0;
    this.scrollY = 0;
    this.history = [];
    this.listeners = new Set();
  }

  scrollTo(xOrOptions, y) {
    let targetX = 0;
    let targetY = 0;
    let behavior = 'auto';

    if (typeof xOrOptions === 'object' && xOrOptions !== null) {
      targetX = xOrOptions.left !== undefined ? xOrOptions.left : this.scrollX;
      targetY = xOrOptions.top !== undefined ? xOrOptions.top : this.scrollY;
      behavior = xOrOptions.behavior || 'auto';
    } else {
      targetX = Number(xOrOptions) || 0;
      targetY = Number(y) || 0;
    }

    this.scrollX = targetX;
    this.scrollY = targetY;
    this.history.push({ action: 'scrollTo', x: targetX, y: targetY, behavior, timestamp: Date.now() });
    this._notify();
  }

  scrollBy(xOrOptions, y) {
    let deltaX = 0;
    let deltaY = 0;
    let behavior = 'auto';

    if (typeof xOrOptions === 'object' && xOrOptions !== null) {
      deltaX = xOrOptions.left !== undefined ? xOrOptions.left : 0;
      deltaY = xOrOptions.top !== undefined ? xOrOptions.top : 0;
      behavior = xOrOptions.behavior || 'auto';
    } else {
      deltaX = Number(xOrOptions) || 0;
      deltaY = Number(y) || 0;
    }

    this.scrollX += deltaX;
    this.scrollY += deltaY;
    this.history.push({ action: 'scrollBy', deltaX, deltaY, x: this.scrollX, y: this.scrollY, behavior, timestamp: Date.now() });
    this._notify();
  }

  addEventListener(type, listener) {
    if (type === 'scroll' && typeof listener === 'function') {
      this.listeners.add(listener);
    }
  }

  removeEventListener(type, listener) {
    if (type === 'scroll') {
      this.listeners.delete(listener);
    }
  }

  _notify() {
    for (const listener of this.listeners) {
      try {
        listener({ type: 'scroll', scrollX: this.scrollX, scrollY: this.scrollY });
      } catch (err) {
        console.error('Error in scroll listener:', err);
      }
    }
  }

  reset() {
    this.scrollX = 0;
    this.scrollY = 0;
    this.history = [];
  }
}

export function createScrollTelemetry() {
  return new ScrollTelemetry();
}

export class MockLenis {
  constructor(options = {}) {
    this.options = options;
    this.scroll = 0;
    this.isStopped = false;
    this.isSmooth = true;
    this.calls = [];
    this._listeners = new Map();
  }

  start() {
    this.isStopped = false;
    this.calls.push({ action: 'start', timestamp: Date.now() });
    this.emit('start');
  }

  stop() {
    this.isStopped = true;
    this.calls.push({ action: 'stop', timestamp: Date.now() });
    this.emit('stop');
  }

  scrollTo(target, options = {}) {
    let targetPos = 0;
    if (typeof target === 'number') {
      targetPos = target;
    } else if (typeof target === 'string') {
      targetPos = 1000; // Simulated anchor offset
    } else if (target && typeof target.getBoundingClientRect === 'function') {
      targetPos = 500;
    }
    const offset = options.offset || 0;
    this.scroll = Math.max(0, targetPos + offset);
    this.calls.push({ action: 'scrollTo', target, options, finalScroll: this.scroll, timestamp: Date.now() });
    this.emit('scroll', { scroll: this.scroll, velocity: 1 });
  }

  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this._listeners.has(event)) {
      this._listeners.get(event).delete(callback);
    }
  }

  emit(event, data = {}) {
    if (this._listeners.has(event)) {
      for (const cb of this._listeners.get(event)) {
        try {
          cb(data);
        } catch (err) {
          console.error(`Error in Lenis listener for ${event}:`, err);
        }
      }
    }
  }

  destroy() {
    this.calls.push({ action: 'destroy', timestamp: Date.now() });
    this._listeners.clear();
  }

  raf(time) {
    this.emit('raf', { time });
  }
}

export function createMockLenis(options = {}) {
  return new MockLenis(options);
}

export class MockGsap {
  constructor() {
    this.calls = [];
    this.tickerCallbacks = new Set();
    this.ScrollTrigger = {
      refreshCalls: 0,
      updateCalls: 0,
      refresh: () => {
        this.ScrollTrigger.refreshCalls++;
        this.calls.push({ action: 'ScrollTrigger.refresh', timestamp: Date.now() });
      },
      update: () => {
        this.ScrollTrigger.updateCalls++;
        this.calls.push({ action: 'ScrollTrigger.update', timestamp: Date.now() });
      },
      create: (opts) => ({ ...opts, kill: () => {} }),
      getAll: () => [],
    };
    this.ticker = {
      add: (cb) => {
        this.tickerCallbacks.add(cb);
        this.calls.push({ action: 'ticker.add', timestamp: Date.now() });
      },
      remove: (cb) => {
        this.tickerCallbacks.delete(cb);
        this.calls.push({ action: 'ticker.remove', timestamp: Date.now() });
      },
      lagSmoothing: (threshold, adjustedLag) => {
        this.calls.push({ action: 'ticker.lagSmoothing', threshold, adjustedLag, timestamp: Date.now() });
      },
    };
  }

  to(target, vars) {
    this.calls.push({ action: 'to', target, vars, timestamp: Date.now() });
    return { kill: () => {}, progress: () => 1 };
  }

  from(target, vars) {
    this.calls.push({ action: 'from', target, vars, timestamp: Date.now() });
    return { kill: () => {}, progress: () => 1 };
  }

  fromTo(target, fromVars, toVars) {
    this.calls.push({ action: 'fromTo', target, fromVars, toVars, timestamp: Date.now() });
    return { kill: () => {}, progress: () => 1 };
  }

  quickTo(target, property, options) {
    const quickSetter = (value) => {
      this.calls.push({ action: 'quickTo.call', target, property, value, options, timestamp: Date.now() });
    };
    return quickSetter;
  }

  timeline(vars = {}) {
    const tlCalls = [];
    const tl = {
      to: (target, v) => { tlCalls.push({ action: 'to', target, vars: v }); return tl; },
      from: (target, v) => { tlCalls.push({ action: 'from', target, vars: v }); return tl; },
      play: () => tl,
      pause: () => tl,
      restart: () => tl,
      kill: () => {},
      calls: tlCalls,
    };
    this.calls.push({ action: 'timeline', vars, tl });
    return tl;
  }

  registerPlugin(...plugins) {
    this.calls.push({ action: 'registerPlugin', plugins, timestamp: Date.now() });
  }

  context(fn) {
    const ctx = {
      revertCalls: 0,
      revert: () => { ctx.revertCalls++; },
    };
    fn(ctx);
    return ctx;
  }
}

export function createMockGsap() {
  return new MockGsap();
}

// --- HTML / SSR Inspectors ---

export function extractAttributes(tagHtml) {
  const attrs = {};
  const regex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^>\s]+)))?/g;
  let match;
  // skip tag name
  const spaceIdx = tagHtml.search(/\s/);
  if (spaceIdx === -1) return attrs;
  const attrSlice = tagHtml.slice(spaceIdx, tagHtml.endsWith('>') ? -1 : undefined);

  while ((match = regex.exec(attrSlice)) !== null) {
    const key = match[1];
    const val = match[2] ?? match[3] ?? match[4] ?? '';
    attrs[key] = val;
  }
  return attrs;
}

export function getByRole(html, role) {
  const results = [];
  const seenIndices = new Set();
  const roleRegex = new RegExp(`<([a-zA-Z0-9-]+)[^>]*\\srole=["']${role}["'][^>]*>`, 'gi');
  let match;
  while ((match = roleRegex.exec(html)) !== null) {
    seenIndices.add(match.index);
    results.push({
      tag: match[1],
      fullMatch: match[0],
      attributes: extractAttributes(match[0]),
    });
  }

  // Implicit semantic HTML roles fallback (only if not already matched via explicit role attribute)
  const implicitCheck = (regex, defaultTag) => {
    let m;
    while ((m = regex.exec(html)) !== null) {
      if (!seenIndices.has(m.index)) {
        seenIndices.add(m.index);
        results.push({ tag: defaultTag, fullMatch: m[0], attributes: extractAttributes(m[0]) });
      }
    }
  };

  if (role === 'dialog') {
    implicitCheck(/<dialog[^>]*>/gi, 'dialog');
  } else if (role === 'navigation') {
    implicitCheck(/<nav[^>]*>/gi, 'nav');
  } else if (role === 'main') {
    implicitCheck(/<main[^>]*>/gi, 'main');
  }

  return results;
}

export function getByAria(html, ariaAttr, expectedValue) {
  const safeAttr = ariaAttr.startsWith('aria-') ? ariaAttr : `aria-${ariaAttr}`;
  const valuePattern = expectedValue !== undefined ? `=["']${expectedValue}["']` : '(?:=["\'][^"\']*["\'])?';
  const regex = new RegExp(`<([a-zA-Z0-9-]+)[^>]*\\s${safeAttr}${valuePattern}[^>]*>`, 'gi');
  const results = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    results.push({
      tag: match[1],
      fullMatch: match[0],
      attributes: extractAttributes(match[0]),
    });
  }
  return results;
}

export function hasAttribute(tagHtmlOrElement, attrName, expectedValue) {
  const attrs = typeof tagHtmlOrElement === 'string' 
    ? extractAttributes(tagHtmlOrElement) 
    : tagHtmlOrElement?.attributes || {};
  if (!(attrName in attrs)) return false;
  if (expectedValue === undefined) return true;
  return attrs[attrName] === String(expectedValue);
}

export function extractText(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Environment Setup / Teardown ---

let originalDescriptors = null;

export function setupDomEnvironment(options = {}) {
  const targetProps = ['window', 'document', 'navigator', 'matchMedia', 'requestAnimationFrame', 'cancelAnimationFrame'];
  originalDescriptors = {};
  for (const prop of targetProps) {
    originalDescriptors[prop] = Object.getOwnPropertyDescriptor(globalThis, prop);
  }

  const telemetry = createScrollTelemetry();
  const matchMedia = createMockMatchMedia(options);
  const mockLenis = createMockLenis();
  const mockGsap = createMockGsap();

  const mockWindow = {
    matchMedia,
    get scrollX() { return telemetry.scrollX; },
    get scrollY() { return telemetry.scrollY; },
    set scrollX(val) { telemetry.scrollX = val; },
    set scrollY(val) { telemetry.scrollY = val; },
    scrollTo: telemetry.scrollTo.bind(telemetry),
    scrollBy: telemetry.scrollBy.bind(telemetry),
    addEventListener: telemetry.addEventListener.bind(telemetry),
    removeEventListener: telemetry.removeEventListener.bind(telemetry),
    lenis: mockLenis,
    gsap: mockGsap,
    location: {
      href: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
    },
    innerWidth: options.width || 1280,
    innerHeight: options.height || 800,
  };

  const mockDocument = {
    documentElement: {
      classList: {
        _classes: new Set(['dark']),
        contains: (c) => mockDocument.documentElement.classList._classes.has(c),
        add: (c) => mockDocument.documentElement.classList._classes.add(c),
        remove: (c) => mockDocument.documentElement.classList._classes.delete(c),
        toggle: (c) => {
          if (mockDocument.documentElement.classList._classes.has(c)) {
            mockDocument.documentElement.classList._classes.delete(c);
            return false;
          } else {
            mockDocument.documentElement.classList._classes.add(c);
            return true;
          }
        },
      },
      getAttribute: (attr) => (attr === 'class' ? Array.from(mockDocument.documentElement.classList._classes).join(' ') : null),
      setAttribute: (attr, val) => {
        if (attr === 'class') {
          mockDocument.documentElement.classList._classes = new Set(val.split(' ').filter(Boolean));
        }
      },
    },
    body: {
      style: {},
      classList: {
        add: () => {},
        remove: () => {},
        contains: () => false,
      },
    },
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    addEventListener: () => {},
    removeEventListener: () => {},
  };

  const mockNavigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) TestRunner/1.0',
    onLine: options.onLine !== undefined ? Boolean(options.onLine) : true,
    clipboard: {
      _text: '',
      writeText: async (text) => {
        mockNavigator.clipboard._text = text;
        return text;
      },
      readText: async () => mockNavigator.clipboard._text,
    },
  };

  function setGlobalProp(prop, value) {
    try {
      Object.defineProperty(globalThis, prop, {
        value,
        configurable: true,
        writable: true,
        enumerable: true,
      });
    } catch {
      globalThis[prop] = value;
    }
  }

  setGlobalProp('window', mockWindow);
  setGlobalProp('document', mockDocument);
  setGlobalProp('navigator', mockNavigator);
  setGlobalProp('matchMedia', matchMedia);
  setGlobalProp('requestAnimationFrame', (cb) => setTimeout(() => cb(Date.now()), 16));
  setGlobalProp('cancelAnimationFrame', (id) => clearTimeout(id));

  return {
    window: mockWindow,
    document: mockDocument,
    navigator: mockNavigator,
    telemetry,
    matchMedia,
    lenis: mockLenis,
    gsap: mockGsap,
  };
}

export function teardownDomEnvironment() {
  if (originalDescriptors) {
    for (const [prop, desc] of Object.entries(originalDescriptors)) {
      try {
        if (desc) {
          Object.defineProperty(globalThis, prop, desc);
        } else {
          delete globalThis[prop];
        }
      } catch {
        // Fallback
      }
    }
    originalDescriptors = null;
  }
}

const dom = {
  MockMediaQueryList,
  createMockMatchMedia,
  ScrollTelemetry,
  createScrollTelemetry,
  MockLenis,
  createMockLenis,
  MockGsap,
  createMockGsap,
  extractAttributes,
  getByRole,
  getByAria,
  hasAttribute,
  extractText,
  setupDomEnvironment,
  teardownDomEnvironment,
};

export default dom;
