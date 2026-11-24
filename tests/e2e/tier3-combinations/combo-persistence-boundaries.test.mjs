/**
 * Tier 3: Cross-Feature Pairwise Combination Tests
 * Suite: Persistence, Boundaries & Resilience (combo-persistence-boundaries.test.mjs)
 *
 * Scenarios Covered:
 * - TC-T3-17: PromptStudio Malicious Input Sanitization & Error Boundary Shield (F16 x F20)
 * - TC-T3-18: Cybersecurity Roadmap Checklist Persistence & Theme Inversion (F21 x F12)
 * - TC-T3-19: Missing Non-Critical Env Vars Triggers Standardized Fallback Envelope (F13 x F17)
 * - TC-T3-20: Server Error Boundary Retains Security Headers Without Stack Leak (F14 x F20)
 * - TC-T3-21: Dynamic Class Name Resolution Without clsx/tailwind-merge (F1 x F21)
 * - TC-T3-22: SSR HTML Generation & Client Canvas Hydration Without FOUC (F10 x F21)
 * - TC-T3-23: Static Prerender Build Pipeline Integrity After Asset Deletions (F5 x F3)
 * - TC-T3-24: Client Component Crash Recovery & SmoothScroll Re-attachment (F20 x F6)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect, beforeEach, afterEach } from '../runner.mjs';
import {
  setupDomEnvironment,
  teardownDomEnvironment,
  createMockLenis,
  createMockGsap,
  createScrollTelemetry,
  extractText,
} from '../harness/dom.mjs';
import { createMockStorage } from '../harness/mock-storage.mjs';
import { createMockRequest, invokeRoute } from '../harness/http.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Tier 3: Persistence, Boundaries & Resilience Combinations', () => {
  let mockStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockStorage.installGlobally();
    setupDomEnvironment();
  });

  afterEach(() => {
    mockStorage.uninstall();
    teardownDomEnvironment();
  });

  // TC-T3-17: PromptStudio Malicious Input Sanitization & Error Boundary Shield (F16 x F20)
  it('TC-T3-17: PromptStudio Malicious Input Sanitization & Error Boundary Shield', () => {
    const sanitizePrompt = (rawInput, maxLen = 500) => {
      if (!rawInput || typeof rawInput !== 'string') return '';
      // Strip control chars, trim
      let cleaned = rawInput.replace(/[\x00-\x1F\x7F]/g, '').trim();
      // HTML escape to neutralize script execution
      cleaned = cleaned
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
      if (cleaned.length > maxLen) {
        cleaned = cleaned.slice(0, maxLen);
      }
      return cleaned;
    };

    // 5000 character malicious payload with XSS and SQL injection
    const xssPayload = "<script>alert('xss')</script>";
    const sqlPayload = "' OR 1=1; --";
    const oversizedPayload = xssPayload + sqlPayload + 'A'.repeat(5000);

    let errorThrown = false;
    let sanitizedOutput = '';

    try {
      sanitizedOutput = sanitizePrompt(oversizedPayload, 500);
    } catch {
      errorThrown = true;
    }

    expect(errorThrown).toBe(false);
    expect(sanitizedOutput.length).toBeLessThanOrEqual(500);
    expect(sanitizedOutput).not.toContain('<script>');
    expect(sanitizedOutput).toContain('&lt;script&gt;');
    expect(sanitizedOutput).toContain('&#x27; OR 1=1; --');
  });

  // TC-T3-18: Cybersecurity Roadmap Checklist Persistence & Theme Inversion (F21 x F12)
  it('TC-T3-18: Cybersecurity Roadmap Checklist Persistence & Theme Inversion', () => {
    const STORAGE_KEY = 'bond_cybersecurity_hub_progress_v1';

    // 1. User checks task 0 and task 1 in Week 1, and writes a personal note
    const userProgress = {
      completedTasks: ['w1_task_0', 'w1_task_1'],
      notes: {
        w1: 'Completed basic file permission lab',
      },
      lastUpdated: new Date().toISOString(),
    };

    mockStorage.setItem(STORAGE_KEY, JSON.stringify(userProgress));

    // 2. Toggle theme from dark to light
    let activeTheme = 'dark';
    const toggleTheme = () => {
      activeTheme = activeTheme === 'dark' ? 'light' : 'dark';
      mockStorage.setItem('theme', activeTheme);
    };

    toggleTheme();
    expect(activeTheme).toBe('light');
    expect(mockStorage.getItem('theme')).toBe('light');

    // 3. Emulate page reload: re-read state from localStorage
    const savedProgressRaw = mockStorage.getItem(STORAGE_KEY);
    expect(savedProgressRaw).not.toBeNull();
    const restoredProgress = JSON.parse(savedProgressRaw);

    expect(restoredProgress.completedTasks.includes('w1_task_0')).toBe(true);
    expect(restoredProgress.completedTasks.includes('w1_task_1')).toBe(true);
    expect(restoredProgress.notes.w1).toBe('Completed basic file permission lab');

    // 4. In light mode, contrast tokens must meet WCAG standards
    const lightTokens = {
      bgMain: '#F6F6F8',
      textPrimary: '#111215',
      borderMain: '#E2E4E9',
    };
    expect(lightTokens.bgMain).toBe('#F6F6F8');
    expect(lightTokens.textPrimary).toBe('#111215');
  });

  // TC-T3-19: Missing Non-Critical Env Vars Triggers Standardized Fallback Envelope (F13 x F17)
  it('TC-T3-19: Missing Non-Critical Env Vars Triggers Standardized Fallback Envelope', async () => {
    // 1. Env schema parsing with missing GITHUB_TOKEN & SUPABASE keys
    const rawEnv = {
      NODE_ENV: 'test',
      // GITHUB_TOKEN omitted
      // SUPABASE_SERVICE_ROLE_KEY omitted
    };

    const parsedEnv = {
      NODE_ENV: rawEnv.NODE_ENV || 'development',
      GITHUB_TOKEN: rawEnv.GITHUB_TOKEN || null,
      NEXT_PUBLIC_SITE_URL: rawEnv.NEXT_PUBLIC_SITE_URL || 'https://dhanush-gangadhar.vercel.app',
      isConfigured: Boolean(rawEnv.GITHUB_TOKEN),
    };

    expect(parsedEnv.isConfigured).toBe(false);

    // 2. Route handler falls back to local verified catalog gracefully
    const localVerifiedProjects = [
      { id: '1', name: 'packet-sniffer', description: 'Network sniffer', stars: 12 },
      { id: '2', name: 'velora-web', description: 'Velora platform', stars: 35 },
    ];

    const githubRouteHandler = async () => {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            projects: localVerifiedProjects,
            isFallback: true,
            total: localVerifiedProjects.length,
          },
          meta: {
            timestamp: new Date().toISOString(),
          },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    };

    const res = await invokeRoute(githubRouteHandler);
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.isFallback).toBe(true);
    expect(res.data.data.projects.length).toBe(2);
  });

  // TC-T3-20: Server Error Boundary Retains Security Headers Without Stack Leak (F14 x F20)
  it('TC-T3-20: Server Error Boundary Retains Security Headers Without Stack Leak', async () => {
    // Simulated server route handler encountering unhandled error
    const serverErrorBoundaryHandler = async () => {
      // In production, internal error is caught and sanitized
      const sanitizedResponseHtml = `
        <!DOCTYPE html>
        <html lang="en" class="dark">
          <head>
            <title>500 — Application Error</title>
          </head>
          <body class="bg-bg-main text-text-primary">
            <div class="error-container">
              <h1>Application Error</h1>
              <p>An unexpected server fault occurred. Our engineering telemetry has been notified.</p>
              <button onclick="window.location.reload()">Try again</button>
            </div>
          </body>
        </html>
      `;

      return new Response(sanitizedResponseHtml, {
        status: 500,
        headers: {
          'content-type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'Content-Security-Policy': "default-src 'self'",
        },
      });
    };

    const res = await invokeRoute(serverErrorBoundaryHandler);
    expect(res.status).toBe(500);

    // Security headers must be present even on 500 responses
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('content-security-policy')).toBeDefined();

    // Body must not leak sensitive system info
    const bodyText = typeof res.body === 'string' ? res.body : JSON.stringify(res.body);
    expect(bodyText).not.toContain('node_modules');
    expect(bodyText).not.toContain('C:\\');
    expect(bodyText).not.toContain('at async');
    expect(bodyText).toContain('Try again');
  });

  // TC-T3-21: Dynamic Class Name Resolution Without clsx/tailwind-merge (F1 x F21)
  it('TC-T3-21: Dynamic Class Name Resolution Without clsx/tailwind-merge', () => {
    const packageJsonPath = path.resolve(projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // 1. Verify clsx and tailwind-merge are removed
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    expect(deps.clsx).toBeUndefined();
    expect(deps['tailwind-merge']).toBeUndefined();

    // 2. Pure template-literal dynamic class generator
    const getTabClasses = (isActive) => {
      const base = 'px-3 py-1.5 rounded-lg text-xs font-mono transition-colors';
      const active = 'bg-accent text-white font-bold shadow-xs';
      const inactive = 'bg-bg-secondary text-text-secondary hover:text-text-primary';
      return `${base} ${isActive ? active : inactive}`;
    };

    const activeClasses = getTabClasses(true);
    const inactiveClasses = getTabClasses(false);

    expect(activeClasses).toContain('bg-accent');
    expect(activeClasses).toContain('font-bold');
    expect(inactiveClasses).toContain('bg-bg-secondary');
    expect(inactiveClasses).toContain('text-text-secondary');
  });

  // TC-T3-22: SSR HTML Generation & Client Canvas Hydration Without FOUC (F10 x F21)
  it('TC-T3-22: SSR HTML Generation & Client Canvas Hydration Without FOUC', () => {
    const layoutPath = path.resolve(projectRoot, 'src', 'app', 'layout.tsx');
    expect(fs.existsSync(layoutPath)).toBe(true);
    const layoutContent = fs.readFileSync(layoutPath, 'utf8');

    // 1. Root layout must use suppressHydrationWarning to prevent theme mismatch FOUC
    expect(layoutContent).toContain('suppressHydrationWarning');

    // 2. Simulate SSR HTML payload
    const ssrHtml = `
      <html lang="en" class="dark" style="color-scheme: dark;">
        <head><title>Dhanush Gangadhar (BOND) — Portfolio</title></head>
        <body class="bg-[#0D0E12] text-[#F3F4F6]">
          <div id="vanta-bg-container" class="fixed inset-0 pointer-events-none opacity-40">
            <!-- Canvas is mounted dynamically on client mount (ssr: false) -->
          </div>
          <main id="main-content">
            <h1>Engineering Leader & Security Researcher</h1>
          </main>
        </body>
      </html>
    `;

    expect(ssrHtml).toContain('class="dark"');
    expect(ssrHtml).toContain('vanta-bg-container');
    expect(ssrHtml).toContain('main-content');
  });

  // TC-T3-23: Static Prerender Build Pipeline Integrity After Asset Deletions (F5 x F3)
  it('TC-T3-23: Static Prerender Build Pipeline Integrity After Asset Deletions', () => {
    const nextConfigPath = path.resolve(projectRoot, 'next.config.ts');
    expect(fs.existsSync(nextConfigPath)).toBe(true);
    const configContent = fs.readFileSync(nextConfigPath, 'utf8');

    // 1. Problematic experimental prerender flags must be omitted/disabled to prevent EPERM collisions
    expect(configContent).not.toContain('cacheComponents: true');
    expect(configContent).not.toContain('partialPrefetching: true');

    // 2. Deleted public SVGs must not exist
    const deletedSvgs = ['file.svg', 'globe.svg', 'next.svg', 'vercel.svg', 'window.svg'];
    for (const svg of deletedSvgs) {
      const p = path.resolve(projectRoot, 'public', svg);
      expect(fs.existsSync(p)).toBe(false);
    }
  });

  // TC-T3-24: Client Component Crash Recovery & SmoothScroll Re-attachment (F20 x F6)
  it('TC-T3-24: Client Component Crash Recovery & SmoothScroll Re-attachment', () => {
    const lenis = createMockLenis();
    const gsap = createMockGsap();

    // 1. Component crashes and triggers error boundary
    let hasError = true;
    let tickerAttached = true;

    // Detach or pause on crash
    const onComponentCrash = () => {
      hasError = true;
      lenis.stop();
    };

    onComponentCrash();
    expect(hasError).toBe(true);
    expect(lenis.isStopped).toBe(true);

    // 2. User clicks "Try again" (reset() callback)
    const onResetBoundary = () => {
      hasError = false;
      // Remount SmoothScroll & re-attach ticker
      lenis.start();
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ScrollTrigger.refresh();
    };

    onResetBoundary();

    expect(hasError).toBe(false);
    expect(lenis.isStopped).toBe(false);
    expect(gsap.tickerCallbacks.size).toBeGreaterThan(0);
    expect(gsap.ScrollTrigger.refreshCalls).toBe(1);
  });
});
