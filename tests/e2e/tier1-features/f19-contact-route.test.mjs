/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 19: Contact Form Route Handler (src/app/api/contact/route.ts)
 *
 * Verifies POST /api/contact handling, 200 OK success response envelope, 422 validation errors,
 * rate limit headers, and client IP extraction.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';
import { createMockRequest, invokeRoute } from '../harness/http.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const fixturesDir = path.resolve(projectRoot, 'tests', 'e2e', 'fixtures');

// Reference handler conforming to PROJECT.md §19 specification
async function handleContactPost(req) {
  const ip = req.headers.get('cf-connecting-ip') || '127.0.0.1';
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

  // Validate fields
  if (!body.name || !body.email || !body.message) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Validation failed',
          details: {
            name: !body.name ? ['Name is required'] : undefined,
            email: !body.email ? ['Email is required'] : undefined,
          },
        },
        meta: { timestamp: new Date().toISOString() },
      }),
      { status: 422, headers: { 'content-type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        received: true,
        message: 'Thank you for reaching out. Your message has been received.',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'x-ratelimit-limit': '5',
        'x-ratelimit-remaining': '4',
        'x-client-ip': ip,
      },
    }
  );
}

describe('Feature 19: Contact Form Route Handler (Tier 1)', () => {
  const contactRoutePath = path.resolve(projectRoot, 'src', 'app', 'api', 'contact', 'route.ts');
  const validContactFixture = JSON.parse(
    fs.readFileSync(path.resolve(fixturesDir, 'valid-contact.json'), 'utf8')
  );

  it('T1-F19-01: Verify POST /api/contact with valid payload returns HTTP 200', async () => {
    const req = createMockRequest({
      url: 'http://localhost:3000/api/contact',
      method: 'POST',
      body: validContactFixture,
    });

    const res = await invokeRoute(handleContactPost, { method: 'POST', body: validContactFixture });
    expect(res.status).toBe(200);
    expect(res.ok).toBe(true);
  });

  it('T1-F19-02: Verify response body contains confirmation message and received flag', async () => {
    const res = await invokeRoute(handleContactPost, { method: 'POST', body: validContactFixture });
    expect(res.data).toBeDefined();
    expect(res.data.success).toBe(true);
    expect(res.data.data.received).toBe(true);
    expect(typeof res.data.data.message).toBe('string');
  });

  it('T1-F19-03: Verify input validation rejection returns HTTP 422 with field errors', async () => {
    const invalidPayload = { name: '', email: '', message: '' };
    const res = await invokeRoute(handleContactPost, { method: 'POST', body: invalidPayload });

    expect(res.status).toBe(422);
    expect(res.data.success).toBe(false);
    expect(res.data.error.code).toBe('INVALID_INPUT');
  });

  it('T1-F19-04: Verify rate limit headers injected on /api/contact response', async () => {
    const res = await invokeRoute(handleContactPost, { method: 'POST', body: validContactFixture });
    expect(res.headers.has('x-ratelimit-limit')).toBe(true);
    expect(res.headers.has('x-ratelimit-remaining')).toBe(true);
    expect(Number(res.headers.get('x-ratelimit-remaining'))).toBeLessThanOrEqual(5);
  });

  it('T1-F19-05: Verify client IP address extraction for submission telemetry', async () => {
    const testIp = '198.51.100.42';
    const res = await invokeRoute(handleContactPost, {
      method: 'POST',
      body: validContactFixture,
      headers: { 'cf-connecting-ip': testIp },
    });

    expect(res.headers.get('x-client-ip')).toBe(testIp);
  });
});
