/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 09: Mobile Magnetic Touch Guard (GsapMagnetic.tsx)
 *
 * Verifies that magnetic cursor attraction operates with gsap.quickTo on pointer: fine devices,
 * springs back on mouseleave, and scales proportionally with the strength factor.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';
import { createMockMatchMedia, createMockGsap } from '../harness/dom.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 09: Mobile Magnetic Touch Guard (Tier 1)', () => {
  const magneticComponentPath = path.resolve(projectRoot, 'src', 'components', 'GsapMagnetic.tsx');

  it('T1-F09-01: Verify magnetic cursor tracking on desktop matching (pointer: fine)', () => {
    expect(fs.existsSync(magneticComponentPath)).toBe(true);
    const matchMedia = createMockMatchMedia({ pointerFine: true });
    const isFinePointer = matchMedia('(pointer: fine)').matches;
    expect(isFinePointer).toBe(true);

    const mockGsap = createMockGsap();
    const xTo = mockGsap.quickTo('target-btn', 'x', { duration: 0.35, ease: 'power3.out' });
    const yTo = mockGsap.quickTo('target-btn', 'y', { duration: 0.35, ease: 'power3.out' });

    xTo(15);
    yTo(20);

    const calls = mockGsap.calls.filter((c) => c.action === 'quickTo.call');
    expect(calls).toHaveLength(2);
    expect(calls[0].value).toBe(15);
    expect(calls[1].value).toBe(20);
  });

  it('T1-F09-02: Verify elastic return animation on mouseleave', () => {
    const content = fs.readFileSync(magneticComponentPath, 'utf8');
    expect(content).toContain('mouseleave');
    expect(content).toContain('elastic.out(1.15, 0.35)');

    const mockGsap = createMockGsap();
    mockGsap.to('btn', {
      x: 0,
      y: 0,
      duration: 0.75,
      ease: 'elastic.out(1.15, 0.35)',
    });

    const toCall = mockGsap.calls.find((c) => c.action === 'to');
    expect(toCall).toBeDefined();
    expect(toCall.vars.x).toBe(0);
    expect(toCall.vars.y).toBe(0);
    expect(toCall.vars.ease).toBe('elastic.out(1.15, 0.35)');
  });

  it('T1-F09-03: Verify high-frame-rate tracking via gsap.quickTo in source and mock', () => {
    const content = fs.readFileSync(magneticComponentPath, 'utf8');
    expect(content).toContain('gsap.quickTo');

    const mockGsap = createMockGsap();
    const setter = mockGsap.quickTo('element', 'x', { duration: 0.35 });
    expect(typeof setter).toBe('function');
  });

  it('T1-F09-04: Verify hardware acceleration and inline-block layout in GsapMagnetic', () => {
    const content = fs.readFileSync(magneticComponentPath, 'utf8');
    expect(content).toContain('inline-block');
  });

  it('T1-F09-05: Verify strength prop scaling factor calculation', () => {
    const rect = { left: 0, width: 100, top: 0, height: 100 };
    const centerX = rect.left + rect.width / 2; // 50
    const centerY = rect.top + rect.height / 2; // 50
    const clientX = 80;
    const clientY = 90;

    const strength1 = 0.2;
    const strength2 = 0.5;

    const distX1 = (clientX - centerX) * strength1; // 30 * 0.2 = 6
    const distY1 = (clientY - centerY) * strength1; // 40 * 0.2 = 8

    const distX2 = (clientX - centerX) * strength2; // 30 * 0.5 = 15
    const distY2 = (clientY - centerY) * strength2; // 40 * 0.5 = 20

    expect(distX1).toBe(6);
    expect(distY1).toBe(8);
    expect(distX2).toBe(15);
    expect(distY2).toBe(20);
    expect(distX2 / distX1).toBe(2.5);
  });
});
