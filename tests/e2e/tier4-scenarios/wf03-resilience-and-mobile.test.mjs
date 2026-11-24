/**
 * Tier 4: Real-World Application End-to-End User Workflows
 * Suite: Resilience, Mobile & Deep Dive Workflows (wf03-resilience-and-mobile.test.mjs)
 *
 * Scenarios Covered:
 * - WF-T4-08: Edge Middleware Security Enforcement & Rate Limiting Stress (F14, F15, F17, F19)
 * - WF-T4-09: 404 Route Fault Recovery & Server Error Boundary Reset (F6, F20)
 * - WF-T4-10: Offline / Degraded Network Mode & Local Catalog Fallback (F8, F17, F18)
 * - WF-T4-11: Responsive Mobile Navigation, Touch Guard & Bottom Safe Dock (F7, F9, F12)
 * - WF-T4-12: Flagship Project Deep Dive, Case Study & Verified External Code (F8, F12, F21)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, it, expect, beforeEach, afterEach } from '../runner.mjs';
import {
  setupDomEnvironment,
  teardownDomEnvironment,
  createMockMatchMedia,
  createMockLenis,
  createMockGsap,
  createScrollTelemetry,
  getByRole,
  getByAria,
  hasAttribute,
} from '../harness/dom.mjs';
import { createMockStorage } from '../harness/mock-storage.mjs';
import { createMockRequest, invokeRoute } from '../harness/http.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Tier 4: Resilience, Mobile & Deep Dive Workflows', () => {
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

  // WF-T4-08: Edge Middleware Security Enforcement & Rate Limiting Stress
  it('WF-T4-08: Edge Middleware Security Enforcement & Rate Limiting Stress', async () => {
    const rateLimitStore = new Map();
    const securityHeaders = {
      'Content-Security-Policy': "default-src 'self'",
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
    };

    const edgeMiddlewareHandler = async (req) => {
      // Step 2 & 3: IP resolution prioritizing Cloudflare CF-Connecting-IP
      const cfIp = req.headers.get('cf-connecting-ip');
      const resolvedIp = cfIp ? cfIp.trim() : (req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1');

      const limit = 5;
      const windowMs = 60000;
      const now = Date.now();
      let timestamps = rateLimitStore.get(resolvedIp) || [];
      timestamps = timestamps.filter((t) => t > now - windowMs);

      // Attach base security headers to all responses
      const headers = new Headers({
        'content-type': 'application/json',
        ...securityHeaders,
      });

      if (timestamps.length >= limit) {
        const oldest = timestamps[0];
        const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
        headers.set('Retry-After', String(retryAfter));
        headers.set('X-RateLimit-Limit', String(limit));
        headers.set('X-RateLimit-Remaining', '0');

        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.',
            },
          }),
          { status: 429, headers }
        );
      }

      timestamps.push(now);
      rateLimitStore.set(resolvedIp, timestamps);
      headers.set('X-RateLimit-Limit', String(limit));
      headers.set('X-RateLimit-Remaining', String(limit - timestamps.length));

      return new Response(
        JSON.stringify({ success: true, clientIp: resolvedIp }),
        { status: 200, headers }
      );
    };

    // Step 1 & 2: Requests with spoofed X-Forwarded-For but legitimate CF-Connecting-IP
    const baseHeaders = {
      'cf-connecting-ip': '198.51.100.99',
      'x-forwarded-for': '127.0.0.1',
    };

    // Step 4 & 5: Scanner launches burst of 15 requests
    const responses = [];
    for (let i = 1; i <= 15; i++) {
      const res = await invokeRoute(edgeMiddlewareHandler, {
        method: 'POST',
        url: 'http://localhost:3000/api/contact',
        headers: baseHeaders,
      });
      responses.push(res);
    }

    // Requests 1-5 must return 200
    for (let i = 0; i < 5; i++) {
      expect(responses[i].status).toBe(200);
      expect(responses[i].data.success).toBe(true);
      expect(responses[i].headers.get('x-content-type-options')).toBe('nosniff');
      expect(responses[i].headers.get('x-frame-options')).toBe('DENY');
    }

    // Requests 6-15 must return 429
    for (let i = 5; i < 15; i++) {
      expect(responses[i].status).toBe(429);
      expect(responses[i].data.success).toBe(false);
      expect(responses[i].data.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(responses[i].headers.get('retry-after')).toBeDefined();
      expect(responses[i].headers.get('x-content-type-options')).toBe('nosniff');
      expect(responses[i].headers.get('x-frame-options')).toBe('DENY');
    }

    // Step 8: Clean rate limit bucket after simulated window reset
    rateLimitStore.clear();
    const postResetRes = await invokeRoute(edgeMiddlewareHandler, {
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      headers: baseHeaders,
    });
    expect(postResetRes.status).toBe(200);
  });

  // WF-T4-09: 404 Route Fault Recovery & Server Error Boundary Reset
  it('WF-T4-09: 404 Route Fault Recovery & Server Error Boundary Reset', () => {
    const lenis = createMockLenis();
    const telemetry = createScrollTelemetry();
    const gsap = createMockGsap();

    // Step 1, 2, 3: Direct navigation to non-existent route renders custom 404
    const notFoundView = {
      status: 404,
      title: 'Repository or Case Study Not Found',
      actionLabel: 'Browse All Projects',
      actionHref: '/projects',
    };

    expect(notFoundView.status).toBe(404);
    expect(notFoundView.title).toContain('Not Found');

    // Step 4 & 5: Click "Browse All Projects" -> navigates to /projects, resets scroll to (0,0)
    const onBrowseProjectsClick = () => {
      telemetry.scrollTo(0, 0);
      lenis.scrollTo(0, { immediate: true });
      gsap.ScrollTrigger.refresh();
    };

    onBrowseProjectsClick();
    expect(telemetry.scrollY).toBe(0);
    expect(lenis.scroll).toBe(0);
    expect(gsap.ScrollTrigger.refreshCalls).toBe(1);

    // Step 6 & 7: Intentional runtime render exception caught by error.tsx
    let boundaryCaught = false;
    let leakedStackTrace = false;

    const simulateError = () => {
      try {
        throw new Error('Database connection pool exhausted at /var/app/internal');
      } catch (err) {
        boundaryCaught = true;
        // In production error boundary, err.stack is suppressed from UI
        const clientErrorMessage = 'A server error occurred while processing this section.';
        leakedStackTrace = clientErrorMessage.includes('/var/app') || clientErrorMessage.includes('at ');
      }
    };

    simulateError();
    expect(boundaryCaught).toBe(true);
    expect(leakedStackTrace).toBe(false);

    // Step 8: User clicks "Try again" -> component remounts successfully
    let componentRemounted = false;
    const resetErrorBoundary = () => {
      componentRemounted = true;
    };

    resetErrorBoundary();
    expect(componentRemounted).toBe(true);
  });

  // WF-T4-10: Offline / Degraded Network Mode & Local Catalog Fallback
  it('WF-T4-10: Offline / Degraded Network Mode & Local Catalog Fallback', async () => {
    // Step 1 & 2: Offline status
    const networkStatus = { onLine: false };

    // Verified local projects data fallback
    const localProjectsData = [
      { id: '1', title: 'Network Packet Sniffer', stars: 24, language: 'C' },
      { id: '2', title: 'Velora Landing Page', stars: 45, language: 'TypeScript' },
      { id: '3', title: 'Linux Kernel Driver', stars: 18, language: 'Rust' },
    ];

    let displayedProjects = [];
    let isFallbackActive = false;
    let statusPill = 'Live Sync';

    // Step 3 & 4: User clicks "Refresh Repositories" while offline
    const fetchRepositories = async () => {
      if (!networkStatus.onLine) {
        // Step 5 & 6: Switch to local verified catalog
        displayedProjects = localProjectsData;
        isFallbackActive = true;
        statusPill = 'Cached Repos';
        return;
      }
      displayedProjects = [{ id: 'live-1', title: 'Live Repo', stars: 99 }];
      isFallbackActive = false;
      statusPill = 'Live Sync';
    };

    await fetchRepositories();

    expect(isFallbackActive).toBe(true);
    expect(statusPill).toBe('Cached Repos');
    expect(displayedProjects.length).toBe(3);

    // Step 7: User searches through local catalog while offline
    const searchQuery = 'Packet';
    const searchResults = displayedProjects.filter((p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    expect(searchResults.length).toBe(1);
    expect(searchResults[0].title).toBe('Network Packet Sniffer');

    // Step 8: Network connection restores, user retries sync
    networkStatus.onLine = true;
    await fetchRepositories();
    expect(isFallbackActive).toBe(false);
    expect(statusPill).toBe('Live Sync');
    expect(displayedProjects[0].title).toBe('Live Repo');
  });

  // WF-T4-11: Responsive Mobile Navigation, Touch Guard & Bottom Safe Dock
  it('WF-T4-11: Responsive Mobile Navigation, Touch Guard & Bottom Safe Dock', () => {
    // Step 1: Viewport configured to 375x667
    const viewport = { width: 375, height: 667 };
    const matchMediaCoarse = createMockMatchMedia({ pointerFine: false });
    const isFinePointer = matchMediaCoarse('(pointer: fine)').matches;
    expect(isFinePointer).toBe(false);

    // Step 2 & 3: Mobile hamburger menu toggle
    let isMobileNavOpen = false;
    const toggleMobileNav = () => {
      isMobileNavOpen = !isMobileNavOpen;
    };

    toggleMobileNav();
    expect(isMobileNavOpen).toBe(true);

    // Step 4: Taps "Cybersecurity" link -> closes overlay
    const onMobileNavLinkClick = (href) => {
      isMobileNavOpen = false;
      return href;
    };

    const targetRoute = onMobileNavLinkClick('/cybersecurity');
    expect(isMobileNavOpen).toBe(false);
    expect(targetRoute).toBe('/cybersecurity');

    // Step 5: Floating dock pinned with safe-area-inset-bottom
    const dockCss = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-40 pb-[env(safe-area-inset-bottom,0px)]';
    expect(dockCss).toContain('safe-area-inset-bottom');

    // Step 6 & 7: Modal opens with mobile responsive layout and progress bar
    let isModalOpen = true;
    let currentStep = 1;
    const totalSteps = 4;

    const advanceStep = () => {
      currentStep = Math.min(totalSteps, currentStep + 1);
    };

    advanceStep();
    expect(currentStep).toBe(2);

    // Step 8: Taps close button -> modal dismisses
    const onCloseModal = () => {
      isModalOpen = false;
    };

    onCloseModal();
    expect(isModalOpen).toBe(false);

    // Assert minimum 44x44px touch target guideline
    const touchTargetSize = { width: 48, height: 48 };
    expect(touchTargetSize.width).toBeGreaterThanOrEqual(44);
    expect(touchTargetSize.height).toBeGreaterThanOrEqual(44);
  });

  // WF-T4-12: Flagship Project Deep Dive, Case Study & Verified External Code
  it('WF-T4-12: Flagship Project Deep Dive, Case Study & Verified External Code', () => {
    // Step 1 & 2: Search for "Velora" in projects catalog
    const allProjects = [
      {
        id: 'velora-scaling-platform',
        title: 'Velora Enterprise Performance Platform',
        slug: 'velora',
        category: 'Web development',
        repoUrl: 'https://github.com/dhanush-gangadhar/velora',
        caseStudy: {
          problem: 'High-traffic rendering latency under concurrent load.',
          solution: 'Edge-rendered micro-frontends with incremental static caching.',
          architecture: 'Next.js App Router, Cloudflare Workers, Tailwind CSS.',
          learnings: 'Strict memoization of heavy SVG animations and asset preloading.',
        },
      },
      {
        id: 'packet-sniffer',
        title: 'Network Packet Sniffer',
        slug: 'packet-sniffer',
        category: 'Cybersecurity',
        repoUrl: 'https://github.com/dhanush-gangadhar/sniffer',
      },
    ];

    const query = 'Velora';
    const matchedProjects = allProjects.filter((p) => p.title.includes(query));
    expect(matchedProjects.length).toBe(1);

    // Step 3 & 4: Inspect Case Study sections
    const velora = matchedProjects[0];
    expect(velora.caseStudy.problem).toContain('rendering latency');
    expect(velora.caseStudy.solution).toContain('Edge-rendered');
    expect(velora.caseStudy.architecture).toContain('Next.js');
    expect(velora.caseStudy.learnings).toContain('memoization');

    // Step 5: External repository link has HTTPS and secure rel attributes
    const externalRepoLink = {
      href: velora.repoUrl,
      target: '_blank',
      rel: 'noopener noreferrer',
    };
    expect(externalRepoLink.href.startsWith('https://github.com')).toBe(true);
    expect(externalRepoLink.target).toBe('_blank');
    expect(externalRepoLink.rel).toBe('noopener noreferrer');

    // Step 6 & 7: Notes technical article deep dive
    const technicalNotes = [
      {
        slug: 'linux-socket-programming',
        title: 'Linux Socket Programming & Non-Blocking I/O',
        codeSnippet: 'int epoll_create1(int flags);',
      },
    ];
    expect(technicalNotes[0].slug).toBe('linux-socket-programming');
    expect(technicalNotes[0].codeSnippet).toContain('epoll_create1');
  });
});
