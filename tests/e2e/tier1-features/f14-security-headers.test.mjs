/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 14: Security Headers & Strict CSP (src/config/security-headers.ts & next.config.ts)
 *
 * Verifies strict HTTP security headers: Content-Security-Policy (default-src 'self'),
 * HSTS (max-age=63072000), X-Frame-Options (DENY), X-Content-Type-Options (nosniff), and Referrer-Policy.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 14: Security Headers & Strict CSP (Tier 1)', () => {
  const nextConfigPath = path.resolve(projectRoot, 'next.config.ts');
  const secHeadersPath = path.resolve(projectRoot, 'src', 'config', 'security-headers.ts');

  function getSecurityHeaderConfig() {
    let source = '';
    if (fs.existsSync(secHeadersPath)) {
      source = fs.readFileSync(secHeadersPath, 'utf8');
    } else if (fs.existsSync(nextConfigPath)) {
      source = fs.readFileSync(nextConfigPath, 'utf8');
    }
    return source;
  }

  it("T1-F14-01: Verify Content-Security-Policy header presence and default-src 'self'", () => {
    const configText = getSecurityHeaderConfig();
    expect(configText).toContain('Content-Security-Policy');
    expect(configText).toContain("default-src 'self'");
  });

  it('T1-F14-02: Verify Strict-Transport-Security (HSTS) header configuration', () => {
    const configText = getSecurityHeaderConfig();
    expect(configText).toContain('Strict-Transport-Security');
    expect(configText).toContain('max-age=63072000');
  });

  it("T1-F14-03: Verify X-Frame-Options: DENY and frame-ancestors 'none'", () => {
    const configText = getSecurityHeaderConfig();
    expect(configText).toContain('X-Frame-Options');
    expect(configText).toContain('DENY');
    expect(configText).toContain("frame-ancestors 'none'");
  });

  it('T1-F14-04: Verify X-Content-Type-Options: nosniff', () => {
    const configText = getSecurityHeaderConfig();
    expect(configText).toContain('X-Content-Type-Options');
    expect(configText).toContain('nosniff');
  });

  it('T1-F14-05: Verify Referrer-Policy: strict-origin-when-cross-origin', () => {
    const configText = getSecurityHeaderConfig();
    expect(configText).toContain('Referrer-Policy');
    expect(configText).toContain('strict-origin-when-cross-origin');
  });
});
