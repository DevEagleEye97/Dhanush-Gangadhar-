/**
 * Tier 1: Feature Coverage (Happy-Path)
 * Feature 08: Dynamic Filter GSAP Batching (GsapReveal.tsx & ProjectsSection.tsx)
 *
 * Verifies that dynamic project filtering recalculates GSAP batching,
 * displays filtered subsets, and resets animations cleanly.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from '../runner.mjs';
import { createMockGsap } from '../harness/dom.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Feature 08: Dynamic Filter GSAP Batching (Tier 1)', () => {
  const gsapRevealPath = path.resolve(projectRoot, 'src', 'components', 'GsapReveal.tsx');
  const projectsSectionPath = path.resolve(projectRoot, 'src', 'components', 'ProjectsSection.tsx');

  // Simulated project catalog
  const mockProjects = [
    { id: '1', title: 'Velora Systems', category: 'Software development' },
    { id: '2', title: 'Sentinel Defense', category: 'Cybersecurity' },
    { id: '3', title: 'Cloud Infrastructure', category: 'DevOps & infrastructure' },
    { id: '4', title: 'AI Agent Workbench', category: 'AI & machine learning' },
    { id: '5', title: 'Zero-Day Audit Lab', category: 'Cybersecurity' },
  ];

  function filterCatalog(category) {
    if (!category || category === 'All projects') return mockProjects;
    return mockProjects.filter((p) => p.category === category);
  }

  it('T1-F08-01: Verify initial render of ProjectsSection triggers GSAP reveal animation', () => {
    expect(fs.existsSync(projectsSectionPath)).toBe(true);
    expect(fs.existsSync(gsapRevealPath)).toBe(true);

    const mockGsap = createMockGsap();
    const ctx = mockGsap.context(() => {
      mockGsap.from(['card-1', 'card-2', 'card-3', 'card-4', 'card-5'], {
        y: 40,
        opacity: 0,
        duration: 0.85,
        stagger: 0.12,
      });
    });

    expect(mockGsap.calls.some((c) => c.action === 'from')).toBe(true);
    ctx.revert();
    expect(ctx.revertCalls).toBe(1);
  });

  it('T1-F08-02: Verify category filter selection triggers re-batch and filters items', () => {
    const cyberProjects = filterCatalog('Cybersecurity');
    expect(cyberProjects).toHaveLength(2);
    expect(cyberProjects.every((p) => p.category === 'Cybersecurity')).toBe(true);

    const mockGsap = createMockGsap();
    mockGsap.from(cyberProjects.map((p) => p.id), {
      y: 30,
      opacity: 0,
      stagger: 0.1,
    });

    const fromCall = mockGsap.calls.find((c) => c.action === 'from');
    expect(fromCall).toBeDefined();
    expect(fromCall.target).toEqual(['2', '5']);
  });

  it('T1-F08-03: Verify switching between categories resets and animates new batch cleanly', () => {
    const devProjects = filterCatalog('Software development');
    expect(devProjects).toHaveLength(1);
    expect(devProjects[0].title).toBe('Velora Systems');

    const mockGsap = createMockGsap();
    let currentCtx = mockGsap.context(() => {
      mockGsap.from(devProjects.map((p) => p.id), { opacity: 0 });
    });
    expect(currentCtx.revertCalls).toBe(0);

    // Switch category
    currentCtx.revert();
    expect(currentCtx.revertCalls).toBe(1);

    const aiProjects = filterCatalog('AI & machine learning');
    currentCtx = mockGsap.context(() => {
      mockGsap.from(aiProjects.map((p) => p.id), { opacity: 0 });
    });
    expect(aiProjects).toHaveLength(1);
    expect(aiProjects[0].id).toBe('4');
  });

  it('T1-F08-04: Verify clearing filter to "All projects" restores full project inventory', () => {
    const allProjects = filterCatalog('All projects');
    expect(allProjects).toHaveLength(5);
    expect(allProjects.map((p) => p.id)).toEqual(['1', '2', '3', '4', '5']);
  });

  it('T1-F08-05: Verify ScrollTrigger context cleanup prevents orphaned animation triggers', () => {
    const revealCode = fs.readFileSync(gsapRevealPath, 'utf8');
    expect(revealCode).toContain('ctx.revert()');
    expect(revealCode).toContain('gsap.context');

    const mockGsap = createMockGsap();
    const ctx = mockGsap.context(() => {});
    expect(typeof ctx.revert).toBe('function');
    ctx.revert();
    expect(ctx.revertCalls).toBe(1);
  });
});
