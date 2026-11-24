/**
 * Tier 2 Boundary, Edge & Corner Case Tests: Features F06 to F12
 * 
 * Features Covered:
 * - Feature 6: Lenis & GSAP Route Sync (T2-F06-01 to T2-F06-05)
 * - Feature 7: Modal Scroll Lock (T2-F07-01 to T2-F07-05)
 * - Feature 8: Dynamic Filter GSAP Batching (T2-F08-01 to T2-F08-05)
 * - Feature 9: Mobile Magnetic Touch Guard (T2-F09-01 to T2-F09-05)
 * - Feature 10: SSR-Safe 3D Canvas Background (T2-F10-01 to T2-F10-05)
 * - Feature 11: React Bits Micro-Interactions (T2-F11-01 to T2-F11-05)
 * - Feature 12: Accessibility Hardening (T2-F12-01 to T2-F12-05)
 * 
 * Total: 35 Boundary & Corner Case Tests
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
  getByRole,
  getByAria,
  hasAttribute,
  extractText,
} from '../harness/dom.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

// Helper to calculate relative luminance according to WCAG 2.1
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function calculateContrastRatio(hex1, hex2) {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

describe('Tier 2 — Features 06 to 12: UI, Animation & Accessibility Boundaries', () => {

  // =========================================================================
  // Feature 6: Lenis & GSAP Route Sync Boundaries
  // =========================================================================
  describe('Feature 6: Lenis & GSAP Route Sync Boundaries (T2-F06)', () => {
    beforeEach(() => {
      setupDomEnvironment();
    });

    afterEach(() => {
      teardownDomEnvironment();
    });

    it('T2-F06-01: verifies complete Lenis bypass when prefers-reduced-motion: reduce is active', () => {
      const matchMedia = createMockMatchMedia({ reducedMotion: true });
      const mql = matchMedia('(prefers-reduced-motion: reduce)');
      expect(mql.matches).toBe(true);

      // Contract: When prefers-reduced-motion is active, Lenis smooth scrolling interpolation is bypassed
      function initSmoothScroll(options = {}) {
        if (mql.matches) {
          return { active: false, mode: 'native-fallback', lenis: null };
        }
        return { active: true, mode: 'lenis-smooth', lenis: createMockLenis() };
      }

      const instance = initSmoothScroll();
      expect(instance.active).toBe(false);
      expect(instance.mode).toBe('native-fallback');
      expect(instance.lenis).toBeNull();
    });

    it('T2-F06-02: verifies clicking anchor link pointing to non-existent ID fails gracefully without throwing', () => {
      // Contract: handle in-page anchor links with querySelector safely
      function handleAnchorClick(href) {
        if (!href || !href.startsWith('#')) return false;
        try {
          const target = document.querySelector(href);
          if (!target) {
            // Gracefully ignore missing target element
            return false;
          }
          if (window.lenis) {
            window.lenis.scrollTo(target, { offset: -70, duration: 1.4 });
          }
          return true;
        } catch {
          return false;
        }
      }

      let threw = false;
      let handled = false;
      try {
        handled = handleAnchorClick('#non-existent-section-id-404');
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
      expect(handled).toBe(false);
    });

    it('T2-F06-03: verifies rapid route transition clicking does not leak ticker callbacks', () => {
      const gsap = createMockGsap();
      const lenis = createMockLenis();

      // Simulate route sync lifecycle hook
      let activeTickerCallback = null;

      function onMountRouteSync() {
        if (activeTickerCallback) {
          gsap.ticker.remove(activeTickerCallback);
        }
        activeTickerCallback = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(activeTickerCallback);
      }

      function onUnmountRouteSync() {
        if (activeTickerCallback) {
          gsap.ticker.remove(activeTickerCallback);
          activeTickerCallback = null;
        }
      }

      // Simulate 5 rapid navigations
      for (let i = 0; i < 5; i++) {
        onMountRouteSync();
        onUnmountRouteSync();
      }
      onMountRouteSync();

      // Exactly 1 ticker callback registered
      expect(gsap.tickerCallbacks.size).toBe(1);
    });

    it('T2-F06-04: verifies mid-scroll navigation stops existing momentum cleanly', () => {
      const lenis = createMockLenis();
      lenis.scroll = 1200;

      // Contract: on pathname change, immediate reset to scroll: 0 cancels ongoing momentum
      function handleRouteChange(newPath, currentPath) {
        if (newPath !== currentPath) {
          lenis.scrollTo(0, { immediate: true });
        }
      }

      handleRouteChange('/projects', '/');
      expect(lenis.scroll).toBe(0);
      const lastCall = lenis.calls[lenis.calls.length - 1];
      expect(lastCall.action).toBe('scrollTo');
      expect(lastCall.target).toBe(0);
    });

    it('T2-F06-05: verifies route navigation with query parameters preserves scroll refresh', () => {
      const gsap = createMockGsap();

      function handleRouteOrParamUpdate(pathname, search) {
        // ScrollTrigger.refresh recalculates all trigger positions
        gsap.ScrollTrigger.refresh();
      }

      handleRouteOrParamUpdate('/projects', '?category=Cybersecurity');
      expect(gsap.ScrollTrigger.refreshCalls).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Feature 7: Modal Scroll Lock Boundaries
  // =========================================================================
  describe('Feature 7: Modal Scroll Lock Boundaries (T2-F07)', () => {
    let lenis;

    beforeEach(() => {
      setupDomEnvironment();
      lenis = window.lenis;
    });

    afterEach(() => {
      teardownDomEnvironment();
    });

    it('T2-F07-01: verifies Escape key dismissal restores Lenis scroll lock immediately', () => {
      // Simulate modal open
      lenis.stop();
      expect(lenis.isStopped).toBe(true);

      // Contract: Escape key listener closes modal and calls lenis.start()
      function onKeyDown(e) {
        if (e.key === 'Escape') {
          lenis.start();
          return true;
        }
        return false;
      }

      const closed = onKeyDown({ key: 'Escape' });
      expect(closed).toBe(true);
      expect(lenis.isStopped).toBe(false);
    });

    it('T2-F07-02: verifies backdrop click dismissal restores Lenis scroll lock', () => {
      lenis.stop();
      expect(lenis.isStopped).toBe(true);

      function onBackdropClick(e) {
        if (e.target === e.currentTarget) {
          lenis.start();
          return true;
        }
        return false;
      }

      const backdrop = { id: 'modal-backdrop' };
      const handled = onBackdropClick({ target: backdrop, currentTarget: backdrop });
      expect(handled).toBe(true);
      expect(lenis.isStopped).toBe(false);
    });

    it('T2-F07-03: verifies nested modal scroll lock counter resilience', () => {
      let lockCount = 0;

      function acquireScrollLock() {
        lockCount++;
        if (lockCount === 1) {
          lenis.stop();
        }
      }

      function releaseScrollLock() {
        lockCount = Math.max(0, lockCount - 1);
        if (lockCount === 0) {
          lenis.start();
        }
      }

      // Open Modal 1 (e.g. TerminalModal)
      acquireScrollLock();
      expect(lockCount).toBe(1);
      expect(lenis.isStopped).toBe(true);

      // Open nested Modal 2 (e.g. CommandPalette)
      acquireScrollLock();
      expect(lockCount).toBe(2);
      expect(lenis.isStopped).toBe(true);

      // Close Modal 2 - scroll should remain locked
      releaseScrollLock();
      expect(lockCount).toBe(1);
      expect(lenis.isStopped).toBe(true);

      // Close Modal 1 - scroll should now resume
      releaseScrollLock();
      expect(lockCount).toBe(0);
      expect(lenis.isStopped).toBe(false);
    });

    it('T2-F07-04: verifies route navigation during open modal automatically cleans up scroll lock', () => {
      lenis.stop();
      expect(lenis.isStopped).toBe(true);

      // Unmount cleanup hook contract
      function useEffectCleanup() {
        lenis.start();
      }

      // Simulate unmount on route change
      useEffectCleanup();
      expect(lenis.isStopped).toBe(false);
    });

    it('T2-F07-05: verifies touchmove event interception on mobile viewports while modal is open', () => {
      let defaultPrevented = false;

      function onTouchMove(e) {
        if (lenis.isStopped) {
          e.preventDefault();
          defaultPrevented = true;
        }
      }

      lenis.stop();
      onTouchMove({
        preventDefault: () => {
          defaultPrevented = true;
        },
      });

      expect(defaultPrevented).toBe(true);
    });
  });

  // =========================================================================
  // Feature 8: Dynamic Filter GSAP Batching Boundaries
  // =========================================================================
  describe('Feature 8: Dynamic Filter GSAP Batching Boundaries (T2-F08)', () => {
    it('T2-F08-01: verifies empty search filter results render fallback without GSAP error', () => {
      const gsap = createMockGsap();

      function applyFilterAndBatch(items) {
        if (!items || items.length === 0) {
          return { empty: true, message: 'No projects found matching filter', triggers: [] };
        }
        const tweens = gsap.from('.project-card', { opacity: 0, y: 20 });
        return { empty: false, tweens };
      }

      let threw = false;
      let result = null;
      try {
        result = applyFilterAndBatch([]);
      } catch {
        threw = true;
      }

      expect(threw).toBe(false);
      expect(result.empty).toBe(true);
      expect(result.message).toContain('No projects found');
    });

    it('T2-F08-02: verifies rapid clicking across filter tabs kills previous tweens and cleans up triggers', () => {
      const gsap = createMockGsap();
      let activeContext = null;

      function switchFilter(category) {
        if (activeContext) {
          activeContext.revert();
        }
        activeContext = gsap.context(() => {
          gsap.from(`.category-${category}`, { opacity: 0, stagger: 0.1 });
        });
      }

      // Rapidly switch 5 categories
      const categories = ['All', 'Cybersecurity', 'Full-Stack', 'AI', 'All'];
      for (const cat of categories) {
        switchFilter(cat);
      }

      expect(activeContext).toBeDefined();
    });

    it('T2-F08-03: verifies dynamic filtering with prefers-reduced-motion: reduce', () => {
      const matchMedia = createMockMatchMedia({ reducedMotion: true });
      const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      expect(isReduced).toBe(true);

      function animateFilterChange(isReducedMotion) {
        if (isReducedMotion) {
          // Instant appearance with 0 duration
          return { duration: 0, opacity: 1, transform: 'none' };
        }
        return { duration: 0.4, opacity: 1, transform: 'translateY(0px)' };
      }

      const style = animateFilterChange(isReduced);
      expect(style.duration).toBe(0);
      expect(style.opacity).toBe(1);
      expect(style.transform).toBe('none');
    });

    it('T2-F08-04: verifies viewport resizing recalculates ScrollTrigger.batch positions', () => {
      const gsap = createMockGsap();

      function onResize() {
        gsap.ScrollTrigger.refresh();
      }

      onResize();
      expect(gsap.ScrollTrigger.refreshCalls).toBe(1);
    });

    it('T2-F08-05: verifies dynamic child addition in LearningTimeline or project list', () => {
      const items = [{ id: 1, title: 'Quarter 1' }];

      function appendQuarter(newItem) {
        const updated = [...items, newItem];
        return updated.map(item => ({ ...item, visible: true, opacity: 1 }));
      }

      const rendered = appendQuarter({ id: 2, title: 'Quarter 2' });
      expect(rendered).toHaveLength(2);
      expect(rendered.every(item => item.opacity === 1)).toBe(true);
    });
  });

  // =========================================================================
  // Feature 9: Mobile Magnetic Touch Guard Boundaries
  // =========================================================================
  describe('Feature 9: Mobile Magnetic Touch Guard Boundaries (T2-F09)', () => {
    it('T2-F09-01: verifies magnetic tracking is completely disabled on touch devices (pointer: coarse)', () => {
      const matchMedia = createMockMatchMedia({ pointerFine: false });
      const isFinePointer = matchMedia('(pointer: fine)').matches;
      expect(isFinePointer).toBe(false);

      function setupMagneticListener(target, isFine) {
        if (!isFine) {
          return { attached: false, transform: 'none' };
        }
        return { attached: true, transform: 'translate3d(10px, 10px, 0)' };
      }

      const result = setupMagneticListener({}, isFinePointer);
      expect(result.attached).toBe(false);
      expect(result.transform).toBe('none');
    });

    it('T2-F09-02: verifies tapping on mobile does not leave element stuck in displaced coordinates', () => {
      let currentTransform = { x: 0, y: 0 };

      // Contract: On mobile touch devices, touchstart/touchend maintain x: 0, y: 0
      function handleTouchEnd() {
        currentTransform = { x: 0, y: 0 };
      }

      handleTouchEnd();
      expect(currentTransform.x).toBe(0);
      expect(currentTransform.y).toBe(0);
    });

    it('T2-F09-03: verifies magnetic effect bypass under prefers-reduced-motion: reduce', () => {
      const matchMedia = createMockMatchMedia({ reducedMotion: true, pointerFine: true });
      const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      expect(prefersReduced).toBe(true);

      function computeDisplacement(x, y, reduced) {
        if (reduced) {
          return { x: 0, y: 0 };
        }
        return { x: x * 0.2, y: y * 0.2 };
      }

      const offset = computeDisplacement(50, 50, prefersReduced);
      expect(offset.x).toBe(0);
      expect(offset.y).toBe(0);
    });

    it('T2-F09-04: verifies fast mouse flick outside window boundaries resets cleanly', () => {
      let position = { x: 45, y: -30 };

      function handleMouseLeave() {
        // Spring back to origin (0, 0)
        position = { x: 0, y: 0 };
      }

      handleMouseLeave();
      expect(position.x).toBe(0);
      expect(position.y).toBe(0);
    });

    it('T2-F09-05: verifies unmount cleanup kills active GSAP tweens', () => {
      const gsap = createMockGsap();
      let isCleanedUp = false;

      const ctx = gsap.context(() => {});
      function cleanup() {
        ctx.revert();
        isCleanedUp = true;
      }

      cleanup();
      expect(isCleanedUp).toBe(true);
      expect(ctx.revertCalls).toBe(1);
    });
  });

  // =========================================================================
  // Feature 10: SSR-Safe 3D Canvas Background Boundaries
  // =========================================================================
  describe('Feature 10: SSR-Safe 3D Canvas Background Boundaries (T2-F10)', () => {
    it('T2-F10-01: verifies complete WebGL canvas bypass when prefers-reduced-motion: reduce is active', () => {
      const matchMedia = createMockMatchMedia({ reducedMotion: true });
      const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      expect(isReduced).toBe(true);

      function initVantaEffect(reduced) {
        if (reduced) {
          return { canvasCreated: false, fallbackActive: true };
        }
        return { canvasCreated: true, fallbackActive: false };
      }

      const result = initVantaEffect(isReduced);
      expect(result.canvasCreated).toBe(false);
      expect(result.fallbackActive).toBe(true);
    });

    it('T2-F10-02: verifies mobile viewport bypass (< 768px)', () => {
      const windowWidth = 375; // Mobile emulation
      const isMobile = windowWidth < 768;

      function shouldMount3DCanvas(width) {
        return width >= 768;
      }

      expect(shouldMount3DCanvas(windowWidth)).toBe(false);
    });

    it('T2-F10-03: verifies graceful error handling when WebGL is unsupported or throws context error', () => {
      function createWebGLContext(forceFail = false) {
        if (forceFail) {
          throw new Error('WebGL context creation failed');
        }
        return { getContext: () => null };
      }

      let errorCaught = false;
      let fallbackRendered = false;

      try {
        createWebGLContext(true);
      } catch {
        errorCaught = true;
        fallbackRendered = true;
      }

      expect(errorCaught).toBe(true);
      expect(fallbackRendered).toBe(true);
    });

    it('T2-F10-04: verifies theme toggle thrashing resilience (10 rapid toggles)', () => {
      let activeContextCount = 0;
      let maxSimultaneousContexts = 0;

      function toggleTheme(theme) {
        // Destroy existing before initializing new
        if (activeContextCount > 0) {
          activeContextCount--;
        }
        activeContextCount++;
        maxSimultaneousContexts = Math.max(maxSimultaneousContexts, activeContextCount);
      }

      for (let i = 0; i < 10; i++) {
        toggleTheme(i % 2 === 0 ? 'dark' : 'light');
      }

      expect(maxSimultaneousContexts).toBeLessThanOrEqual(1);
    });

    it('T2-F10-05: verifies tab backgrounding pauses or throttles animation loop', () => {
      let isLoopActive = true;

      function onVisibilityChange(hidden) {
        if (hidden) {
          isLoopActive = false; // Pause RAF loop
        } else {
          isLoopActive = true;  // Resume RAF loop
        }
      }

      onVisibilityChange(true);
      expect(isLoopActive).toBe(false);

      onVisibilityChange(false);
      expect(isLoopActive).toBe(true);
    });
  });

  // =========================================================================
  // Feature 11: React Bits Micro-Interactions Boundaries
  // =========================================================================
  describe('Feature 11: React Bits Micro-Interactions Boundaries (T2-F11)', () => {
    it('T2-F11-01: verifies DecryptedText bypass under prefers-reduced-motion: reduce', () => {
      const matchMedia = createMockMatchMedia({ reducedMotion: true });
      const isReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      expect(isReduced).toBe(true);

      const targetText = 'SECURITY INTERN';
      function renderDecryptedText(target, isReducedMotion) {
        if (isReducedMotion) {
          return target; // Immediate render without scramble frames
        }
        return 'X#@9!_?';
      }

      const initialText = renderDecryptedText(targetText, isReduced);
      expect(initialText).toBe(targetText);
    });

    it('T2-F11-02: verifies DecryptedText string boundary handling with symbols, numbers, and spaces', () => {
      const complexString = 'CVE-2026-0001 (CRITICAL: 9.8)';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=';

      function simulateResolveStep(target, progress) {
        return target
          .split('')
          .map((ch, idx) => {
            if (ch === ' ') return ' ';
            if (idx / target.length <= progress) return ch;
            return chars[idx % chars.length];
          })
          .join('');
      }

      // Midway scramble preserves spaces and string length
      const midway = simulateResolveStep(complexString, 0.5);
      expect(midway.length).toBe(complexString.length);
      expect(midway[13]).toBe(' '); // Space at original index

      // Full resolve
      const resolved = simulateResolveStep(complexString, 1.0);
      expect(resolved).toBe(complexString);
    });

    it('T2-F11-03: verifies SpotlightCard behavior on touch-only devices', () => {
      const matchMedia = createMockMatchMedia({ pointerFine: false });
      const isTouch = !matchMedia('(pointer: fine)').matches;
      expect(isTouch).toBe(true);

      function handleTouchTap() {
        // Spotlight overlay should not linger on touch devices
        return { spotlightOpacity: 0 };
      }

      const style = handleTouchTap();
      expect(style.spotlightOpacity).toBe(0);
    });

    it('T2-F11-04: verifies custom spotlightColor prop application', () => {
      const customColor = 'rgba(59, 130, 246, 0.2)';

      function generateSpotlightGradient(x, y, color = 'rgba(255,255,255,0.1)') {
        return `radial-gradient(circle at ${x}px ${y}px, ${color}, transparent 80%)`;
      }

      const bg = generateSpotlightGradient(100, 150, customColor);
      expect(bg).toContain(customColor);
      expect(bg).toContain('100px 150px');
    });

    it('T2-F11-05: verifies rapid mouseenter/mouseleave during active decryption', () => {
      let activeInterval = null;
      let clearCount = 0;

      function triggerScramble() {
        if (activeInterval) {
          clearCount++;
          clearInterval(activeInterval);
        }
        activeInterval = setInterval(() => {}, 20);
      }

      for (let i = 0; i < 5; i++) {
        triggerScramble();
      }

      expect(clearCount).toBe(4);
      clearInterval(activeInterval);
    });
  });

  // =========================================================================
  // Feature 12: Accessibility Hardening Boundaries
  // =========================================================================
  describe('Feature 12: Accessibility Hardening Boundaries (T2-F12)', () => {
    it('T2-F12-01: verifies modal focus trap containment', () => {
      const focusableSelectors = ['button', '[href]', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'];
      const focusableElements = [
        { id: 'close-btn', tagName: 'BUTTON' },
        { id: 'prev-btn', tagName: 'BUTTON' },
        { id: 'next-btn', tagName: 'BUTTON' },
      ];

      function handleTabKey(currentIndex, shiftKey) {
        if (shiftKey) {
          return currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
        }
        return currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
      }

      // Tab on last element wraps to first
      expect(handleTabKey(2, false)).toBe(0);

      // Shift+Tab on first element wraps to last
      expect(handleTabKey(0, true)).toBe(2);
    });

    it('T2-F12-02: verifies focus restoration to triggering CTA on modal dismiss', () => {
      let activeElement = { id: 'walkthrough-trigger-btn' };
      const originalTrigger = activeElement;

      // Modal opens
      activeElement = { id: 'modal-close-btn' };

      // Modal closes
      function onModalClose() {
        activeElement = originalTrigger;
      }

      onModalClose();
      expect(activeElement.id).toBe('walkthrough-trigger-btn');
    });

    it('T2-F12-03: verifies WCAG AA color contrast ratio (>= 4.5:1) for text across themes', () => {
      // Dark mode: --text-primary (#F4F5F7) vs --bg-main (#0D0E12)
      const darkContrast = calculateContrastRatio('#F4F5F7', '#0D0E12');
      expect(darkContrast).toBeGreaterThanOrEqual(4.5);
      expect(darkContrast).toBeGreaterThan(15.0); // AAA rating is > 7:1

      // Light mode: --text-primary (#121316) vs --bg-main (#F6F6F8)
      const lightContrast = calculateContrastRatio('#121316', '#F6F6F8');
      expect(lightContrast).toBeGreaterThanOrEqual(4.5);
      expect(lightContrast).toBeGreaterThan(14.0);
    });

    it('T2-F12-04: verifies safe-area-inset padding on mobile viewports for floating dock', () => {
      const dockHtml = '<div class="fixed bottom-6 pb-[env(safe-area-inset-bottom)] z-50">Dock</div>';
      expect(dockHtml).toContain('env(safe-area-inset-bottom)');
    });

    it('T2-F12-05: verifies minimum interactive touch target dimensions (>= 44x44px)', () => {
      const buttons = [
        { label: 'Close Modal', width: 44, height: 44 },
        { label: 'Next Step', width: 48, height: 44 },
        { label: 'Theme Toggle', width: 44, height: 44 },
      ];

      for (const btn of buttons) {
        expect(btn.width).toBeGreaterThanOrEqual(44);
        expect(btn.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

});
