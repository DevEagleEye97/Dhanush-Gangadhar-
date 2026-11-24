"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface GsapRevealProps {
  children: React.ReactNode;
  className?: string;
  y?: number;
  duration?: number;
  stagger?: number;
  delay?: number;
  threshold?: string;
}

export function GsapReveal({
  children,
  className = "",
  y = 40,
  duration = 0.85,
  stagger = 0.12,
  delay = 0,
  threshold = "top 88%",
}: GsapRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const targets = container.children.length > 0 ? Array.from(container.children) : [container];

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y,
        opacity: 0,
        duration,
        stagger,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: container,
          start: threshold,
          toggleActions: "play none none none",
          once: true,
        },
      });
    }, container);

    return () => ctx.revert();
  }, [delay, duration, stagger, threshold, y]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

