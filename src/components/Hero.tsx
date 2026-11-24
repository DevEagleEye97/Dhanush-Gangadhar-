"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { portfolioConfig } from "@/config/portfolio";
import { ArrowUpRight, Sparkles, Terminal, ShieldCheck, Layers } from "lucide-react";
import { GsapMagnetic } from "@/components/GsapMagnetic";

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(heroCardRef.current, {
        scale: 0.97,
        opacity: 0,
        duration: 1.0,
      })
      .from(".hero-greeting", {
        y: -20,
        opacity: 0,
        duration: 0.7,
      }, "-=0.6")
      .from(".hero-headline", {
        y: 35,
        opacity: 0,
        duration: 0.9,
      }, "-=0.5")
      .from(".hero-subcopy", {
        y: 20,
        opacity: 0,
        duration: 0.75,
      }, "-=0.6")
      .from(".hero-bottom", {
        y: 20,
        opacity: 0,
        duration: 0.7,
      }, "-=0.5")
      .from(".hero-pillar", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
      }, "-=0.4");
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative pt-4 pb-12 sm:pt-6 sm:pb-16 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Massive Hero Visual & Engineering Card (nitin.design signature nature & glare hero) */}
        <div
          ref={heroCardRef}
          className="relative rounded-[32px] overflow-hidden border border-neutral-200/60 dark:border-neutral-800/80 min-h-[580px] sm:min-h-[660px] flex flex-col justify-between p-6 sm:p-12 shadow-2xl"
        >
          
          {/* Nature & Lens Glare Photography Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="/images/hero-nature-glare.jpg"
              alt="Lush rolling hills with sunlight flare and landscape photography"
              fill
              priority
              className="object-cover object-center scale-[1.03] transition-transform duration-1000 ease-out"
              sizes="(max-w: 1280px) 100vw, 1280px"
            />
            {/* Cinematic Photography Lens Glare & Sun Flare Overlays */}
            <div 
              className="absolute inset-0 pointer-events-none mix-blend-screen opacity-70"
              style={{
                background: "radial-gradient(ellipse at 85% 20%, rgba(255, 230, 180, 0.45) 0%, rgba(255, 200, 120, 0.25) 30%, transparent 65%)",
              }}
            />
            <div 
              className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-40"
              style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%, rgba(0,0,0,0.5) 100%)",
              }}
            />
            {/* Subtle photographic vignette & text contrast backing */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 pointer-events-none" />
          </div>

          {/* Top greeting bar (nitin.design style) */}
          <div className="hero-greeting relative z-20 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-mono text-white shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Hey! I&apos;m <strong className="font-semibold text-white">{portfolioConfig.displayName}</strong>.</span>
            </div>

            {portfolioConfig.githubUrl && (
              <GsapMagnetic strength={0.25}>
                <a
                  href={portfolioConfig.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-xs font-mono text-white/90 hover:text-white hover:bg-black/60 hover:border-white/40 transition-all shadow-lg cursor-pointer"
                >
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>GitHub Profile ↗</span>
                </a>
              </GsapMagnetic>
            )}
          </div>

          {/* Main Hero Statement (nitin.design two-tone bold typography over nature) */}
          <div className="relative z-20 max-w-4xl space-y-4 my-auto pt-8 sm:pt-14 pb-10 sm:pb-14 drop-shadow-md">
            <h1 className="hero-headline text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.08]">
              Learning how systems work.{" "}
              <span className="text-white/70 font-normal">
                Building resilient software from 0→1 across
              </span>{" "}
              Cybersecurity, Networks, and AI.
            </h1>

            <p className="hero-subcopy text-base sm:text-lg text-white/85 max-w-2xl font-normal leading-relaxed drop-shadow-xs">
              Computer Science Engineering student dedicated to defensive security labs, Linux kernel internals, packet analysis, and scaling digital ventures.
            </p>
          </div>

          {/* Bottom Action Strip (nitin.design signature Schedule button and focus pill items) */}
          <div className="hero-bottom relative z-20 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-white/15">
            {/* Focus areas line */}
            <div className="text-xs font-mono text-white/80 flex flex-wrap items-center gap-2 drop-shadow-xs">
              <span className="text-white font-semibold">Primary Focus:</span>
              <span>CSE Student</span>
              <span>▪</span>
              <span>Ethical Security Labs</span>
              <span>▪</span>
              <span>Building Velora</span>
              <span>▪</span>
              <span>50+ Tools & Labs</span>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3">
              <GsapMagnetic strength={0.3}>
                <Link
                  href="#contact"
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-neutral-900 font-bold text-sm hover:bg-neutral-100 transition-all shadow-[0_8px_20px_rgba(0,0,0,0.3)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                >
                  <span>Schedule a call</span>
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </Link>
              </GsapMagnetic>

              <GsapMagnetic strength={0.3}>
                <Link
                  href="#prompt-studio"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-black/50 text-white font-medium text-xs backdrop-blur-md border border-white/25 hover:border-white/50 hover:bg-black/70 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Prompt Agent ↓</span>
                </Link>
              </GsapMagnetic>
            </div>
          </div>
        </div>

        {/* 3 Core Engineering Pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="hero-pillar h-full">
            <div className="p-6 rounded-3xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#12141a] space-y-2.5 hover:border-emerald-500/50 dark:hover:border-emerald-500/40 transition-all shadow-xs h-full">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span className="font-semibold uppercase tracking-wider">Defensive Security</span>
              </div>
              <p className="text-base font-bold text-neutral-900 dark:text-white">
                Hands-On Ethical Labs
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Dissecting packet headers, Wireshark traces, and Linux privilege models in isolated, authorized environments.
              </p>
            </div>
          </div>

          <div className="hero-pillar h-full">
            <div className="p-6 rounded-3xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#12141a] space-y-2.5 hover:border-cyan-500/50 dark:hover:border-cyan-500/40 transition-all shadow-xs h-full">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-mono text-xs">
                <Terminal className="w-4 h-4" />
                <span className="font-semibold uppercase tracking-wider">Systems Architecture</span>
              </div>
              <p className="text-base font-bold text-neutral-900 dark:text-white">
                First Principles Engineering
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Studying low-level kernel abstractions, sockets, and RFC protocol specs before relying on high-level libraries.
              </p>
            </div>
          </div>

          <div className="hero-pillar h-full">
            <div className="p-6 rounded-3xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#12141a] space-y-2.5 hover:border-purple-500/50 dark:hover:border-purple-500/40 transition-all shadow-xs h-full">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-mono text-xs">
                <Layers className="w-4 h-4" />
                <span className="font-semibold uppercase tracking-wider">Ventures & Velora</span>
              </div>
              <p className="text-base font-bold text-neutral-900 dark:text-white">
                Software Tool Delivery
              </p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Converting deep systems understanding into reliable digital automation products and developer tools.
              </p>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
