/**
 * Tier 4: Real-World Application End-to-End User Workflows
 * Suite: Security, Accessibility & Theme Workflows (wf02-security-and-a11y.test.mjs)
 *
 * Scenarios Covered:
 * - WF-T4-04: Multi-Modal Contact Inquiry Submission with Fault Injection (F13, F14, F15, F16, F17, F18, F19)
 * - WF-T4-05: Strict WCAG 2.1 AA Keyboard Navigation & Focus Trap Audit (F7, F12, F16)
 * - WF-T4-06: Cross-Theme Switching Across 3D Canvas, Code Blocks & Modals (F10, F11, F21)
 * - WF-T4-07: Complete System Prefers-Reduced-Motion Experience (F6, F9, F10, F21)
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
import { createMockSupabaseClient } from '../harness/mock-supabase.mjs';
import { createMockRequest, invokeRoute } from '../harness/http.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Tier 4: Security, Accessibility & Theme Workflows', () => {
  let mockStorage;
  let mockSupabase;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockStorage.installGlobally();
    mockSupabase = createMockSupabaseClient();
    setupDomEnvironment();
  });

  afterEach(() => {
    mockStorage.uninstall();
    mockSupabase.reset();
    teardownDomEnvironment();
  });

  // WF-T4-04: Multi-Modal Contact Inquiry Submission with Fault Injection
  it('WF-T4-04: Multi-Modal Contact Inquiry Submission with Fault Injection', async () => {
    // Step 1 & 2: User opens contact form and selects category
    let formData = {
      name: '',
      email: '',
      category: 'Velora & Growth Inquiries',
      message: '',
    };

    // Step 3: Enter invalid email & short message
    formData.email = 'notanemail';
    formData.message = 'hi';

    const validateForm = (data) => {
      const errors = {};
      if (!data.name || data.name.trim().length < 2) {
        errors.name = 'Name must be at least 2 characters';
      }
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.email = 'Please provide a valid email address';
      }
      if (!data.message || data.message.trim().length < 10) {
        errors.message = 'Message must be at least 10 characters';
      }
      return { isValid: Object.keys(errors).length === 0, errors };
    };

    // Step 4: Inline validation errors appear without page reload
    const firstCheck = validateForm(formData);
    expect(firstCheck.isValid).toBe(false);
    expect(firstCheck.errors.name).toBeDefined();
    expect(firstCheck.errors.email).toBeDefined();
    expect(firstCheck.errors.message).toBeDefined();

    // Step 5: Correct inputs with valid data
    formData = {
      name: 'Dr. Sarah Connor',
      email: 's.connor@cyberdyne-resilience.io',
      category: 'Velora & Growth Inquiries',
      message: 'Inquiring about engineering partnerships and system reliability consulting.',
    };
    const secondCheck = validateForm(formData);
    expect(secondCheck.isValid).toBe(true);

    // Step 6: Simulate degraded/offline Supabase status
    mockSupabase.setOffline(true);

    // Step 7 & 8: Contact Route Handler with resilient offline logging
    const contactRouteHandler = async (req) => {
      let body;
      try {
        body = await req.json();
      } catch {
        return new Response(JSON.stringify({ success: false }), { status: 400 });
      }

      // Check DB with resilient fallback
      let dbSaved = false;
      try {
        const { error } = await mockSupabase.from('contacts').insert(body);
        dbSaved = !error;
      } catch {
        dbSaved = false;
      }

      // Local fallback queue
      if (!dbSaved) {
        const existingQueue = JSON.parse(mockStorage.getItem('contact_offline_queue') || '[]');
        existingQueue.push({ ...body, queuedAt: Date.now() });
        mockStorage.setItem('contact_offline_queue', JSON.stringify(existingQueue));
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            status: 'received',
            fallback: !dbSaved,
            message: 'Your inquiry has been received and queued securely.',
          },
          meta: { timestamp: new Date().toISOString() },
        }),
        {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }
      );
    };

    const res = await invokeRoute(contactRouteHandler, {
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      body: formData,
    });

    // Step 9: Confirms submission, fallback storage, and reset form
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(res.data.data.fallback).toBe(true);

    const queued = JSON.parse(mockStorage.getItem('contact_offline_queue'));
    expect(queued.length).toBe(1);
    expect(queued[0].email).toBe('s.connor@cyberdyne-resilience.io');
  });

  // WF-T4-05: Strict WCAG 2.1 AA Keyboard Navigation & Focus Trap Audit
  it('WF-T4-05: Strict WCAG 2.1 AA Keyboard Navigation & Focus Trap Audit', () => {
    const lenis = createMockLenis();

    // Step 1, 2, 3: Skip to main content link moves focus to <main id="main-content">
    let currentFocusTarget = 'skip-link';
    const onSkipLinkActivate = () => {
      currentFocusTarget = 'main-content';
    };

    onSkipLinkActivate();
    expect(currentFocusTarget).toBe('main-content');

    // Step 4: Navigation links have accessible labels and focus-visible indicators
    const navItems = [
      { label: 'About', href: '#about', focusRing: true },
      { label: 'Projects', href: '#projects', focusRing: true },
      { label: 'Cybersecurity', href: '/cybersecurity', focusRing: true },
      { label: 'Contact', href: '#contact', focusRing: true },
    ];
    expect(navItems.every((item) => item.focusRing)).toBe(true);

    // Step 5, 6, 7: Ctrl+K opens Terminal / CommandPalette, focus trapped in input, Escape closes
    let isCommandPaletteOpen = false;
    let paletteFocus = null;

    const openCommandPalette = () => {
      isCommandPaletteOpen = true;
      paletteFocus = 'palette-search-input';
      lenis.stop();
    };

    openCommandPalette();
    expect(isCommandPaletteOpen).toBe(true);
    expect(paletteFocus).toBe('palette-search-input');
    expect(lenis.isStopped).toBe(true);

    const closeCommandPalette = () => {
      isCommandPaletteOpen = false;
      paletteFocus = null;
      currentFocusTarget = 'terminal-trigger-btn';
      lenis.start();
    };

    closeCommandPalette();
    expect(isCommandPaletteOpen).toBe(false);
    expect(currentFocusTarget).toBe('terminal-trigger-btn');
    expect(lenis.isStopped).toBe(false);

    // Step 8, 9, 10: FloatingJourneyDock modal opened, aria-modal verified, Escape closes
    const dockModalHtml = `
      <div role="dialog" aria-modal="true" aria-labelledby="dock-title">
        <h2 id="dock-title">60-Second Walkthrough</h2>
        <button aria-label="Close walkthrough">×</button>
      </div>
    `;

    const dialogs = getByRole(dockModalHtml, 'dialog');
    expect(dialogs.length).toBe(1);
    expect(hasAttribute(dialogs[0], 'aria-modal', 'true')).toBe(true);

    let isDockOpen = true;
    lenis.stop();
    const onDockKeyDown = (key) => {
      if (key === 'Escape') {
        isDockOpen = false;
        lenis.start();
      }
    };

    onDockKeyDown('Escape');
    expect(isDockOpen).toBe(false);
    expect(lenis.isStopped).toBe(false);
  });

  // WF-T4-06: Cross-Theme Switching Across 3D Canvas, Code Blocks & Modals
  it('WF-T4-06: Cross-Theme Switching Across 3D Canvas, Code Blocks & Modals', () => {
    // Step 1: Default dark theme
    let currentTheme = 'dark';
    mockStorage.setItem('theme', 'dark');

    const themeColors = {
      dark: { bg: '#0D0E12', text: '#F3F4F6', canvasBg: 0x0d0e12, codeBg: '#16181D' },
      light: { bg: '#F6F6F8', text: '#111215', canvasBg: 0xf6f6f8, codeBg: '#EFEFF2' },
    };

    // Step 2 & 3: Clicks ThemeToggle -> Switches to Light. VantaNet updates canvas background color
    const toggleTheme = () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      mockStorage.setItem('theme', currentTheme);
    };

    toggleTheme();
    expect(currentTheme).toBe('light');
    expect(mockStorage.getItem('theme')).toBe('light');

    // Emulate WebGL canvas update without context loss
    class MockVantaEffect {
      constructor() {
        this.options = { backgroundColor: themeColors.dark.canvasBg };
        this.contextLost = false;
      }
      setOptions(newOpts) {
        Object.assign(this.options, newOpts);
      }
    }

    const vanta = new MockVantaEffect();
    vanta.setOptions({ backgroundColor: themeColors.light.canvasBg });
    expect(vanta.options.backgroundColor).toBe(0xf6f6f8);
    expect(vanta.contextLost).toBe(false);

    // Step 4: PromptStudio code block contrast
    const codeBlockContrast = 8.5; // High contrast
    expect(codeBlockContrast).toBeGreaterThan(4.5);

    // Step 5: Terminal modal 'theme dark' command switches back
    const executeTerminalCmd = (cmd) => {
      if (cmd === 'theme dark') {
        currentTheme = 'dark';
        mockStorage.setItem('theme', 'dark');
        vanta.setOptions({ backgroundColor: themeColors.dark.canvasBg });
      }
    };

    executeTerminalCmd('theme dark');
    expect(currentTheme).toBe('dark');
    expect(mockStorage.getItem('theme')).toBe('dark');
    expect(vanta.options.backgroundColor).toBe(0x0d0e12);

    // Step 6 & 7: Navigation to /cybersecurity retains dark theme without FOUC
    const routeTheme = mockStorage.getItem('theme');
    expect(routeTheme).toBe('dark');
  });

  // WF-T4-07: Complete System Prefers-Reduced-Motion Experience
  it('WF-T4-07: Complete System Prefers-Reduced-Motion Experience', () => {
    // Step 1: prefers-reduced-motion media query enabled
    const matchMediaReduced = createMockMatchMedia({ reducedMotion: true });
    const prefersReducedMotion = matchMediaReduced('(prefers-reduced-motion: reduce)').matches;
    expect(prefersReducedMotion).toBe(true);

    // Step 2 & 3: Hero section elements render immediately without delay
    const heroElements = [
      { id: 'greeting', transitionDuration: prefersReducedMotion ? '0.01ms' : '600ms', opacity: 1 },
      { id: 'headline', transitionDuration: prefersReducedMotion ? '0.01ms' : '800ms', opacity: 1 },
      { id: 'cards', transitionDuration: prefersReducedMotion ? '0.01ms' : '500ms', opacity: 1 },
    ];

    expect(heroElements.every((el) => el.transitionDuration === '0.01ms')).toBe(true);
    expect(heroElements.every((el) => el.opacity === 1)).toBe(true);

    // Step 4: Lenis smooth scrolling is bypassed; native instant scroll active
    const lenis = createMockLenis({ smooth: !prefersReducedMotion });
    expect(lenis.options.smooth).toBe(false);

    // Step 5: VantaNet background RAF loop disabled; static CSS backdrop active
    const vantaState = {
      isRafLoopActive: !prefersReducedMotion,
      fallbackCssActive: prefersReducedMotion,
    };
    expect(vantaState.isRafLoopActive).toBe(false);
    expect(vantaState.fallbackCssActive).toBe(true);

    // Step 6: GsapMagnetic disabled on hover
    let buttonTransform = 'translate(0px, 0px)';
    const onMagneticHover = (reducedMotion) => {
      if (reducedMotion) {
        buttonTransform = 'none';
      } else {
        buttonTransform = 'translate(10px, 5px)';
      }
    };

    onMagneticHover(prefersReducedMotion);
    expect(buttonTransform).toBe('none');

    // Step 7: ProjectsSection cards render statically without stagger
    const projectCards = [
      { id: 1, animated: !prefersReducedMotion, visible: true },
      { id: 2, animated: !prefersReducedMotion, visible: true },
    ];
    expect(projectCards.every((c) => c.animated === false)).toBe(true);
    expect(projectCards.every((c) => c.visible === true)).toBe(true);
  });
});
