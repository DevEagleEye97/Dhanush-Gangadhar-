/**
 * Hermetic GitHub REST API Mock for E2E Test Suite
 * Emulates GitHub API endpoints, rate limiting headers, offline modes, and global fetch interception
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultFixturesPath = path.resolve(__dirname, '..', 'fixtures', 'github-repos-mock.json');

export class MockGitHubService {
  constructor(options = {}) {
    this.isOffline = Boolean(options.offline);
    this.isRateLimited = Boolean(options.rateLimited);
    this.status = options.status || 200;
    this.repos = this._loadDefaultRepos();
    this.callCount = 0;
    this.lastRequest = null;
    this._originalFetch = null;
  }

  _loadDefaultRepos() {
    try {
      if (fs.existsSync(defaultFixturesPath)) {
        return JSON.parse(fs.readFileSync(defaultFixturesPath, 'utf-8'));
      }
    } catch {
      // Fallback if file read fails
    }
    return [];
  }

  setOffline(offline = true) {
    this.isOffline = Boolean(offline);
    return this;
  }

  setRateLimited(rateLimited = true) {
    this.isRateLimited = Boolean(rateLimited);
    return this;
  }

  setRepos(repos) {
    this.repos = Array.isArray(repos) ? repos : [];
    return this;
  }

  reset() {
    this.isOffline = false;
    this.isRateLimited = false;
    this.status = 200;
    this.repos = this._loadDefaultRepos();
    this.callCount = 0;
    this.lastRequest = null;
  }

  async handleRequest(url, options = {}) {
    this.callCount++;
    this.lastRequest = { url: String(url), options };

    if (this.isOffline) {
      const error = new TypeError('fetch failed: network offline (ECONNREFUSED)');
      error.cause = { code: 'ECONNREFUSED' };
      throw error;
    }

    if (this.isRateLimited) {
      return new Response(
        JSON.stringify({
          message: "API rate limit exceeded for user (But here's the good news: Authenticated requests get a higher rate limit.)",
          documentation_url: "https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting"
        }),
        {
          status: 403,
          headers: {
            'content-type': 'application/json; charset=utf-8',
            'x-ratelimit-limit': '60',
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
          },
        }
      );
    }

    return new Response(JSON.stringify(this.repos), {
      status: this.status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'x-ratelimit-limit': '60',
        'x-ratelimit-remaining': '58',
        'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600),
      },
    });
  }

  installGlobalFetchInterceptor() {
    this._originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      const urlString = typeof input === 'string' ? input : input?.url || '';
      if (urlString.includes('api.github.com')) {
        return this.handleRequest(urlString, init);
      }
      if (this._originalFetch) {
        return this._originalFetch.call(globalThis, input, init);
      }
      throw new Error(`Unhandled external fetch to ${urlString} in hermetic test mode`);
    };
    return this;
  }

  uninstallGlobalFetchInterceptor() {
    if (this._originalFetch) {
      globalThis.fetch = this._originalFetch;
      this._originalFetch = null;
    }
  }
}

export function createMockGitHubService(options = {}) {
  return new MockGitHubService(options);
}

export default MockGitHubService;
