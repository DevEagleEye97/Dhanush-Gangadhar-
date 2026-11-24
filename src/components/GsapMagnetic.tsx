"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface GsapMagneticProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}

export function GsapMagnetic({ 
  children, 
  strength = 0.35, 
  className = "inline-block",
  ...props 
}: GsapMagneticProps) {
  const magneticRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = magneticRef.current;
    if (!el) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const xTo = gsap.quickTo(el, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.35, ease: "power3.out" });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const distanceX = (e.clientX - centerX) * strength;
      const distanceY = (e.clientY - centerY) * strength;

      xTo(distanceX);
      yTo(distanceY);
    };

    const handleMouseLeave = () => {
      gsap.to(el, {
        x: 0,
        y: 0,
        duration: 0.75,
        ease: "elastic.out(1.15, 0.35)",
        overwrite: "auto",
      });
    };

    el.addEventListener("mousemove", handleMouseMove);
    el.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      el.removeEventListener("mousemove", handleMouseMove);
      el.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(el);
    };
  }, [strength]);

  return (
    <div ref={magneticRef} className={className} {...props}>
      {children}
    </div>
  );
}
