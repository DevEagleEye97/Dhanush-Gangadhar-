/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 05: Build Stabilization (next.config.ts & build hardening)
 *
 * Verifies that next.config.ts disables poweredByHeader and experimental features that cause
 * Windows EPERM file collisions, configures Turbopack for Tailwind v4, and ensures offline resilience.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 05: Build Stabilization (Tier 1)', () => {
  const nextConfigPath = path.resolve(projectRoot, 'next.config.ts');
  const githubLibPath = path.resolve(projectRoot, 'src', 'lib', 'github.ts');

  it('T1-F05-01: Verify next.config.ts exists and disables poweredByHeader', () => {
    expect(fs.existsSync(nextConfigPath)).toBe(true);
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    expect(content).toMatch(/poweredByHeader:\s*false/);
  });

  it('T1-F05-02: Verify next.config.ts stabilizes prerendering by disabling cacheComponents and partialPrefetching', () => {
    expect(fs.existsSync(nextConfigPath)).toBe(true);
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    expect(content).toMatch(/cacheComponents:\s*false/);
    expect(content).toMatch(/partialPrefetching:\s*false/);
  });

  it('T1-F05-03: Verify Turbopack CSS loader rule for Tailwind v4 in next.config.ts', () => {
    expect(fs.existsSync(nextConfigPath)).toBe(true);
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    expect(content).toContain('@tailwindcss/turbopack');
    expect(content).toMatch(/turbopack:\s*\{/);
  });

  it('T1-F05-04: Verify src/lib/github.ts contains offline fallback repositories', () => {
    expect(fs.existsSync(githubLibPath)).toBe(true);
    const content = fs.readFileSync(githubLibPath, 'utf8');
    expect(content).toContain('STATIC_FALLBACK_REPOS');
    expect(content).toContain('getPublicRepositories');
  });

  it('T1-F05-05: Verify static concurrency and retry controls in next.config.ts', () => {
    expect(fs.existsSync(nextConfigPath)).toBe(true);
    const content = fs.readFileSync(nextConfigPath, 'utf8');
    expect(content).toMatch(/staticGenerationMaxConcurrency:\s*1/);
    expect(content).toMatch(/staticGenerationRetryCount:\s*3/);
  });
});
