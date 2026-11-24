<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Developer & AI Agent Guidelines

Welcome to the **Dhanush Gangadhar (BOND)** personal portfolio and digital engineering headquarters repository. This document outlines project architecture, animation pipelines, 3D WebGL workflows, and operational rules for AI agents and human contributors.

---

## 1. Stack & Core Technologies

* **Framework**: Next.js 16 (App Router with Turbopack, React 19)
* **Styling**: Tailwind CSS v4 (`@import "tailwindcss"`)
* **Smooth Scrolling**: Lenis (`lenis` ^1.3.27, darkroom.engineering)
* **Animation Engine**: GreenSock Animation Platform (`gsap` ^3.15.1, `ScrollTrigger`)
* **Icons**: `lucide-react`
* **Theme Support**: `next-themes` (Dark & Light modes)
* **Design Intelligence**: UI/UX Pro Max Skill (`.agents/skills/ui-ux-pro-max`)

---

## 2. Animation & UI Architecture

### A. Lenis Smooth Scroll (`src/components/SmoothScroll.tsx`)
* Wraps the application inside `RootLayout` (`src/app/layout.tsx`).
* Easing curve: `t => Math.min(1, 1.001 - Math.pow(2, -10 * t))` with exponential decay.
* Global exposure: `window.lenis` is populated for external controls or debugging.
* In-page anchor navigation: Intercepts all `a[href^="#"]` clicks to scroll smoothly with Lenis.
* **Important**: In `globals.css`, `html.lenis, html.lenis body` must maintain `scroll-behavior: auto !important` so CSS native smooth scroll does not fight Lenis virtual interpolation.

### B. GSAP Integration (`gsap`, `ScrollTrigger`)
* **Lenis + ScrollTrigger Bridge**:
  ```ts
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  ```
  Lenis's RAF is driven exclusively through GSAP's ticker to guarantee 100% synchronized scroll-triggered animations.
* **Magnetic Cursor Attraction (`src/components/GsapMagnetic.tsx`)**:
  Reusable component utilizing `gsap.quickTo` for 60/120fps cursor tracking with elastic snapping (`elastic.out(1.15, 0.35)`). Applied to CTAs and floating buttons.
* **Scroll-Triggered Reveals (`src/components/GsapReveal.tsx`)**:
  Handles staggered reveals for project grids and curriculum timelines with automatic `ctx.revert()` cleanup on unmount.
* **Hero Cinematic Entrance (`src/components/Hero.tsx`)**:
  Staged GSAP timeline with `power3.out` easing animating greeting badges, headline copy, and engineering cards on initial mount.

### C. UI/UX Pro Max Design Guidelines (`.agents/skills/ui-ux-pro-max`)
* Searchable design system database accessible via `python .agents/skills/ui-ux-pro-max/scripts/search.py`.
* **Accessibility**: Minimum 4.5:1 text contrast, explicit keyboard focus rings, aria labels on icon buttons.
* **Typography**: Base 16px body, clean line-heights, semantic color tokens.
* **Anti-patterns**: Avoid heavy intrusive canvas loops, emojis as icons, or unverified color palettes.

---

## 3. Directory Layout

```
portfolio/
├── AGENTS.md                  # This file (AI agent & contributor guidelines)
├── README.md                  # Public project documentation
├── package.json               # Dependencies & scripts
├── public/                    # Static assets & photography
│   └── images/                # Hero nature and background assets
├── .agents/
│   └── skills/
│       └── ui-ux-pro-max/     # UI/UX design intelligence skill & search engine
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx         # Root layout with SmoothScroll, ThemeProvider
│   │   ├── page.tsx           # Home page orchestrator
│   │   ├── globals.css        # Tailwind 4 theme, CSS variables, Lenis rules
│   │   ├── cybersecurity/     # 7-Week Cybersecurity Hub & interactive tracker
│   │   ├── projects/          # Projects index & [slug] case studies
│   │   ├── learning/          # Engineering curriculum & progress log
│   │   └── notes/             # Technical write-ups & articles
│   ├── components/            # UI and animation components
│   │   ├── GsapMagnetic.tsx   # GSAP magnetic attraction component
│   │   ├── GsapReveal.tsx     # GSAP ScrollTrigger batch cascade component
│   │   ├── SmoothScroll.tsx   # Lenis smooth scroll provider + GSAP bridge
│   │   ├── FloatingJourneyDock.tsx # 60-second interactive modal dock
│   │   └── PromptStudio.tsx   # Interactive AI prompt playground
│   ├── config/                # Personal config, external URLs, GitHub config
│   │   └── portfolio.ts       # Central source of truth for personal data
│   ├── data/                  # Static data for projects, notes, learning, roadmap
│   └── types/                 # TypeScript interfaces
```

---

## 4. Operational Rules for AI Agents

1. **Keep Next.js Agent Rules Block Intact**: Never delete or modify the `<!-- BEGIN:nextjs-agent-rules --> ... <!-- END:nextjs-agent-rules -->` block at the top of this file.
2. **Type Safety & Linting**: Always verify code changes with:
   * `npx tsc --noEmit` (must exit with 0 errors)
   * `npm run lint` (must pass with 0 errors and 0 warnings)
3. **Offline Build Compatibility**: Avoid imports from `next/font/google` that fail offline in isolated build environments; prefer CSS font stacks with fallbacks in `globals.css`.
4. **Truth-in-Reporting**: Never fabricate credentials, employment history, metrics, or revenue. Config values in `src/config/portfolio.ts` are strictly verified.
4. **Offline Build Compatibility**: Avoid imports from `next/font/google` that fail offline in isolated build environments; prefer CSS font stacks with fallbacks in `globals.css`.
5. **Truth-in-Reporting**: Never fabricate credentials, employment history, metrics, or revenue. Config values in `src/config/portfolio.ts` are strictly verified.
