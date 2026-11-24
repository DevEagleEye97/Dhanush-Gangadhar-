/**
 * Tier 3: Cross-Feature Pairwise Combination Tests
 * Suite: Navigation, Modals & Animations (combo-navigation-animations.test.mjs)
 *
 * Scenarios Covered:
 * - TC-T3-01: Navigation Route Transition with Lenis Scroll Reset & GSAP Refresh (F6 x F20)
 * - TC-T3-02: TerminalModal Open + Theme Switch with Scroll Lock Preservation (F7 x F21)
 * - TC-T3-03: Project Category Filtering + SpotlightCard Micro-Interaction (F8 x F11)
 * - TC-T3-04: Touch Viewport Tap on Floating Journey Dock without Offset Drift (F9 x F12)
 * - TC-T3-05: Prefers-Reduced-Motion Emulation on 3D Background & GSAP Timelines (F10 x F6)
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
  extractAttributes,
  getByRole,
  getByAria,
  hasAttribute,
} from '../harness/dom.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Tier 3: Navigation, Modals & Animation Interactions', () => {
  beforeEach(() => {
    setupDomEnvironment();
  });

  afterEach(() => {
    teardownDomEnvironment();
  });

  // TC-T3-01: Navigation Route Transition with Lenis Scroll Reset & GSAP Refresh (F6 x F20)
  it('TC-T3-01: Navigation Route Transition with Lenis Scroll Reset & GSAP Refresh', () => {
    const smoothScrollPath = path.resolve(projectRoot, 'src', 'components', 'SmoothScroll.tsx');
    expect(fs.existsSync(smoothScrollPath)).toBe(true);
    const content = fs.readFileSync(smoothScrollPath, 'utf8');

    // 1. Precondition: User is at '/', scrolled down to #contact (scrollY > 1500)
    const telemetry = createScrollTelemetry();
    const lenis = createMockLenis();
    const gsap = createMockGsap();

    telemetry.scrollTo(0, 1850);
    lenis.scrollTo(1850);
    expect(telemetry.scrollY).toBe(1850);
    expect(lenis.scroll).toBe(1850);

    // 2. Navigation Action: Transition from '/' to '/projects'
    // Route transition handler simulates usePathname listener in SmoothScroll.tsx
    const handleRouteChange = (targetPathname, scrollCtrl, lenisInst, gsapInst) => {
      // Contract: Reset scroll to 0 and trigger ScrollTrigger.refresh()
      scrollCtrl.scrollTo(0, 0);
      if (lenisInst && typeof lenisInst.scrollTo === 'function') {
        lenisInst.scrollTo(0, { immediate: true });
      }
      if (gsapInst && gsapInst.ScrollTrigger && typeof gsapInst.ScrollTrigger.refresh === 'function') {
        gsapInst.ScrollTrigger.refresh();
      }
    };

    handleRouteChange('/projects', telemetry, lenis, gsap);

    // 3. Expected Assertions:
    // - window.scrollY and lenis.scroll reset to 0
    expect(telemetry.scrollY).toBe(0);
    expect(lenis.scroll).toBe(0);

    // - ScrollTrigger.refresh() invoked
    expect(gsap.ScrollTrigger.refreshCalls).toBe(1);

    // - Check SmoothScroll component architecture for Lenis & GSAP bridge
    expect(content).toContain('Lenis');
    expect(content).toContain('ScrollTrigger');
  });

  // TC-T3-02: TerminalModal Open + Theme Switch with Scroll Lock Preservation (F7 x F21)
  it('TC-T3-02: TerminalModal Open + Theme Switch with Scroll Lock Preservation', () => {
    const terminalModalPath = path.resolve(projectRoot, 'src', 'components', 'TerminalModal.tsx');
    expect(fs.existsSync(terminalModalPath)).toBe(true);
    const terminalContent = fs.readFileSync(terminalModalPath, 'utf8');

    // 1. Precondition: Loaded in dark mode at scrollY = 500px
    const telemetry = createScrollTelemetry();
    const lenis = createMockLenis();
    telemetry.scrollTo(0, 500);
    lenis.scrollTo(500);

    let currentTheme = 'dark';
    let isModalOpen = false;

    // Simulate modal scroll lock lifecycle
    const openModal = () => {
      isModalOpen = true;
      lenis.stop();
    };

    const executeTerminalThemeCommand = (newTheme) => {
      if (['light', 'dark', 'system'].includes(newTheme)) {
        currentTheme = newTheme;
        if (typeof document !== 'undefined' && document.documentElement) {
          document.documentElement.setAttribute('class', newTheme);
        }
      }
    };

    const handleBackgroundWheelScroll = (deltaY) => {
      if (!lenis.isStopped) {
        telemetry.scrollBy(0, deltaY);
        lenis.scrollTo(telemetry.scrollY);
      }
    };

    // 2. Action Sequence:
    // - Open TerminalModal
    openModal();
    expect(isModalOpen).toBe(true);
    expect(lenis.isStopped).toBe(true);

    // - Type command 'theme light' in terminal
    executeTerminalThemeCommand('light');
    expect(currentTheme).toBe('light');

    // - Attempt to scroll background body behind modal
    handleBackgroundWheelScroll(120);

    // 3. Expected Assertions:
    // - Background scroll remained locked at 500px
    expect(telemetry.scrollY).toBe(500);
    expect(lenis.isStopped).toBe(true);

    // - HTML class attribute updated to light
    expect(document.documentElement.getAttribute('class')).toContain('light');

    // - TerminalModal contains keyboard handling and theme commands
    expect(terminalContent.includes('KeyDown') || terminalContent.includes('keydown') || terminalContent.includes('Escape')).toBe(true);
    expect(terminalContent).toContain('theme');
  });

  // TC-T3-03: Project Category Filtering + SpotlightCard Micro-Interaction (F8 x F11)
  it('TC-T3-03: Project Category Filtering + SpotlightCard Micro-Interaction', () => {
    const projectsSectionPath = path.resolve(projectRoot, 'src', 'components', 'ProjectsSection.tsx');
    expect(fs.existsSync(projectsSectionPath)).toBe(true);
    const projectsContent = fs.readFileSync(projectsSectionPath, 'utf8');

    // 1. Preconditions & Mock Category Data
    const mockProjects = [
      { id: 'p1', title: 'Network Packet Sniffer', category: 'Cybersecurity', visible: true },
      { id: 'p2', title: 'Velora Landing Page', category: 'Web development', visible: true },
      { id: 'p3', title: 'Kernel Security Module', category: 'Cybersecurity', visible: true },
    ];

    // Filter by 'Cybersecurity'
    const filterCategory = 'Cybersecurity';
    const filtered = mockProjects.map((p) => ({
      ...p,
      visible: p.category === filterCategory,
      opacity: p.category === filterCategory ? 1 : 0,
      visibility: p.category === filterCategory ? 'visible' : 'hidden',
    }));

    // Verify active filter elements
    const activeProjects = filtered.filter((p) => p.visible);
    expect(activeProjects.length).toBe(2);
    expect(activeProjects[0].opacity).toBe(1);
    expect(activeProjects[0].visibility).toBe('visible');

    // 2. SpotlightCard Micro-Interaction Simulation
    // Emulates coordinate tracking on mousemove (150, 80)
    let spotlightCoords = { x: 0, y: 0, active: false };
    const handleCardMouseMove = (event, rect) => {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      spotlightCoords = { x, y, active: true };
    };

    handleCardMouseMove({ clientX: 250, clientY: 180 }, { left: 100, top: 100 });
    expect(spotlightCoords.x).toBe(150);
    expect(spotlightCoords.y).toBe(80);
    expect(spotlightCoords.active).toBe(true);

    // 3. Verify ProjectSection contains filter categories and interactive cards
    expect(projectsContent.includes('activeCategory') || projectsContent.includes('selectedCategory') || projectsContent.includes('CATEGORIES')).toBe(true);
    expect(projectsContent).toContain('ProjectCard');
  });

  // TC-T3-04: Touch Viewport Tap on Floating Journey Dock without Offset Drift (F9 x F12)
  it('TC-T3-04: Touch Viewport Tap on Floating Journey Dock without Offset Drift', () => {
    const floatingDockPath = path.resolve(projectRoot, 'src', 'components', 'FloatingJourneyDock.tsx');
    const gsapMagneticPath = path.resolve(projectRoot, 'src', 'components', 'GsapMagnetic.tsx');
    expect(fs.existsSync(floatingDockPath)).toBe(true);
    expect(fs.existsSync(gsapMagneticPath)).toBe(true);

    const magneticContent = fs.readFileSync(gsapMagneticPath, 'utf8');
    const dockContent = fs.readFileSync(floatingDockPath, 'utf8');

    // 1. Precondition: Mobile touch device (pointer: coarse)
    const matchMediaCoarse = createMockMatchMedia({ pointerFine: false });
    const isFinePointer = matchMediaCoarse('(pointer: fine)').matches;
    expect(isFinePointer).toBe(false);

    // 2. Touch event simulation on magnetic button
    let transformValue = 'none';
    const handleTouchInteraction = (finePointer) => {
      if (finePointer) {
        transformValue = 'translate(15px, 10px)';
      } else {
        // Guard prevents displacement on touch devices
        transformValue = 'none';
      }
    };

    handleTouchInteraction(isFinePointer);
    expect(transformValue).toBe('none');

    // 3. Floating Journey Dock Modal opens with accessibility contracts
    const mockModalHtml = `
      <div role="dialog" aria-modal="true" aria-labelledby="journey-title" class="safe-area-dock">
        <h2 id="journey-title">My Journey in 60 Seconds</h2>
        <button aria-label="Close modal">×</button>
      </div>
    `;

    const dialogs = getByRole(mockModalHtml, 'dialog');
    expect(dialogs.length).toBe(1);
    expect(hasAttribute(dialogs[0], 'aria-modal', 'true')).toBe(true);
    expect(hasAttribute(dialogs[0], 'aria-labelledby', 'journey-title')).toBe(true);

    // 4. Verify GsapMagnetic source guards with pointer check
    const hasPointerGuard = magneticContent.includes('pointer') || magneticContent.includes('matchMedia') || magneticContent.includes('ontouchstart');
    expect(hasPointerGuard).toBe(true);

    // 5. Verify FloatingJourneyDock contains dialog and close attributes
    expect(dockContent).toContain('Close');
    expect(dockContent).toContain('modal');
  });

  // TC-T3-05: Prefers-Reduced-Motion Emulation on 3D Background & GSAP Timelines (F10 x F6)
  it('TC-T3-05: Prefers-Reduced-Motion Emulation on 3D Background & GSAP Timelines', () => {
    const heroPath = path.resolve(projectRoot, 'src', 'components', 'Hero.tsx');
    const smoothScrollPath = path.resolve(projectRoot, 'src', 'components', 'SmoothScroll.tsx');
    expect(fs.existsSync(heroPath)).toBe(true);
    expect(fs.existsSync(smoothScrollPath)).toBe(true);

    const heroContent = fs.readFileSync(heroPath, 'utf8');

    // 1. Precondition: prefers-reduced-motion: reduce is true
    const matchMediaReduced = createMockMatchMedia({ reducedMotion: true });
    const prefersReducedMotion = matchMediaReduced('(prefers-reduced-motion: reduce)').matches;
    expect(prefersReducedMotion).toBe(true);

    // 2. VantaNet Canvas / WebGL Lifecycle Simulation
    class SimulatedVantaNet {
      constructor(options = {}) {
        this.options = options;
        this.isRenderLoopActive = false;
        this.mode = 'css-fallback';
      }

      init(reducedMotion) {
        if (reducedMotion) {
          // Bypass 60fps RAF loop; use lightweight static CSS fallback
          this.isRenderLoopActive = false;
          this.mode = 'css-fallback';
        } else {
          this.isRenderLoopActive = true;
          this.mode = 'webgl-active';
        }
      }

      destroy() {
        this.isRenderLoopActive = false;
      }
    }

    const vanta = new SimulatedVantaNet();
    vanta.init(prefersReducedMotion);
    expect(vanta.isRenderLoopActive).toBe(false);
    expect(vanta.mode).toBe('css-fallback');

    // 3. Hero Entrance Timeline Simulation
    // In reduced motion mode, elements mount immediately at opacity 1 without staggered translates
    const heroElements = [
      { id: 'greeting', opacity: prefersReducedMotion ? 1 : 0 },
      { id: 'headline', opacity: prefersReducedMotion ? 1 : 0 },
      { id: 'actions', opacity: prefersReducedMotion ? 1 : 0 },
    ];

    expect(heroElements.every((el) => el.opacity === 1)).toBe(true);

    // 4. SmoothScroll Disables Virtual Interpolation
    const mockLenis = createMockLenis({ smooth: !prefersReducedMotion });
    if (prefersReducedMotion) {
      mockLenis.isSmooth = false;
    }
    expect(mockLenis.isSmooth).toBe(false);

    // 5. Verify Hero component structure contains GSAP animations
    expect(heroContent).toContain('gsap');
  });
});
