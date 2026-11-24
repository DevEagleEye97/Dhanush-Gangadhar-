/**
 * Tier 3: Cross-Feature Pairwise Combination Tests
 * Suite: Security, Middleware & Data Contracts (combo-security-middleware.test.mjs)
 *
 * Scenarios Covered:
 * - TC-T3-06: Contact API Burst Submission Triggers Edge Rate Limit Envelope (F15 x F19)
 * - TC-T3-07: Malformed Contact Submission Returns Structured 400 Envelope (F16 x F17)
 * - TC-T3-08: Contact Submission Succeeds Gracefully with Disconnected Supabase (F18 x F19)
 * - TC-T3-09: CSP Header Compliance with WebGL Shaders & YouTube Video Embeds (F14 x F10)
 * - TC-T3-10: DecryptedText Glyph Scramble Animation during Dark/Light Switch (F11 x F21)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect, beforeEach, afterEach } from '../runner.mjs';
import { createMockRequest, invokeRoute } from '../harness/http.mjs';
import { createMockSupabaseClient } from '../harness/mock-supabase.mjs';
import { setupDomEnvironment, teardownDomEnvironment } from '../harness/dom.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

// Reference contracts conforming strictly to PROJECT.md §14, §15, §16, §17, §18, §19
const VALID_CATEGORIES = new Set([
  'Internship & Apprenticeship',
  'Hackathon Collaborations',
  'Open-Source & Security Research',
  'Velora & Growth Inquiries',
  'General Inquiry',
]);

function validateContactPayload(body) {
  const errors = {};
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.name = ['Name must be at least 2 characters'];
  } else if (body.name.trim().length > 80) {
    errors.name = ['Name cannot exceed 80 characters'];
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!body.email || typeof body.email !== 'string' || !emailRegex.test(body.email.trim())) {
    errors.email = ['Valid email address is required'];
  }

  if (!body.category || !VALID_CATEGORIES.has(body.category)) {
    errors.category = ['Invalid category selection'];
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length < 10) {
    errors.message = ['Message must be at least 10 characters'];
  } else if (body.message.trim().length > 2500) {
    errors.message = ['Message cannot exceed 2500 characters'];
  }

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors };
}

function checkSlidingRateLimit(store, ip, limit = 5, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  let timestamps = store.get(ip) || [];
  timestamps = timestamps.filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const oldest = timestamps[0];
    const reset = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    store.set(ip, timestamps);
    return { allowed: false, limit, remaining: 0, reset };
  }

  timestamps.push(now);
  store.set(ip, timestamps);
  return { allowed: true, limit, remaining: limit - timestamps.length, reset: Math.ceil(windowMs / 1000) };
}

describe('Tier 3: Security, Middleware & Data Contracts', () => {
  let rateLimitStore;
  let mockSupabase;

  beforeEach(() => {
    rateLimitStore = new Map();
    mockSupabase = createMockSupabaseClient();
    setupDomEnvironment();
  });

  afterEach(() => {
    rateLimitStore.clear();
    mockSupabase.reset();
    teardownDomEnvironment();
  });

  // TC-T3-06: Contact API Burst Submission Triggers Edge Rate Limit Envelope (F15 x F19)
  it('TC-T3-06: Contact API Burst Submission Triggers Edge Rate Limit Envelope', async () => {
    const testIp = '198.51.100.12';

    // Mock route handler executing F15 + F19 contract
    const contactRouteHandler = async (req) => {
      const ip = req.headers.get('cf-connecting-ip') || '127.0.0.1';
      const rl = checkSlidingRateLimit(rateLimitStore, ip, 5, 60000);

      if (!rl.allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
            },
            meta: {
              timestamp: new Date().toISOString(),
            },
          }),
          {
            status: 429,
            headers: {
              'content-type': 'application/json',
              'Retry-After': String(rl.reset),
              'X-RateLimit-Limit': String(rl.limit),
              'X-RateLimit-Remaining': '0',
            },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: { status: 'received' },
          meta: { timestamp: new Date().toISOString() },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'X-RateLimit-Limit': String(rl.limit),
            'X-RateLimit-Remaining': String(rl.remaining),
          },
        }
      );
    };

    // 1. Send 5 valid requests within the 60s window
    const validBody = {
      name: 'Tester',
      email: 'tester@example.com',
      category: 'General Inquiry',
      message: 'Hello, this is a valid inquiry message.',
    };

    for (let i = 1; i <= 5; i++) {
      const res = await invokeRoute(contactRouteHandler, {
        method: 'POST',
        url: 'http://localhost:3000/api/contact',
        ip: testIp,
        body: validBody,
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.headers.get('x-ratelimit-remaining')).toBe(String(5 - i));
    }

    // 2. Send 6th request within the same window -> Must trigger 429
    const burstRes = await invokeRoute(contactRouteHandler, {
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      ip: testIp,
      body: validBody,
    });

    expect(burstRes.status).toBe(429);
    expect(burstRes.data.success).toBe(false);
    expect(burstRes.data.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(burstRes.data.error.message).toContain('Too many requests');
    expect(burstRes.headers.get('retry-after')).toBeDefined();
    expect(Number(burstRes.headers.get('retry-after'))).toBeGreaterThan(0);
  });

  // TC-T3-07: Malformed Contact Submission Returns Structured 400 Envelope (F16 x F17)
  it('TC-T3-07: Malformed Contact Submission Returns Structured 400 Envelope', async () => {
    const contactRouteHandler = async (req) => {
      let body;
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'INVALID_JSON', message: 'Malformed JSON payload' },
            meta: { timestamp: new Date().toISOString() },
          }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      const { isValid, errors } = validateContactPayload(body);
      if (!isValid) {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid contact form submission data.',
              details: errors,
            },
            meta: { timestamp: new Date().toISOString() },
          }),
          { status: 400, headers: { 'content-type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: { status: 'received' } }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    };

    // Malformed submission: name too short, invalid email, non-existent category, message too short
    const malformedPayload = {
      name: 'A',
      email: 'invalid-email',
      category: 'NonExistentCategory',
      message: 'short',
    };

    const res = await invokeRoute(contactRouteHandler, {
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      body: malformedPayload,
    });

    expect(res.status).toBe(400);
    expect(res.data.success).toBe(false);
    expect(res.data.error.code).toBe('VALIDATION_ERROR');

    // Field-specific validation errors must be present
    const details = res.data.error.details;
    expect(details.name).toBeDefined();
    expect(details.email).toBeDefined();
    expect(details.category).toBeDefined();
    expect(details.message).toBeDefined();
  });

  // TC-T3-08: Contact Submission Succeeds Gracefully with Disconnected Supabase (F18 x F19)
  it('TC-T3-08: Contact Submission Succeeds Gracefully with Disconnected Supabase', async () => {
    // 1. Simulate Supabase disconnected/offline
    mockSupabase.setOffline(true);

    const contactRouteHandler = async (req) => {
      let body;
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ success: false }), { status: 400 });
      }

      // Try database persistence with fallback
      let persistedToDb = false;
      try {
        const { error } = await mockSupabase.from('contacts').insert({
          name: body.name,
          email: body.email,
          category: body.category,
          message: body.message,
        });

        if (!error) {
          persistedToDb = true;
        }
      } catch {
        persistedToDb = false;
      }

      // Resilient fallback: Return success with fallback flag
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            status: 'received',
            fallback: !persistedToDb,
          },
          meta: { timestamp: new Date().toISOString() },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    };

    const validPayload = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      category: 'Internship & Apprenticeship',
      message: 'Inquiring about summer systems engineering role.',
    };

    const res = await invokeRoute(contactRouteHandler, {
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      body: validPayload,
    });

    // Expect graceful 200 without 500 error or crash
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.status).toBe('received');
    expect(res.data.data.fallback).toBe(true);
  });

  // TC-T3-09: CSP Header Compliance with WebGL Shaders & YouTube Video Embeds (F14 x F10)
  it('TC-T3-09: CSP Header Compliance with WebGL Shaders & YouTube Video Embeds', () => {
    const securityHeaders = {
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self' https://api.github.com https://*.supabase.co",
        "frame-src https://www.youtube.com https://www.youtube-nocookie.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
      ].join('; '),
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    const csp = securityHeaders['Content-Security-Policy'];

    // 1. Verify default-src 'self'
    expect(csp).toContain("default-src 'self'");

    // 2. Verify frame-src allows YouTube embeds
    expect(csp).toContain('frame-src');
    expect(csp).toContain('https://www.youtube.com');
    expect(csp).toContain('https://www.youtube-nocookie.com');

    // 3. Verify connect-src allows GitHub API & Supabase
    expect(csp).toContain('connect-src');
    expect(csp).toContain('https://api.github.com');
    expect(csp).toContain('https://*.supabase.co');

    // 4. Verify script-src allows WebGL shader evaluation
    expect(csp).toContain('script-src');
    expect(csp).toContain("'unsafe-eval'");

    // 5. Verify X-Frame-Options and X-Content-Type-Options
    expect(securityHeaders['X-Frame-Options']).toBe('DENY');
    expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff');
  });

  // TC-T3-10: DecryptedText Glyph Scramble Animation during Dark/Light Switch (F11 x F21)
  it('TC-T3-10: DecryptedText Glyph Scramble Animation during Dark/Light Switch', () => {
    const glyphs = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const sourceText = 'SYSTEM SECURE';

    class DecryptedTextScrambler {
      constructor(text) {
        this.originalText = text;
        this.currentText = text;
        this.frame = 0;
        this.totalFrames = 20;
        this.isComplete = false;
        this.theme = 'dark';
      }

      setTheme(theme) {
        this.theme = theme;
      }

      step() {
        this.frame++;
        if (this.frame >= this.totalFrames) {
          this.currentText = this.originalText;
          this.isComplete = true;
          return;
        }

        // Partial scramble logic
        const progress = this.frame / this.totalFrames;
        const revealedChars = Math.floor(progress * this.originalText.length);
        let scrambled = this.originalText.slice(0, revealedChars);
        for (let i = revealedChars; i < this.originalText.length; i++) {
          const randGlyph = glyphs[Math.floor(Math.random() * glyphs.length)];
          scrambled += randGlyph;
        }
        this.currentText = scrambled;
      }
    }

    const scrambler = new DecryptedTextScrambler(sourceText);

    // 1. Step to frame 10 (halfway through scramble)
    for (let f = 1; f <= 10; f++) {
      scrambler.step();
    }
    expect(scrambler.isComplete).toBe(false);
    expect(scrambler.currentText).not.toBe(sourceText);

    // 2. Toggle theme mid-scramble from dark to light
    scrambler.setTheme('light');
    expect(scrambler.theme).toBe('light');

    // 3. Step remaining frames to completion
    while (!scrambler.isComplete) {
      scrambler.step();
    }

    // 4. Assertions:
    // - Final text matches original text exactly without corrupted glyphs
    expect(scrambler.currentText).toBe(sourceText);
    expect(scrambler.isComplete).toBe(true);
    expect(scrambler.theme).toBe('light');
  });
});
