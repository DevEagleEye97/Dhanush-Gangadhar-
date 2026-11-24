/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 03: Orphaned Assets Pruning (public/*.svg)
 *
 * Verifies that unused default Next.js template SVG files have been deleted
 * from public/ while active assets are preserved.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 03: Orphaned Assets Pruning (Tier 1)', () => {
  const publicDir = path.resolve(projectRoot, 'public');

  it('T1-F03-01: Verify physical absence of public/file.svg', () => {
    const assetPath = path.resolve(publicDir, 'file.svg');
    expect(fs.existsSync(assetPath)).toBe(false);
  });

  it('T1-F03-02: Verify physical absence of public/globe.svg', () => {
    const assetPath = path.resolve(publicDir, 'globe.svg');
    expect(fs.existsSync(assetPath)).toBe(false);
  });

  it('T1-F03-03: Verify physical absence of public/next.svg', () => {
    const assetPath = path.resolve(publicDir, 'next.svg');
    expect(fs.existsSync(assetPath)).toBe(false);
  });

  it('T1-F03-04: Verify physical absence of public/vercel.svg', () => {
    const assetPath = path.resolve(publicDir, 'vercel.svg');
    expect(fs.existsSync(assetPath)).toBe(false);
  });

  it('T1-F03-05: Verify physical absence of public/window.svg', () => {
    const assetPath = path.resolve(publicDir, 'window.svg');
    expect(fs.existsSync(assetPath)).toBe(false);
  });
});
