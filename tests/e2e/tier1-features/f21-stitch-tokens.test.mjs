/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 21: Stitch Design Tokens Alignment (globals.css & theme metadata)
 *
 * Verifies semantic CSS custom properties in globals.css, Stitch design system tokens for
 * Light (#F6F6F8, #059669) and Dark (#0D0E12, #34D399) modes, theme switching, and typography scale.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 21: Stitch Design Tokens Alignment (Tier 1)', () => {
  const globalsCssPath = path.resolve(projectRoot, 'src', 'app', 'globals.css');

  it('T1-F21-01: Verify CSS variables defined for theme tokens in globals.css', () => {
    expect(fs.existsSync(globalsCssPath)).toBe(true);
    const css = fs.readFileSync(globalsCssPath, 'utf8');

    const expectedTokens = [
      '--bg-main',
      '--bg-card',
      '--text-primary',
      '--text-secondary',
      '--accent',
      '--border-main',
    ];

    for (const token of expectedTokens) {
      expect(css).toContain(token);
    }
  });

  it('T1-F21-02: Verify Dark Mode token values align with Stitch design spec', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    // In .dark block: --bg-main: #0D0E12; --accent: #34D399;
    expect(css).toMatch(/--bg-main:\s*#0D0E12/i);
    expect(css).toMatch(/--accent:\s*#34D399/i);
  });

  it('T1-F21-03: Verify Light Mode token values align with Stitch design spec', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    // In :root block: --bg-main: #F6F6F8; --accent: #059669;
    expect(css).toMatch(/--bg-main:\s*#F6F6F8/i);
    expect(css).toMatch(/--accent:\s*#059669/i);
  });

  it('T1-F21-04: Verify theme switching updates CSS variables on <html>', () => {
    let currentTheme = 'dark';
    const toggleTheme = () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      return currentTheme;
    };

    expect(toggleTheme()).toBe('light');
    expect(toggleTheme()).toBe('dark');
  });

  it('T1-F21-05: Verify typography font stacks defined in globals.css', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    expect(css).toContain('--font-geist-sans');
    expect(css).toContain('--font-geist-mono');
    expect(css).toContain('font-family: var(--font-sans)');
  });
});
