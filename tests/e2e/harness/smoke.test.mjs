/**
 * E2E Test Harness Primitives Smoke Test Suite
 * Exercises all harness modules: assertions, http, dom, mock-storage, mock-supabase, mock-github, fixtures
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect, beforeEach, afterEach } from '../runner.mjs';
import { getAssertionCount } from './assertions.mjs';
import { createMockRequest, invokeRoute, invokeMiddleware } from './http.mjs';
import {
  getByRole,
  getByAria,
  hasAttribute,
  extractText,
  setupDomEnvironment,
  teardownDomEnvironment,
} from './dom.mjs';
import { createMockStorage } from './mock-storage.mjs';
import { createMockSupabaseClient } from './mock-supabase.mjs';
import { createMockGitHubService } from './mock-github.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '..', 'fixtures');

describe('Harness Primitive Smoke Tests', () => {

  describe('1. Assertions Module (assertions.mjs)', () => {
    it('verifies strict equality, deep equality, and null/defined checks', () => {
      expect(42).toBe(42);
      expect('hello').toBe('hello');
      expect({ a: 1, b: [2, 3] }).toEqual({ a: 1, b: [2, 3] });
      expect(null).toBeNull();
      expect(undefined).toBeUndefined();
      expect(0).toBeDefined();
      expect(false).toBeDefined();
    });

    it('verifies truthiness, falsiness, and negation (.not) chaining', () => {
      expect(true).toBeTruthy();
      expect('non-empty').toBeTruthy();
      expect(false).toBeFalsy();
      expect('').toBeFalsy();
      expect(0).toBeFalsy();
      expect(null).toBeFalsy();

      expect(42).not.toBe(43);
      expect({ a: 1 }).not.toEqual({ a: 2 });
      expect(true).not.toBeFalsy();
      expect(false).not.toBeTruthy();
    });

    it('verifies containment, pattern matching, length, and property matchers', () => {
      expect('Portfolio hardening in progress').toContain('hardening');
      expect([1, 2, 3, 4]).toContain(3);
      expect(new Set(['a', 'b'])).toContain('b');
      expect('contact-form-v1').toMatch(/^contact-/);
      expect([10, 20, 30]).toHaveLength(3);
      expect({ name: 'Bond', role: 'Dev' }).toHaveProperty('name', 'Bond');
      expect({ count: 10 }).toHaveProperty('count');
      expect(10).toBeGreaterThan(5);
      expect(5).toBeLessThan(10);
      expect(10).toBeGreaterThanOrEqual(10);
      expect(10).toBeLessThanOrEqual(10);
    });

    it('verifies synchronous and asynchronous toThrow assertions', async () => {
      expect(() => {
        throw new Error('Specific validation failure');
      }).toThrow('Specific validation');

      expect(() => {
        throw new TypeError('Invalid type argument');
      }).toThrow(TypeError);

      expect(() => 1 + 1).not.toThrow();

      await expect(async () => {
        throw new Error('Async network failure');
      }).toThrow('Async network failure');
    });

    it('verifies HTTP custom matchers (status, headers, json)', () => {
      const mockResponse = new Response(JSON.stringify({ status: 'ok' }), {
        status: 201,
        headers: {
          'content-type': 'application/json; charset=utf-8',
          'x-rate-limit': '100',
        },
      });

      expect(mockResponse).toHaveStatus(201);
      expect(mockResponse).not.toHaveStatus(200);
      expect(mockResponse).toHaveHeader('content-type', 'application/json');
      expect(mockResponse).toHaveHeader('x-rate-limit');
      expect(mockResponse).toBeJson();
    });

    it('confirms assertion counter is monotonically incrementing', () => {
      const countBefore = getAssertionCount();
      expect(1).toBe(1);
      expect(2).toBe(2);
      expect(getAssertionCount()).toBeGreaterThan(countBefore);
    });
  });

  describe('2. HTTP Invoker Module (http.mjs)', () => {
    it('creates standard Web Requests with IP headers and JSON payloads', () => {
      const req = createMockRequest({
        url: 'http://localhost:3000/api/contact',
        method: 'POST',
        ip: '203.0.113.195',
        body: { name: 'Dhanush', message: 'Testing HTTP invoker' },
      });

      expect(req.method).toBe('POST');
      expect(req.url).toBe('http://localhost:3000/api/contact');
      expect(req.headers.get('cf-connecting-ip')).toBe('203.0.113.195');
      expect(req.headers.get('content-type')).toContain('application/json');
    });

    it('invokes route handlers and parses response envelope', async () => {
      const mockHandler = async (req) => {
        const body = await req.json();
        return Response.json(
          { success: true, received: body.name },
          { status: 200, headers: { 'x-powered-by': 'Next.js 16' } }
        );
      };

      const result = await invokeRoute(mockHandler, {
        method: 'POST',
        body: { name: 'E2E Testing' },
      });

      expect(result.status).toBe(200);
      expect(result.ok).toBe(true);
      expect(result.body.success).toBe(true);
      expect(result.body.received).toBe('E2E Testing');
      expect(result.headers.get('x-powered-by')).toBe('Next.js 16');
    });

    it('invokes middleware and extracts redirection/rewrite headers', async () => {
      const mockMiddleware = async (req) => {
        const ip = req.headers.get('cf-connecting-ip');
        if (ip === '10.0.0.1') {
          return new Response(JSON.stringify({ error: 'Blocked IP' }), { status: 403 });
        }
        return new Response(null, {
          status: 200,
          headers: { 'x-middleware-rewrite': 'http://localhost:3000/api/internal' },
        });
      };

      const allowedRes = await invokeMiddleware(mockMiddleware, { ip: '192.168.1.50' });
      expect(allowedRes.status).toBe(200);
      expect(allowedRes.rewriteUrl).toBe('http://localhost:3000/api/internal');

      const blockedRes = await invokeMiddleware(mockMiddleware, { ip: '10.0.0.1' });
      expect(blockedRes.status).toBe(403);
    });
  });

  describe('3. DOM & Telemetry Mock Module (dom.mjs)', () => {
    let domEnv;

    beforeEach(() => {
      domEnv = setupDomEnvironment({
        reducedMotion: false,
        pointerFine: true,
        darkMode: true,
      });
    });

    afterEach(() => {
      teardownDomEnvironment();
    });

    it('emulates matchMedia queries and updates state via listeners', () => {
      const motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
      expect(motionMql.matches).toBe(false);

      let eventFired = false;
      motionMql.addEventListener('change', (e) => {
        eventFired = e.matches;
      });

      window.matchMedia.setConfig({ reducedMotion: true });
      expect(motionMql.matches).toBe(true);
      expect(eventFired).toBe(true);

      const pointerMql = window.matchMedia('(pointer: fine)');
      expect(pointerMql.matches).toBe(true);
    });

    it('tracks scroll telemetry coordinates and invocation history', () => {
      window.scrollTo(0, 500);
      expect(window.scrollY).toBe(500);
      expect(domEnv.telemetry.history).toHaveLength(1);
      expect(domEnv.telemetry.history[0].y).toBe(500);

      window.scrollBy(0, 150);
      expect(window.scrollY).toBe(650);
      expect(domEnv.telemetry.history).toHaveLength(2);
    });

    it('verifies Lenis mock start/stop scroll lock and event emission', () => {
      const lenis = window.lenis;
      expect(lenis.isStopped).toBe(false);

      lenis.stop();
      expect(lenis.isStopped).toBe(true);

      let scrolled = false;
      lenis.on('scroll', () => {
        scrolled = true;
      });

      lenis.scrollTo(1200, { offset: -70 });
      expect(lenis.scroll).toBe(1130);
      expect(scrolled).toBe(true);

      lenis.start();
      expect(lenis.isStopped).toBe(false);
    });

    it('verifies GSAP mock ticker, ScrollTrigger, and quickTo setters', () => {
      const gsap = window.gsap;
      let tickCount = 0;
      const callback = () => tickCount++;
      gsap.ticker.add(callback);
      expect(gsap.tickerCallbacks.has(callback)).toBe(true);

      gsap.ScrollTrigger.refresh();
      expect(gsap.ScrollTrigger.refreshCalls).toBe(1);

      const target = { x: 0 };
      const setter = gsap.quickTo(target, 'x', { duration: 0.3 });
      setter(45);
      expect(gsap.calls.some((c) => c.action === 'quickTo.call' && c.value === 45)).toBe(true);
    });

    it('inspects SSR HTML strings for ARIA roles, attributes, and text', () => {
      const sampleHtml = `
        <div class="modal-root">
          <dialog role="dialog" aria-modal="true" aria-label="Journey Walkthrough">
            <h2>Explore Dhanush's Journey</h2>
            <button aria-label="Close dialog" class="close-btn">X</button>
          </dialog>
        </div>
      `;

      const dialogs = getByRole(sampleHtml, 'dialog');
      expect(dialogs).toHaveLength(1);
      expect(hasAttribute(dialogs[0].fullMatch, 'aria-modal', 'true')).toBe(true);

      const closeButtons = getByAria(sampleHtml, 'label', 'Close dialog');
      expect(closeButtons).toHaveLength(1);

      const text = extractText(sampleHtml);
      expect(text).toContain("Explore Dhanush's Journey");
    });
  });

  describe('4. Mock Storage Module (mock-storage.mjs)', () => {
    it('implements complete LocalStorage API with snapshots and global install', () => {
      const storage = createMockStorage({ initialKey: 'initVal' });
      expect(storage.getItem('initialKey')).toBe('initVal');
      expect(storage.length).toBe(1);

      storage.setItem('user_pref', JSON.stringify({ theme: 'dark' }));
      expect(storage.length).toBe(2);
      expect(storage.hasItem('user_pref')).toBe(true);

      const dumped = storage.dump();
      expect(dumped.initialKey).toBe('initVal');

      storage.removeItem('initialKey');
      expect(storage.getItem('initialKey')).toBeNull();

      storage.clear();
      expect(storage.length).toBe(0);

      // Global install/uninstall
      storage.installGlobally();
      globalThis.localStorage.setItem('global_test', '123');
      expect(storage.getItem('global_test')).toBe('123');
      storage.uninstall();
    });
  });

  describe('5. Mock Supabase Module (mock-supabase.mjs)', () => {
    it('executes in-memory table inserts and select queries', async () => {
      const supabase = createMockSupabaseClient();
      const submission = {
        name: 'Alice Cooper',
        email: 'alice@example.com',
        category: 'Hackathon Collaborations',
        message: 'Looking forward to building resilient systems together.',
      };

      const insertRes = await supabase.from('contact_submissions').insert(submission).select();
      expect(insertRes.error).toBeNull();
      expect(insertRes.data).toHaveLength(1);
      expect(insertRes.data[0].name).toBe('Alice Cooper');
      expect(insertRes.data[0].id).toBeDefined();

      const selectRes = await supabase
        .from('contact_submissions')
        .select('*')
        .eq('email', 'alice@example.com');
      expect(selectRes.error).toBeNull();
      expect(selectRes.data).toHaveLength(1);
      expect(selectRes.data[0].category).toBe('Hackathon Collaborations');
    });

    it('simulates offline disconnection and network failures', async () => {
      const supabase = createMockSupabaseClient({ offline: true });
      const res = await supabase.from('contact_submissions').insert({ name: 'Bob' });

      expect(res.data).toBeNull();
      expect(res.error).toBeDefined();
      expect(res.error.code).toBe('ECONNREFUSED');
      expect(res.error.message).toContain('offline');
    });
  });

  describe('6. Mock GitHub Service Module (mock-github.mjs)', () => {
    it('loads default mock repositories and handles requests', async () => {
      const gh = createMockGitHubService();
      expect(gh.repos.length).toBeGreaterThanOrEqual(3);

      const response = await gh.handleRequest('https://api.github.com/users/DevEagleEye97/repos');
      expect(response.status).toBe(200);
      expect(response.headers.get('x-ratelimit-remaining')).toBe('58');

      const data = await response.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.some((r) => r.name === 'ForensIQ')).toBe(true);
    });

    it('simulates rate limiting headers and offline network faults', async () => {
      const gh = createMockGitHubService();

      gh.setRateLimited(true);
      const rateLimitedRes = await gh.handleRequest('https://api.github.com/users/DevEagleEye97/repos');
      expect(rateLimitedRes.status).toBe(403);
      expect(rateLimitedRes.headers.get('x-ratelimit-remaining')).toBe('0');

      gh.reset();
      gh.setOffline(true);
      await expect(async () => {
        await gh.handleRequest('https://api.github.com/users/DevEagleEye97/repos');
      }).toThrow('offline');
    });

    it('intercepts global fetch and cleanly uninstalls', async () => {
      const gh = createMockGitHubService();
      gh.installGlobalFetchInterceptor();

      const res = await fetch('https://api.github.com/users/DevEagleEye97/repos');
      expect(res.status).toBe(200);

      gh.uninstallGlobalFetchInterceptor();
    });
  });

  describe('7. Static Fixtures Verification (fixtures/)', () => {
    it('validates valid-contact.json exists and conforms to schema', () => {
      const filePath = path.join(fixturesDir, 'valid-contact.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content).toHaveProperty('name');
      expect(content).toHaveProperty('email');
      expect(content).toHaveProperty('category');
      expect(content).toHaveProperty('message');
      expect(content.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      expect(content.message.length).toBeGreaterThanOrEqual(10);
    });

    it('validates invalid-contact.json test cases', () => {
      const filePath = path.join(fixturesDir, 'invalid-contact.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(content).toHaveProperty('missingName');
      expect(content).toHaveProperty('invalidEmail');
      expect(content).toHaveProperty('invalidCategory');
      expect(content).toHaveProperty('messageTooShort');
      expect(Array.isArray(content.cases)).toBe(true);
    });

    it('validates github-repos-mock.json repository format', () => {
      const filePath = path.join(fixturesDir, 'github-repos-mock.json');
      expect(fs.existsSync(filePath)).toBe(true);

      const repos = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      expect(Array.isArray(repos)).toBe(true);
      expect(repos.length).toBeGreaterThan(0);

      const repo = repos[0];
      expect(repo).toHaveProperty('id');
      expect(repo).toHaveProperty('name');
      expect(repo).toHaveProperty('html_url');
      expect(repo).toHaveProperty('stargazers_count');
      expect(repo).toHaveProperty('forks_count');
    });
  });

});
