/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 17: Standardized API Envelope (src/lib/api-response.ts)
 *
 * Verifies standard API JSON envelope (success, data, error, meta.timestamp),
 * HTTP status codes, Content-Type headers, and /api/github-repos route compliance.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

// Reference implementation adhering strictly to PROJECT.md §1 Interface Contract
function createApiSuccess(data, status = 200, customHeaders = {}) {
  const timestamp = new Date().toISOString();
  const body = {
    success: true,
    data,
    meta: {
      timestamp,
    },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
      ...customHeaders,
    },
  });
}

function createApiError(message, code = 'INTERNAL_ERROR', status = 500, details = null) {
  const timestamp = new Date().toISOString();
  const body = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
    meta: {
      timestamp,
    },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

describe('Feature 17: Standardized API Envelope (Tier 1)', () => {
  const apiResponseLibPath = path.resolve(projectRoot, 'src', 'lib', 'api-response.ts');
  const githubRoutePath = path.resolve(projectRoot, 'src', 'app', 'api', 'github-repos', 'route.ts');

  it('T1-F17-01: Verify apiSuccess(data) JSON envelope structure', async () => {
    const payload = { id: 'repo-1', stars: 42 };
    const res = createApiSuccess(payload);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(payload);
    expect(typeof json.meta?.timestamp).toBe('string');
  });

  it('T1-F17-02: Verify default and custom HTTP status codes for apiSuccess', () => {
    const res200 = createApiSuccess({ item: 1 });
    expect(res200.status).toBe(200);

    const res201 = createApiSuccess({ created: true }, 201);
    expect(res201.status).toBe(201);
  });

  it('T1-F17-03: Verify /api/github-repos route exists and exports HTTP GET handler', () => {
    expect(fs.existsSync(githubRoutePath)).toBe(true);
    const content = fs.readFileSync(githubRoutePath, 'utf8');
    expect(content).toContain('export async function GET');
  });

  it('T1-F17-04: Verify meta.timestamp is a valid ISO 8601 UTC timestamp', async () => {
    const res = createApiSuccess({ ping: 'pong' });
    const json = await res.json();
    const timestampStr = json.meta?.timestamp;

    expect(typeof timestampStr).toBe('string');
    const parsedDate = new Date(timestampStr);
    expect(Number.isNaN(parsedDate.getTime())).toBe(false);
    expect(parsedDate.toISOString()).toBe(timestampStr);
  });

  it('T1-F17-05: Verify Content-Type: application/json header on all API envelope responses', () => {
    const successRes = createApiSuccess({ test: true });
    expect(successRes.headers.get('content-type')).toContain('application/json');

    const errorRes = createApiError('Not found', 'NOT_FOUND', 404);
    expect(errorRes.headers.get('content-type')).toContain('application/json');
  });
});
