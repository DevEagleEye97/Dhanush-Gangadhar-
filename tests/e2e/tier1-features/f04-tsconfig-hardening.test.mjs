/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 04: TypeScript Config Hardening (tsconfig.json)
 *
 * Verifies that tsconfig.json excludes external agent skills and node_modules,
 * enforces strict type safety, preserves @/* path aliases, and includes App Router types.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 04: TypeScript Config Hardening (Tier 1)', () => {
  const tsconfigPath = path.resolve(projectRoot, 'tsconfig.json');

  it('T1-F04-01: Verify tsconfig.json exclude array contains ".agents"', () => {
    expect(fs.existsSync(tsconfigPath)).toBe(true);
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(Array.isArray(tsconfig.exclude)).toBe(true);
    expect(tsconfig.exclude).toContain('.agents');
  });

  it('T1-F04-02: Verify tsconfig.json exclude array contains "node_modules"', () => {
    expect(fs.existsSync(tsconfigPath)).toBe(true);
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(Array.isArray(tsconfig.exclude)).toBe(true);
    expect(tsconfig.exclude).toContain('node_modules');
  });

  it('T1-F04-03: Verify compilerOptions strictness and noEmit settings', () => {
    expect(fs.existsSync(tsconfigPath)).toBe(true);
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(tsconfig.compilerOptions?.strict).toBe(true);
    expect(tsconfig.compilerOptions?.noEmit).toBe(true);
  });

  it('T1-F04-04: Verify @/* path alias resolution is maintained in tsconfig.json', () => {
    expect(fs.existsSync(tsconfigPath)).toBe(true);
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(tsconfig.compilerOptions?.paths).toBeDefined();
    expect(tsconfig.compilerOptions?.paths['@/*']).toEqual(['./src/*']);
  });

  it('T1-F04-05: Verify App Router types inclusion in tsconfig.json include list', () => {
    expect(fs.existsSync(tsconfigPath)).toBe(true);
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(Array.isArray(tsconfig.include)).toBe(true);
    expect(tsconfig.include).toContain('.next/types/**/*.ts');
  });
});
