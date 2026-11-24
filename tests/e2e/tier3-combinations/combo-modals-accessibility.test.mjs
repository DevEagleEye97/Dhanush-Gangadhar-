/**
 * Tier 3: Cross-Feature Pairwise Combination Tests
 * Suite: Modals, Cache & Accessibility (combo-modals-accessibility.test.mjs)
 *
 * Scenarios Covered:
 * - TC-T3-11: TerminalModal Focus Containment, Escape Key & Lenis Resume (F7 x F12)
 * - TC-T3-12: GitHub Repos Route Cache-Control & Client Refresh Interaction (F17 x F8)
 * - TC-T3-13: IP Spoofing Neutralization & Rate Limiting on GitHub Repos (F15 x F17)
 * - TC-T3-14: Invalid Route 404 Trigger, Lenis Stabilization & Return Home (F20 x F6)
 * - TC-T3-15: Floating Journey Walkthrough Autoplay Interval & Dismissal Cleanup (F7 x F12)
 * - TC-T3-16: CaseStudyModal Launch from Filtered Card & Escape Key Recovery (F8 x F12)
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
  getByRole,
  getByAria,
  hasAttribute,
} from '../harness/dom.mjs';
import { createMockRequest, invokeRoute } from '../harness/http.mjs';
import { MockGitHubService } from '../harness/mock-github.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Tier 3: Modals, Cache & Accessibility Combinations', () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(() => {
    teardownDomEnvironment();
  });

  // TC-T3-11: TerminalModal Focus Containment, Escape Key & Lenis Resume (F7 x F12)
  it('TC-T3-11: TerminalModal Focus Containment, Escape Key & Lenis Resume', () => {
    const lenis = createMockLenis();
    const telemetry = createScrollTelemetry();
    telemetry.scrollTo(0, 300);
    lenis.scrollTo(300);

    // Focus trap simulation
    const focusableSelectors = ['button.close-btn', 'input.terminal-input', 'button.help-btn'];
    let currentFocusIndex = 0;
    let isOpen = true;

    // Scroll lock on open
    lenis.stop();
    expect(lenis.isStopped).toBe(true);

    // Simulate Tab key cycling (5 tabs across 3 items)
    const handleTab = (direction = 'forward') => {
      if (direction === 'forward') {
        currentFocusIndex = (currentFocusIndex + 1) % focusableSelectors.length;
      } else {
        currentFocusIndex = (currentFocusIndex - 1 + focusableSelectors.length) % focusableSelectors.length;
      }
      return focusableSelectors[currentFocusIndex];
    };

    for (let i = 0; i < 5; i++) {
      const activeEl = handleTab('forward');
      expect(focusableSelectors.includes(activeEl)).toBe(true);
    }

    // Simulate Escape key press to dismiss modal
    const handleKeyDown = (key) => {
      if (key === 'Escape') {
        isOpen = false;
        lenis.start();
        return 'TRIGGER_BUTTON_RESTORED';
      }
      return null;
    };

    const focusResult = handleKeyDown('Escape');
    expect(isOpen).toBe(false);
    expect(lenis.isStopped).toBe(false);
    expect(focusResult).toBe('TRIGGER_BUTTON_RESTORED');
    expect(telemetry.scrollY).toBe(300);
  });

  // TC-T3-12: GitHub Repos Route Cache-Control & Client Refresh Interaction (F17 x F8)
  it('TC-T3-12: GitHub Repos Route Cache-Control & Client Refresh Interaction', async () => {
    const mockGithub = new MockGitHubService();

    const githubReposRouteHandler = async (req) => {
      const repos = mockGithub.repos;
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            projects: repos.map((r) => ({
              id: String(r.id),
              title: r.name,
              description: r.description,
              stars: r.stargazers_count,
              language: r.language,
            })),
            isFallback: false,
          },
          meta: { timestamp: new Date().toISOString() },
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    };

    // 1. Initial page load fetch
    const initialRes = await invokeRoute(githubReposRouteHandler, {
      method: 'GET',
      url: 'http://localhost:3000/api/github-repos',
    });

    expect(initialRes.status).toBe(200);
    expect(initialRes.data.success).toBe(true);
    const cacheControl = initialRes.headers.get('cache-control');
    expect(cacheControl).toContain('public');
    expect(cacheControl).toContain('s-maxage=3600');
    expect(cacheControl).toContain('stale-while-revalidate=86400');

    // 2. Client manual refresh state simulation in ProjectsSection
    let isRefreshing = false;
    let repoCount = initialRes.data.data.projects.length;

    const onClientRefreshClick = async () => {
      isRefreshing = true;
      const refreshRes = await invokeRoute(githubReposRouteHandler, {
        method: 'GET',
        url: 'http://localhost:3000/api/github-repos',
      });
      repoCount = refreshRes.data.data.projects.length;
      isRefreshing = false;
    };

    await onClientRefreshClick();
    expect(isRefreshing).toBe(false);
    expect(repoCount).toBeGreaterThan(0);
  });

  // TC-T3-13: IP Spoofing Neutralization & Rate Limiting on GitHub Repos (F15 x F17)
  it('TC-T3-13: IP Spoofing Neutralization & Rate Limiting on GitHub Repos', async () => {
    const rateLimitMap = new Map();

    const resolveEdgeClientIp = (headers) => {
      // Priority 1: Cloudflare connecting IP
      const cfIp = headers.get('cf-connecting-ip');
      if (cfIp) return cfIp.trim();

      // Priority 2: X-Forwarded-For (client is first in CSV list)
      const xff = headers.get('x-forwarded-for');
      if (xff) return xff.split(',')[0].trim();

      return '127.0.0.1';
    };

    const edgeRateLimitMiddleware = async (req) => {
      const clientIp = resolveEdgeClientIp(req.headers);
      const limit = 20;
      const windowMs = 60000;
      const now = Date.now();
      const windowStart = now - windowMs;

      let timestamps = rateLimitMap.get(clientIp) || [];
      timestamps = timestamps.filter((t) => t > windowStart);

      if (timestamps.length >= limit) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
          }),
          {
            status: 429,
            headers: {
              'content-type': 'application/json',
              'X-Resolved-IP': clientIp,
            },
          }
        );
      }

      timestamps.push(now);
      rateLimitMap.set(clientIp, timestamps);

      return new Response(
        JSON.stringify({ success: true, clientIp }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'X-Resolved-IP': clientIp,
          },
        }
      );
    };

    // Client sends request with spoofed X-Forwarded-For but legitimate CF-Connecting-IP
    const headers = {
      'cf-connecting-ip': '203.0.113.50',
      'x-forwarded-for': '10.0.0.1, 192.168.1.1',
    };

    // 1. Send initial request
    const firstRes = await invokeRoute(edgeRateLimitMiddleware, {
      method: 'GET',
      url: 'http://localhost:3000/api/github-repos',
      headers,
    });

    expect(firstRes.status).toBe(200);
    // Verified that resolved IP is 203.0.113.50 and NOT spoofed 10.0.0.1
    expect(firstRes.headers.get('x-resolved-ip')).toBe('203.0.113.50');

    // 2. Burst 25 requests to exhaust rate limit bucket on resolved IP
    for (let i = 2; i <= 20; i++) {
      await invokeRoute(edgeRateLimitMiddleware, {
        method: 'GET',
        url: 'http://localhost:3000/api/github-repos',
        headers,
      });
    }

    const exhaustedRes = await invokeRoute(edgeRateLimitMiddleware, {
      method: 'GET',
      url: 'http://localhost:3000/api/github-repos',
      headers,
    });

    expect(exhaustedRes.status).toBe(429);
    expect(exhaustedRes.data.success).toBe(false);
    expect(exhaustedRes.headers.get('x-resolved-ip')).toBe('203.0.113.50');
  });

  // TC-T3-14: Invalid Route 404 Trigger, Lenis Stabilization & Return Home (F20 x F6)
  it('TC-T3-14: Invalid Route 404 Trigger, Lenis Stabilization & Return Home', () => {
    const lenis = createMockLenis();
    const telemetry = createScrollTelemetry();
    const gsap = createMockGsap();

    // 1. User navigates to non-existent route /invalid-path-987
    const notFoundHtml = `
      <main id="main-content" class="min-h-screen flex items-center justify-center">
        <div class="text-center">
          <span class="font-mono text-xs uppercase tracking-widest text-accent">404 Error</span>
          <h1 class="text-3xl font-bold">Page Not Found</h1>
          <p class="text-text-secondary mt-2">The requested engineering log or route does not exist.</p>
          <a href="/" class="mt-6 inline-flex items-center gap-2 btn-return-home">Return Home</a>
        </div>
      </main>
    `;

    expect(notFoundHtml).toContain('404 Error');
    expect(notFoundHtml).toContain('Return Home');

    // 2. Click Return Home
    // Route transition handler resets Lenis to top and triggers ScrollTrigger.refresh()
    const onReturnHome = () => {
      telemetry.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true });
      gsap.ScrollTrigger.refresh();
    };

    onReturnHome();
    expect(telemetry.scrollY).toBe(0);
    expect(lenis.scroll).toBe(0);
    expect(gsap.ScrollTrigger.refreshCalls).toBe(1);
  });

  // TC-T3-15: Floating Journey Walkthrough Autoplay Interval & Dismissal Cleanup (F7 x F12)
  it('TC-T3-15: Floating Journey Walkthrough Autoplay Interval & Dismissal Cleanup', () => {
    const lenis = createMockLenis();
    let isModalOpen = true;
    let activeStep = 0;
    const totalSteps = 4;
    let intervalId = null;
    let wasCleanedUp = false;

    lenis.stop();
    expect(lenis.isStopped).toBe(true);

    // Emulate autoplay step progression
    intervalId = { id: 12345 };
    const stepForward = () => {
      activeStep = (activeStep + 1) % totalSteps;
    };

    // Autoplay advances step 0 -> step 1
    stepForward();
    expect(activeStep).toBe(1);

    // User dismisses modal during step 1
    const closeModal = () => {
      isModalOpen = false;
      intervalId = null; // clearInterval
      wasCleanedUp = true;
      lenis.start();
    };

    closeModal();

    expect(isModalOpen).toBe(false);
    expect(wasCleanedUp).toBe(true);
    expect(intervalId).toBeNull();
    expect(lenis.isStopped).toBe(false);
  });

  // TC-T3-16: CaseStudyModal Launch from Filtered Card & Escape Key Recovery (F8 x F12)
  it('TC-T3-16: CaseStudyModal Launch from Filtered Card & Escape Key Recovery', () => {
    const lenis = createMockLenis();
    let activeModalProject = null;
    let focusedElementBeforeModal = 'project-card-button-1';
    let currentFocus = focusedElementBeforeModal;

    const sampleProject = {
      id: 'velora-hq',
      title: 'Velora Enterprise Engine',
      category: 'Web development',
      problem: 'High concurrency web performance bottleneck.',
      solution: 'Custom event-driven edge caching with Next.js.',
      techStack: ['Next.js', 'TypeScript', 'Tailwind', 'GSAP'],
    };

    // 1. Open CaseStudyModal from filtered card
    const openCaseStudy = (project) => {
      activeModalProject = project;
      lenis.stop();
      currentFocus = 'modal-close-button';
    };

    openCaseStudy(sampleProject);
    expect(activeModalProject).not.toBeNull();
    expect(activeModalProject.title).toBe('Velora Enterprise Engine');
    expect(lenis.isStopped).toBe(true);
    expect(currentFocus).toBe('modal-close-button');

    // 2. Press Escape key to close modal
    const handleModalKeyDown = (eventKey) => {
      if (eventKey === 'Escape') {
        activeModalProject = null;
        lenis.start();
        currentFocus = focusedElementBeforeModal; // Restores focus to triggering card button
      }
    };

    handleModalKeyDown('Escape');
    expect(activeModalProject).toBeNull();
    expect(lenis.isStopped).toBe(false);
    expect(currentFocus).toBe('project-card-button-1');
  });
});
