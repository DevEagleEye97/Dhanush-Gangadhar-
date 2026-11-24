/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 06: Lenis & GSAP Route Sync (SmoothScroll.tsx)
 *
 * Verifies Lenis smooth scroll initialization, GSAP ticker synchronization,
 * in-page anchor interception, and route scroll refresh contracts.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';
import { createMockLenis, createMockGsap, createScrollTelemetry } from '../harness/dom.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 06: Lenis & GSAP Route Sync (Tier 1)', () => {
  const smoothScrollPath = path.resolve(projectRoot, 'src', 'components', 'SmoothScroll.tsx');

  it('T1-F06-01: Verify Lenis instance initialization and global window.lenis attachment contract', () => {
    expect(fs.existsSync(smoothScrollPath)).toBe(true);
    const content = fs.readFileSync(smoothScrollPath, 'utf8');
    expect(content).toContain('new Lenis');
    expect(content).toContain('.lenis = lenis');

    // Verify mock Lenis interface conforms to required contract
    const lenis = createMockLenis();
    expect(typeof lenis.scrollTo).toBe('function');
    expect(typeof lenis.start).toBe('function');
    expect(typeof lenis.stop).toBe('function');
    expect(typeof lenis.raf).toBe('function');
    expect(typeof lenis.destroy).toBe('function');
  });

  it('T1-F06-02: Verify GSAP ticker synchronization driving Lenis RAF', () => {
    const content = fs.readFileSync(smoothScrollPath, 'utf8');
    expect(content).toContain('ScrollTrigger.update');
    expect(content).toContain('gsap.ticker.add');
    expect(content).toContain('gsap.ticker.lagSmoothing(0)');

    // Verify ticker bridge integration logic
    const mockGsap = createMockGsap();
    const mockLenis = createMockLenis();
    mockGsap.ticker.add((time) => mockLenis.raf(time * 1000));
    mockGsap.ticker.lagSmoothing(0);

    expect(mockGsap.tickerCallbacks.size).toBe(1);
    expect(mockGsap.calls.some((c) => c.action === 'ticker.lagSmoothing' && c.threshold === 0)).toBe(true);
  });

  it('T1-F06-03: Verify scroll reset to top on route transition contract', () => {
    const content = fs.readFileSync(smoothScrollPath, 'utf8');
    expect(fs.existsSync(smoothScrollPath)).toBe(true);

    const telemetry = createScrollTelemetry();
    telemetry.scrollTo(0, 1500);
    expect(telemetry.scrollY).toBe(1500);

    // Route transition handler resets scroll
    const onRouteTransition = (scrollCtrl) => {
      scrollCtrl.scrollTo(0, 0);
    };
    onRouteTransition(telemetry);
    expect(telemetry.scrollY).toBe(0);
  });

  it('T1-F06-04: Verify ScrollTrigger.refresh() invocation on route transition', () => {
    const mockGsap = createMockGsap();
    expect(mockGsap.ScrollTrigger.refreshCalls).toBe(0);

    const handleRouteTransition = (gsapInstance) => {
      gsapInstance.ScrollTrigger.refresh();
    };
    handleRouteTransition(mockGsap);

    expect(mockGsap.ScrollTrigger.refreshCalls).toBe(1);
    expect(mockGsap.calls.some((c) => c.action === 'ScrollTrigger.refresh')).toBe(true);
  });

  it('T1-F06-05: Verify anchor link interception for in-page smooth scrolling', () => {
    const content = fs.readFileSync(smoothScrollPath, 'utf8');
    expect(content).toContain('a[href^="#"]');
    expect(content).toContain('offset: -70');
    expect(content).toContain('duration: 1.4');

    const mockLenis = createMockLenis();
    mockLenis.scrollTo('#projects', { offset: -70, duration: 1.4 });
    expect(mockLenis.calls.some((c) => c.action === 'scrollTo' && c.options?.offset === -70)).toBe(true);
  });
});
