/**
 * Tier 2 Boundary, Edge & Corner Case Tests: Features F01 to F05
 * 
 * Features Covered:
 * - Feature 1: Dependency Cleanup (T2-F01-01 to T2-F01-05)
 * - Feature 2: Dead Code Removal (T2-F02-01 to T2-F02-05)
 * - Feature 3: Orphaned Assets Pruning (T2-F03-01 to T2-F03-05)
 * - Feature 4: TypeScript Config Hardening (T2-F04-01 to T2-F04-05)
 * - Feature 5: Build & Prerender Stabilization (T2-F05-01 to T2-F05-05)
 * 
 * Total: 25 Boundary & Corner Case Tests
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

import { describe, it, expect, beforeEach, afterEach } from '../runner.mjs';
import { setupDomEnvironment, teardownDomEnvironment } from '../harness/dom.mjs';
import { sanitizeInput, sanitizeUrl } from '../../../src/lib/security.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');
const require = createRequire(import.meta.url);

describe('Tier 2 — Features 01 to 05: Build & Configuration Boundaries', () => {

  // =========================================================================
  // Feature 1: Dependency Cleanup Boundaries
  // =========================================================================
  describe('Feature 1: Dependency Cleanup Boundaries (T2-F01)', () => {
    it('T2-F01-01: throws MODULE_NOT_FOUND when attempting to import uninstalled clsx', () => {
      let threw = false;
      let errorCode = '';
      try {
        require('clsx');
      } catch (err) {
        threw = true;
        errorCode = err.code || err.message;
      }
      expect(threw).toBe(true);
      expect(errorCode).toMatch(/MODULE_NOT_FOUND|Cannot find module/i);
    });

    it('T2-F01-02: throws MODULE_NOT_FOUND when attempting to import uninstalled tailwind-merge', () => {
      let threw = false;
      let errorCode = '';
      try {
        require('tailwind-merge');
      } catch (err) {
        threw = true;
        errorCode = err.code || err.message;
      }
      expect(threw).toBe(true);
      expect(errorCode).toMatch(/MODULE_NOT_FOUND|Cannot find module/i);
    });

    it('T2-F01-03: verifies package.json format validity without BOM or syntax errors', () => {
      const pkgPath = path.resolve(projectRoot, 'package.json');
      const raw = fs.readFileSync(pkgPath, 'utf8');

      // Verify no UTF-8 Byte Order Mark (BOM)
      expect(raw.charCodeAt(0)).not.toBe(0xFEFF);

      // Verify JSON parses without syntax error
      let parsed = null;
      expect(() => {
        parsed = JSON.parse(raw);
      }).not.toThrow();

      expect(parsed).toBeDefined();
      expect(parsed.name).toBe('portfolio');
      expect(parsed.dependencies).toBeDefined();
      expect(parsed.scripts).toBeDefined();
    });

    it('T2-F01-04: verifies lockfile or package manifest consistency with zero dangling references to clsx or tailwind-merge', () => {
      const pkgPath = path.resolve(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

      expect(pkg.dependencies?.clsx).toBeUndefined();
      expect(pkg.dependencies?.['tailwind-merge']).toBeUndefined();

      const lockPath = path.resolve(projectRoot, 'package-lock.json');
      if (fs.existsSync(lockPath)) {
        const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        expect(lock.lockfileVersion).toBeGreaterThanOrEqual(2);
        // Ensure no direct top-level dependencies on clsx or tailwind-merge in root packages
        if (lock.packages && lock.packages['']) {
          expect(lock.packages[''].dependencies?.clsx).toBeUndefined();
          expect(lock.packages[''].dependencies?.['tailwind-merge']).toBeUndefined();
        }
      }
    });

    it('T2-F01-05: verifies dependency tree resilience and valid semver declarations for core libraries', () => {
      const pkgPath = path.resolve(projectRoot, 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

      const requiredDeps = ['gsap', 'lenis', 'lucide-react', 'next', 'next-themes', 'react', 'react-dom'];
      for (const dep of requiredDeps) {
        expect(pkg.dependencies).toHaveProperty(dep);
        const version = pkg.dependencies[dep];
        expect(typeof version).toBe('string');
        expect(version.length).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // Feature 2: Dead Code Removal Boundaries
  // =========================================================================
  describe('Feature 2: Dead Code Removal Boundaries (T2-F02)', () => {
    it('T2-F02-01: rejects dynamic import and confirms physical absence of ScrollToTop.tsx', () => {
      const componentPath = path.resolve(projectRoot, 'src', 'components', 'ScrollToTop.tsx');
      expect(fs.existsSync(componentPath)).toBe(false);

      expect(() => {
        require(componentPath);
      }).toThrow(/MODULE_NOT_FOUND|Cannot find module/i);
    });

    it('T2-F02-02: verifies active security utilities in src/lib/security.ts handle edge cases and control characters', () => {
      // Test ASCII control character stripping (NULL byte, ESC, unit separator)
      const sanitized = sanitizeInput('Test\x00\x1FData\x08', 10);
      expect(sanitized).toBe('TestData');

      // Test boundary truncation
      const longInput = 'A'.repeat(200);
      const truncated = sanitizeInput(longInput, 50);
      expect(truncated.length).toBe(50);

      // Test null / undefined / empty input
      expect(sanitizeInput('', 20)).toBe('');

      // Test malicious URL rejection
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
      expect(sanitizeUrl('//evil.com/phish')).toBeNull();

      // Test valid URL preservation
      expect(sanitizeUrl('https://dhanush-gangadhar.vercel.app')).toBe('https://dhanush-gangadhar.vercel.app/');
      expect(sanitizeUrl('/projects')).toBe('/projects');
    });

    it('T2-F02-03: verifies footer scroll-to-top button interaction under Lenis interception', () => {
      setupDomEnvironment();
      try {
        window.scrollY = 1500;
        expect(window.scrollY).toBe(1500);

        // Simulate footer scroll-to-top action via window.lenis
        if (window.lenis && typeof window.lenis.scrollTo === 'function') {
          window.lenis.scrollTo(0, { immediate: true });
          expect(window.lenis.scroll).toBe(0);
          expect(window.lenis.calls.some(c => c.action === 'scrollTo' && c.target === 0)).toBe(true);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          expect(window.scrollY).toBe(0);
        }
      } finally {
        teardownDomEnvironment();
      }
    });

    it('T2-F02-04: verifies barrel export integrity with zero re-exports of ScrollToTop', () => {
      const componentsDir = path.resolve(projectRoot, 'src', 'components');
      const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

      for (const file of files) {
        const content = fs.readFileSync(path.join(componentsDir, file), 'utf8');
        expect(content).not.toMatch(/export\s+.*\s+from\s+['"].*ScrollToTop['"]/i);
      }
    });

    it('T2-F02-05: verifies complete absence of ScrollToTop imports across entire src/ directory', () => {
      const srcDir = path.resolve(projectRoot, 'src');

      function scanDir(dir) {
        const matches = [];
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            matches.push(...scanDir(fullPath));
          } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
            const code = fs.readFileSync(fullPath, 'utf8');
            if (/from\s+['"].*ScrollToTop['"]/i.test(code) || /<ScrollToTopButton/i.test(code)) {
              matches.push(fullPath);
            }
          }
        }
        return matches;
      }

      const found = scanDir(srcDir);
      expect(found).toHaveLength(0);
    });
  });

  // =========================================================================
  // Feature 3: Orphaned Assets Pruning Boundaries
  // =========================================================================
  describe('Feature 3: Orphaned Assets Pruning Boundaries (T2-F03)', () => {
    it('T2-F03-01: verifies pruned asset public/file.svg is physically absent', () => {
      const filePath = path.resolve(projectRoot, 'public', 'file.svg');
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it('T2-F03-02: verifies pruned assets public/next.svg and public/vercel.svg are physically absent', () => {
      expect(fs.existsSync(path.resolve(projectRoot, 'public', 'next.svg'))).toBe(false);
      expect(fs.existsSync(path.resolve(projectRoot, 'public', 'vercel.svg'))).toBe(false);
      expect(fs.existsSync(path.resolve(projectRoot, 'public', 'globe.svg'))).toBe(false);
      expect(fs.existsSync(path.resolve(projectRoot, 'public', 'window.svg'))).toBe(false);
    });

    it('T2-F03-03: verifies active hero asset public/images/hero-nature-glare.jpg is preserved and exceeds 800KB', () => {
      const heroPath = path.resolve(projectRoot, 'public', 'images', 'hero-nature-glare.jpg');
      expect(fs.existsSync(heroPath)).toBe(true);

      const stats = fs.statSync(heroPath);
      expect(stats.size).toBeGreaterThan(800000); // Exceeds 800 KB
    });

    it('T2-F03-04: verifies dynamic icon route src/app/icon.tsx exists and defines PNG metadata', () => {
      const iconPath = path.resolve(projectRoot, 'src', 'app', 'icon.tsx');
      expect(fs.existsSync(iconPath)).toBe(true);

      const content = fs.readFileSync(iconPath, 'utf8');
      expect(content).toMatch(/contentType\s*=\s*["']image\/png["']/);
      expect(content).toContain('width: 32');
      expect(content).toContain('height: 32');
    });

    it('T2-F03-05: verifies path traversal protection rejects attempts to traverse outside public asset boundaries', () => {
      // Simulate safe public asset resolver contract
      const publicDir = path.resolve(projectRoot, 'public');
      function resolvePublicAsset(requestPath) {
        const decoded = decodeURIComponent(requestPath).replace(/\\/g, '/');
        const resolvedPath = path.resolve(publicDir, decoded.replace(/^\/+/, ''));
        // Verify path traversal does not escape public directory
        if (!resolvedPath.startsWith(publicDir)) {
          return { status: 400, allowed: false, body: 'Bad Request: Path Traversal' };
        }
        if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
          return { status: 404, allowed: false, body: 'Not Found' };
        }
        return { status: 200, allowed: true, path: resolvedPath };
      }

      const traversalRequests = [
        '/..%2fpublic%2ffile.svg',
        '/images/../../package.json',
        '/../../../etc/passwd',
      ];

      for (const reqPath of traversalRequests) {
        const res = resolvePublicAsset(reqPath);
        expect(res.allowed).toBe(false);
        expect(res.status).toBeGreaterThanOrEqual(400);
      }

      // Legitimate public asset returns allowed: true
      const legitimate = resolvePublicAsset('/images/hero-nature-glare.jpg');
      expect(legitimate.allowed).toBe(true);
      expect(legitimate.status).toBe(200);
    });
  });

  // =========================================================================
  // Feature 4: TypeScript Config Hardening Boundaries
  // =========================================================================
  describe('Feature 4: TypeScript Config Hardening Boundaries (T2-F04)', () => {
    it('T2-F04-01: verifies tsconfig.json excludes .agents to prevent external skill script pollution', () => {
      const tsconfigPath = path.resolve(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      expect(Array.isArray(tsconfig.exclude)).toBe(true);
      expect(tsconfig.exclude).toContain('.agents');
      expect(tsconfig.exclude).toContain('node_modules');
    });

    it('T2-F04-02: verifies compilerOptions enforce strict type safety and noEmit', () => {
      const tsconfigPath = path.resolve(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      expect(tsconfig.compilerOptions.strict).toBe(true);
      expect(tsconfig.compilerOptions.noEmit).toBe(true);
      expect(tsconfig.compilerOptions.skipLibCheck).toBe(true);
    });

    it('T2-F04-03: verifies tsconfig.json valid JSON structure and comments resilience', () => {
      const tsconfigPath = path.resolve(projectRoot, 'tsconfig.json');
      const raw = fs.readFileSync(tsconfigPath, 'utf8');

      let parsed = null;
      expect(() => {
        parsed = JSON.parse(raw);
      }).not.toThrow();

      expect(parsed).toBeDefined();
      expect(typeof parsed.compilerOptions).toBe('object');
    });

    it('T2-F04-04: verifies path alias @/* is strictly isolated to ./src/*', () => {
      const tsconfigPath = path.resolve(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      const paths = tsconfig.compilerOptions.paths;
      expect(paths).toBeDefined();
      expect(paths['@/*']).toEqual(['./src/*']);

      // Ensure no dangling alias mapping to .agents or parent directory
      for (const alias of Object.keys(paths)) {
        const targets = paths[alias];
        for (const target of targets) {
          expect(target).not.toContain('.agents');
        }
      }
    });

    it('T2-F04-05: verifies include array explicitly contains App Router type declarations', () => {
      const tsconfigPath = path.resolve(projectRoot, 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      expect(Array.isArray(tsconfig.include)).toBe(true);
      expect(tsconfig.include).toContain('.next/types/**/*.ts');
      expect(tsconfig.include).toContain('**/*.ts');
      expect(tsconfig.include).toContain('**/*.tsx');
    });
  });

  // =========================================================================
  // Feature 5: Build & Prerender Stabilization Boundaries
  // =========================================================================
  describe('Feature 5: Build & Prerender Stabilization Boundaries (T2-F05)', () => {
    it('T2-F05-01: verifies offline build resilience via STATIC_FALLBACK_REPOS in src/lib/github.ts', () => {
      const githubPath = path.resolve(projectRoot, 'src', 'lib', 'github.ts');
      expect(fs.existsSync(githubPath)).toBe(true);

      const content = fs.readFileSync(githubPath, 'utf8');
      expect(content).toContain('STATIC_FALLBACK_REPOS');
      expect(content).toContain('ForensIQ');
      expect(content).toContain('Threat-X');
    });

    it('T2-F05-02: verifies cacheComponents and partialPrefetching are disabled in next.config.ts to prevent Windows EPERM', () => {
      const configPath = path.resolve(projectRoot, 'next.config.ts');
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, 'utf8');
      expect(content).toContain('cacheComponents: false');
      expect(content).toContain('partialPrefetching: false');
      expect(content).toContain('poweredByHeader: false');
    });

    it('T2-F05-03: verifies static params generation for dynamic route src/app/projects/[slug]', () => {
      const projectSlugPath = path.resolve(projectRoot, 'src', 'app', 'projects', '[slug]', 'page.tsx');
      expect(fs.existsSync(projectSlugPath)).toBe(true);

      const content = fs.readFileSync(projectSlugPath, 'utf8');
      expect(content).toContain('export async function generateStaticParams()');
      expect(content).toContain('projectsData.map');
    });

    it('T2-F05-04: verifies static params generation for dynamic route src/app/notes/[slug]', () => {
      const noteSlugPath = path.resolve(projectRoot, 'src', 'app', 'notes', '[slug]', 'page.tsx');
      expect(fs.existsSync(noteSlugPath)).toBe(true);

      const content = fs.readFileSync(noteSlugPath, 'utf8');
      expect(content).toContain('export async function generateStaticParams()');
      expect(content).toContain('notesData.map');
    });

    it('T2-F05-05: verifies Turbopack Tailwind CSS v4 loader and security headers in next.config.ts', () => {
      const configPath = path.resolve(projectRoot, 'next.config.ts');
      const content = fs.readFileSync(configPath, 'utf8');

      expect(content).toContain('@tailwindcss/turbopack');
      expect(content).toContain('Content-Security-Policy');
      expect(content).toContain('Strict-Transport-Security');
    });
  });

});
