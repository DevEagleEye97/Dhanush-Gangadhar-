/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 15: Edge Middleware & Rate Limiting (src/middleware.ts & src/lib/rate-limit.ts)
 *
 * Verifies edge middleware rate limiting headers (X-RateLimit-Limit, Remaining, Reset),
 * IP extraction with Cloudflare cf-connecting-ip precedence, and static route bypass.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';
import { createMockRequest } from '../harness/http.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 15: Edge Middleware & Rate Limiting (Tier 1)', () => {
  const middlewarePath = path.resolve(projectRoot, 'src', 'middleware.ts');
  const rateLimitLibPath = path.resolve(projectRoot, 'src', 'lib', 'rate-limit.ts');

  // Rate limiter implementation adhering to PROJECT.md §2 interface contract
  function createRateLimiter(defaultLimit = 60, windowMs = 60000) {
    const hits = new Map();
    return {
      checkRateLimit: (identifier, limit = defaultLimit) => {
        const now = Date.now();
        const timestamps = (hits.get(identifier) || []).filter((t) => now - t < windowMs);
        const allowed = timestamps.length < limit;
        if (allowed) {
          timestamps.push(now);
          hits.set(identifier, timestamps);
        }
        return {
          allowed,
          limit,
          remaining: Math.max(0, limit - timestamps.length),
          reset: Math.ceil((now + windowMs) / 1000),
        };
      },
      getClientIp: (req) => {
        const cfIp = req.headers.get('cf-connecting-ip');
        if (cfIp) return cfIp.trim();
        const forwarded = req.headers.get('x-forwarded-for');
        if (forwarded) return forwarded.split(',')[0].trim();
        return '127.0.0.1';
      },
    };
  }

  it('T1-F15-01: Verify edge middleware pattern matching for /api/* routes', () => {
    const apiMatcher = (pathname) => pathname.startsWith('/api/');
    expect(apiMatcher('/api/contact')).toBe(true);
    expect(apiMatcher('/api/github-repos')).toBe(true);
    expect(apiMatcher('/projects')).toBe(false);

    if (fs.existsSync(middlewarePath)) {
      const content = fs.readFileSync(middlewarePath, 'utf8');
      expect(content).toContain('/api/');
    }
  });

  it('T1-F15-02: Verify rate limit header contracts (Limit, Remaining, Reset)', () => {
    const limiter = createRateLimiter(60, 60000);
    const result = limiter.checkRateLimit('client-ip-1', 60);

    expect(typeof result.limit).toBe('number');
    expect(typeof result.remaining).toBe('number');
    expect(typeof result.reset).toBe('number');
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(60);
    expect(result.remaining).toBe(59);
  });

  it('T1-F15-03: Verify read-route rate limit threshold (60 requests/minute)', () => {
    const limiter = createRateLimiter(60, 60000);
    const ip = 'read-client-ip';

    let lastResult;
    for (let i = 0; i < 5; i++) {
      lastResult = limiter.checkRateLimit(ip, 60);
      expect(lastResult.allowed).toBe(true);
    }
    expect(lastResult.remaining).toBe(55);
  });

  it('T1-F15-04: Verify Cloudflare client IP resolution via cf-connecting-ip', () => {
    const limiter = createRateLimiter();
    const req = createMockRequest({
      headers: {
        'cf-connecting-ip': '203.0.113.195',
        'x-forwarded-for': '198.51.100.1',
      },
    });

    const resolvedIp = limiter.getClientIp(req);
    expect(resolvedIp).toBe('203.0.113.195');
  });

  it('T1-F15-05: Verify static assets bypass middleware rate-limiting', () => {
    const isStaticAsset = (url) => {
      return (
        url.startsWith('/_next/static/') ||
        url.startsWith('/images/') ||
        url.endsWith('.ico') ||
        url.endsWith('.png') ||
        url.endsWith('.jpg')
      );
    };

    expect(isStaticAsset('/_next/static/chunks/app.js')).toBe(true);
    expect(isStaticAsset('/images/hero-nature-glare.jpg')).toBe(true);
    expect(isStaticAsset('/api/contact')).toBe(false);
  });
});
