/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 02: Dead Code Removal (ScrollToTop.tsx)
 *
 * Verifies that unused legacy ScrollToTop component is removed and
 * has zero residual imports or references across src/, with Footer retaining its inline control.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

function collectSourceFiles(dir) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(full));
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.js') || entry.name.endsWith('.jsx'))) {
      files.push(full);
    }
  }
  return files;
}

describe('Feature 02: Dead Code Removal (Tier 1)', () => {
  const deadFilePath = path.resolve(projectRoot, 'src', 'components', 'ScrollToTop.tsx');
  const srcDir = path.resolve(projectRoot, 'src');
  const footerPath = path.resolve(projectRoot, 'src', 'components', 'Footer.tsx');

  it('T1-F02-01: Verify physical absence of src/components/ScrollToTop.tsx', () => {
    expect(fs.existsSync(deadFilePath)).toBe(false);
  });

  it('T1-F02-02: Verify 0 import references to ScrollToTop across entire src/ directory', () => {
    const sourceFiles = collectSourceFiles(srcDir);
    const importRegex = /from\s+['"][^'"]*ScrollToTop['"]/i;
    const matches = [];

    for (const file of sourceFiles) {
      const code = fs.readFileSync(file, 'utf8');
      if (importRegex.test(code)) {
        matches.push(path.relative(projectRoot, file));
      }
    }

    expect(matches).toEqual([]);
  });

  it('T1-F02-03: Verify 0 usage references to <ScrollToTopButton across entire src/ directory', () => {
    const sourceFiles = collectSourceFiles(srcDir);
    const usageRegex = /<ScrollToTopButton/i;
    const matches = [];

    for (const file of sourceFiles) {
      const code = fs.readFileSync(file, 'utf8');
      if (usageRegex.test(code)) {
        matches.push(path.relative(projectRoot, file));
      }
    }

    expect(matches).toEqual([]);
  });

  it('T1-F02-04: Verify active inline scroll-to-top button in Footer.tsx exists and renders', () => {
    expect(fs.existsSync(footerPath)).toBe(true);
    const footerCode = fs.readFileSync(footerPath, 'utf8');
    expect(footerCode).toContain('scrollToTop');
    expect(footerCode).toContain('aria-label="Scroll to top"');
  });

  it('T1-F02-05: Verify absence of dangling ScrollToTop exports in component barrel or manifests', () => {
    const componentsDir = path.resolve(projectRoot, 'src', 'components');
    const compFiles = collectSourceFiles(componentsDir);
    const exportRegex = /export\s+.*\bScrollToTop\b/;

    for (const file of compFiles) {
      const code = fs.readFileSync(file, 'utf8');
      expect(exportRegex.test(code)).toBe(false);
    }
  });
});
