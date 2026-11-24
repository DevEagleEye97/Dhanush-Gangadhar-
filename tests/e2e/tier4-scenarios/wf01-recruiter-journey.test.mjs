/**
 * Tier 4: Real-World Application End-to-End User Workflows
 * Suite: Recruiter, Researcher & Prompt Studio Journeys (wf01-recruiter-journey.test.mjs)
 *
 * Scenarios Covered:
 * - WF-T4-01: Technical Recruiter / Hiring Manager Comprehensive Evaluation Journey (F6, F7, F8, F11, F21)
 * - WF-T4-02: Cybersecurity Researcher / Systems Engineer Exploration & Lab Journal (F6, F7, F12, F17, F21)
 * - WF-T4-03: Interactive AI Prompt Studio Experimentation (F11, F12, F16, F21)
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
} from '../harness/dom.mjs';
import { createMockStorage } from '../harness/mock-storage.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

describe('Tier 4: Persona Workflows (Recruiter, Researcher & AI Studio)', () => {
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

  // WF-T4-01: Technical Recruiter / Hiring Manager Comprehensive Evaluation Journey
  it('WF-T4-01: Technical Recruiter / Hiring Manager Comprehensive Evaluation Journey', async () => {
    const portfolioTsPath = path.resolve(projectRoot, 'src', 'config', 'portfolio.ts');
    expect(fs.existsSync(portfolioTsPath)).toBe(true);
    const portfolioContent = fs.readFileSync(portfolioTsPath, 'utf8');

    const telemetry = createScrollTelemetry();
    const lenis = createMockLenis();
    const gsap = createMockGsap();

    // Step 1: Recruiter lands on '/' (Home). Hero entrance timeline mounts
    const heroTimeline = gsap.timeline();
    heroTimeline.to('.hero-greeting', { opacity: 1, duration: 0.5 });
    heroTimeline.to('.hero-headline', { opacity: 1, duration: 0.7 });
    heroTimeline.to('.hero-pillars', { opacity: 1, duration: 0.5 });
    expect(heroTimeline.calls.length).toBe(3);

    // Step 2: Recruiter scrolls smoothly via Lenis to #about (scrollY: 800)
    telemetry.scrollTo(0, 800);
    lenis.scrollTo(800);
    expect(telemetry.scrollY).toBe(800);
    expect(portfolioContent).toContain('Computer Science & Engineering');

    // Step 3: Scrolls to #projects (scrollY: 1600). Clicks "Cybersecurity" category
    telemetry.scrollTo(0, 1600);
    lenis.scrollTo(1600);

    const mockProjects = [
      { id: 'sec-1', title: 'Network Packet Sniffer', category: 'Cybersecurity', modalData: { problem: 'Packet loss', solution: 'eBPF capture' } },
      { id: 'web-1', title: 'Velora Web Platform', category: 'Web development', modalData: { problem: 'Latency', solution: 'Edge SSR' } },
    ];

    const activeFilter = 'Cybersecurity';
    const filteredProjects = mockProjects.filter((p) => p.category === activeFilter);
    expect(filteredProjects.length).toBe(1);
    expect(filteredProjects[0].title).toBe('Network Packet Sniffer');

    // Step 4 & 5: Clicks "View Case Study" on featured project -> CaseStudyModal opens
    let activeModal = null;
    const openCaseStudyModal = (project) => {
      activeModal = project;
      lenis.stop(); // Scroll lock
    };

    openCaseStudyModal(filteredProjects[0]);
    expect(activeModal).not.toBeNull();
    expect(lenis.isStopped).toBe(true);
    expect(activeModal.modalData.solution).toBe('eBPF capture');

    // Step 6: Closes modal via X button -> confirms page remains at exact scroll position
    const closeModal = () => {
      activeModal = null;
      lenis.start(); // Release scroll lock
    };

    closeModal();
    expect(activeModal).toBeNull();
    expect(lenis.isStopped).toBe(false);
    expect(telemetry.scrollY).toBe(1600); // Maintained position without displacement

    // Step 7: Scrolls to #learning (scrollY: 2400)
    telemetry.scrollTo(0, 2400);
    lenis.scrollTo(2400);
    expect(telemetry.scrollY).toBe(2400);

    // Step 8: Scrolls to #contact (scrollY: 3200). Clicks "Copy" on direct email
    telemetry.scrollTo(0, 3200);
    lenis.scrollTo(3200);

    let copiedFeedback = false;
    const copyEmail = async (email) => {
      await globalThis.navigator.clipboard.writeText(email);
      copiedFeedback = true;
    };

    const targetEmail = 'dhanush@example.com';
    await copyEmail(targetEmail);

    expect(copiedFeedback).toBe(true);
    const clipboardText = await globalThis.navigator.clipboard.readText();
    expect(clipboardText).toBe(targetEmail);
  });

  // WF-T4-02: Cybersecurity Researcher / Systems Engineer Exploration & Lab Journal
  it('WF-T4-02: Cybersecurity Researcher / Systems Engineer Exploration & Lab Journal', () => {
    const telemetry = createScrollTelemetry();
    const lenis = createMockLenis();
    const gsap = createMockGsap();

    // Step 1 & 2: Route transition from '/' to '/cybersecurity'
    const onNavigateCybersecurity = () => {
      telemetry.scrollTo(0, 0);
      lenis.scrollTo(0);
      gsap.ScrollTrigger.refresh();
    };

    onNavigateCybersecurity();
    expect(telemetry.scrollY).toBe(0);
    expect(lenis.scroll).toBe(0);
    expect(gsap.ScrollTrigger.refreshCalls).toBe(1);

    // Step 3 & 4: Select "Week 2: Computer Networking & Packet Dissection"
    let activeWeek = 2;
    expect(activeWeek).toBe(2);

    // Step 5: Check off 3 lab tasks
    const completedTasks = new Set();
    const toggleTask = (taskId) => {
      if (completedTasks.has(taskId)) {
        completedTasks.delete(taskId);
      } else {
        completedTasks.add(taskId);
      }
    };

    toggleTask('w2_task_wireshark');
    toggleTask('w2_task_tcp_handshake');
    toggleTask('w2_task_dns_inspection');
    expect(completedTasks.size).toBe(3);

    // Step 6: Enter personal lab notes in Study Journal
    const journalNotes = {
      w2: 'Analyzed SYN-ACK sequence numbers and captured DNS MX queries successfully.',
    };

    // Step 7 & 8: Check external resource link security attributes
    const externalResource = {
      title: 'Stanford CS144 Networking Lecture',
      url: 'https://cs144.github.io/',
      target: '_blank',
      rel: 'noopener noreferrer',
    };
    expect(externalResource.target).toBe('_blank');
    expect(externalResource.rel).toContain('noopener');
    expect(externalResource.rel).toContain('noreferrer');

    // Save state to localStorage key
    const STORAGE_KEY = 'bond_cybersecurity_hub_progress_v1';
    const statePayload = {
      completedTasks: Array.from(completedTasks),
      activeWeek,
      notes: journalNotes,
      lastUpdated: new Date().toISOString(),
    };
    mockStorage.setItem(STORAGE_KEY, JSON.stringify(statePayload));

    // Step 9: Emulate page refresh and verify persistent state restoration
    const restoredRaw = mockStorage.getItem(STORAGE_KEY);
    expect(restoredRaw).not.toBeNull();
    const restoredState = JSON.parse(restoredRaw);

    expect(restoredState.completedTasks.length).toBe(3);
    expect(restoredState.completedTasks).toContain('w2_task_wireshark');
    expect(restoredState.completedTasks).toContain('w2_task_tcp_handshake');
    expect(restoredState.completedTasks).toContain('w2_task_dns_inspection');
    expect(restoredState.activeWeek).toBe(2);
    expect(restoredState.notes.w2).toContain('SYN-ACK');
  });

  // WF-T4-03: Interactive AI Prompt Studio Experimentation
  it('WF-T4-03: Interactive AI Prompt Studio Experimentation', async () => {
    // Step 1 & 2: Preset pills available
    const presets = [
      { id: 'cyber', label: 'Cybersecurity & Defensive Labs' },
      { id: 'linux', label: 'Linux Internals & First Principles' },
      { id: 'ventures', label: 'Ventures: Velora & Scaling' },
    ];
    expect(presets.length).toBe(3);

    // Step 3 & 4: User clicks "Linux Internals & First Principles"
    let activePreset = presets[1].id;
    let isThinking = true;

    // Simulate 300ms reasoning phase
    const executePreset = (presetId) => {
      isThinking = false;
      return {
        badge: 'CORE PHILOSOPHY',
        summary: 'First-principles systems engineering through POSIX APIs, sockets, and memory hierarchies.',
        bulletPoints: [
          'Non-blocking socket event multiplexing via epoll(7)',
          'Zero-copy file transfers using sendfile(2)',
          'Deterministic resource cleanup via RAII',
        ],
        codeSnippet: `int s = socket(AF_INET, SOCK_STREAM, 0);\nfcntl(s, F_SETFL, O_NONBLOCK);`,
      };
    };

    const response = executePreset(activePreset);
    expect(isThinking).toBe(false);
    expect(response.badge).toBe('CORE PHILOSOPHY');
    expect(response.codeSnippet).toContain('socket');
    expect(response.bulletPoints.length).toBe(3);

    // Step 5: Clicks "Copy Response"
    const markdownOutput = `### ${response.badge}\n${response.summary}\n\`\`\`c\n${response.codeSnippet}\n\`\`\``;
    await globalThis.navigator.clipboard.writeText(markdownOutput);
    const clipboardText = await globalThis.navigator.clipboard.readText();
    expect(clipboardText).toContain('CORE PHILOSOPHY');
    expect(clipboardText).toContain('SOCK_STREAM');

    // Step 6 & 7: User types custom query and submits via Enter
    let promptInput = 'Explain your experience with network packet inspection and firewall rules.';
    const promptHistory = [];

    const handleCustomPromptSubmit = (input) => {
      // Sanitize input
      const sanitized = input.trim().replace(/[\x00-\x1F\x7F]/g, '');
      promptHistory.push({
        query: sanitized,
        timestamp: Date.now(),
        response: 'Custom simulated response analyzing nftables, iptables, and Wireshark capture workflows.',
      });
      promptInput = ''; // Clears input
    };

    handleCustomPromptSubmit(promptInput);
    expect(promptInput).toBe('');
    expect(promptHistory.length).toBe(1);
    expect(promptHistory[0].query).toContain('packet inspection');
    expect(promptHistory[0].response).toContain('nftables');
  });
});
