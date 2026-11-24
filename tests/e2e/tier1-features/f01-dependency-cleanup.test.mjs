/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 01: Dependency Cleanup (package.json & package-lock.json)
 *
 * Verifies removal of unneeded libraries (clsx, tailwind-merge) and
 * preservation of required core runtime packages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 01: Dependency Cleanup (Tier 1)', () => {
  const pkgPath = path.resolve(projectRoot, 'package.json');

  it('T1-F01-01: Verify clsx is removed from package.json dependencies', () => {
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.dependencies?.clsx).toBeUndefined();
  });

  it('T1-F01-02: Verify tailwind-merge is removed from package.json dependencies', () => {
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.dependencies?.['tailwind-merge']).toBeUndefined();
  });

  it('T1-F01-03: Verify required peer runtime dependencies react and react-dom remain present', () => {
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    expect(pkg.dependencies?.react).toBeDefined();
    expect(pkg.dependencies?.['react-dom']).toBeDefined();
    expect(String(pkg.dependencies.react)).toMatch(/19/);
    expect(String(pkg.dependencies['react-dom'])).toMatch(/19/);
  });

  it('T1-F01-04: Verify active UI dependencies (gsap, lenis, lucide-react, next-themes) are retained', () => {
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const deps = pkg.dependencies || {};
    expect(deps.gsap).toBeDefined();
    expect(deps.lenis).toBeDefined();
    expect(deps['lucide-react']).toBeDefined();
    expect(deps['next-themes']).toBeDefined();
  });

  it('T1-F01-05: Verify runtime dependency resolution integrity in package manifest', () => {
    expect(fs.existsSync(pkgPath)).toBe(true);
    const content = fs.readFileSync(pkgPath, 'utf8');
    const pkg = JSON.parse(content);
    expect(pkg.name).toBe('portfolio');
    expect(typeof pkg.dependencies).toBe('object');
    expect(typeof pkg.devDependencies).toBe('object');
    // Ensure no null or empty dependency keys
    const depKeys = Object.keys(pkg.dependencies);
    expect(depKeys.length).toBeGreaterThanOrEqual(4);
    for (const key of depKeys) {
      expect(typeof pkg.dependencies[key]).toBe('string');
      expect(pkg.dependencies[key].length).toBeGreaterThan(0);
    }
  });
});
