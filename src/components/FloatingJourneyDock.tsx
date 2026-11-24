"use client";

import { useState, useEffect } from "react";
import { Play, Pause, X, ChevronRight, ChevronLeft, CheckCircle } from "lucide-react";
import { GsapMagnetic } from "@/components/GsapMagnetic";

interface Milestone {
  year: string;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  skills: string[];
}

const MILESTONES: Milestone[] = [
  {
    year: "Step 01",
    title: "First Principles & Computer Architecture",
    subtitle: "Understanding Hardware, Memory & Logic",
    description: "Refusing to accept abstractions as black boxes. Diving into binary representations, memory pointers, operating system processes, and CPU registers.",
    category: "FOUNDATION",
    skills: ["C Programming", "Linux Internals", "Memory Layout", "Bash Scripting"],
  },
  {
    year: "Step 02",
    title: "Networking & Protocol Dissection",
    subtitle: "How the Internet Actually Works",
    description: "Studying RFC specifications, crafting raw packets with socket APIs, inspecting TCP handshakes, DNS resolution chains, and TLS 1.3 cryptographic handshakes.",
    category: "NETWORKS",
    skills: ["TCP/IP", "Wireshark", "Raw Sockets", "Packet Analysis", "DNS & HTTP/2"],
  },
  {
    year: "Step 03",
    title: "Defensive Cybersecurity & Hardening",
    subtitle: "Protecting Systems from the Ground Up",
    description: "Building self-hosted lab environments to practice ethical vulnerability identification, system hardening, SUID binary auditing, and firewall rule enforcement.",
    category: "SECURITY",
    skills: ["Privilege Escalation Defense", "iptables/ufw", "Threat Modeling", "Auditd", "TryHackMe"],
  },
  {
    year: "Step 04",
    title: "Software Engineering & Ventures",
    subtitle: "Velora & Real-World Software Delivery",
    description: "Translating rigorous engineering fundamentals into high-uptime software tools, web platforms, and digital ventures starting with Velora.",
    category: "VENTURES",
    skills: ["Next.js", "TypeScript", "Python Automation", "System Architecture", "Velora"],
  },
];

export function FloatingJourneyDock() {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play walkthrough timer when isPlaying is active
  useEffect(() => {
    if (!isPlaying || !modalOpen) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < MILESTONES.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return 0;
        }
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [isPlaying, modalOpen]);

  const handleOpen = () => {
    setModalOpen(true);
    setIsPlaying(true);
    setCurrentStep(0);
  };

  const handleClose = () => {
    setModalOpen(false);
    setIsPlaying(false);
  };

  return (
    <>
      {/* Floating Pill Dock (nitin.design signature bottom bar) */}
      <div className="fixed bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-40 select-none animate-in fade-in slide-in-from-bottom-4 duration-500">
        <GsapMagnetic strength={0.35}>
          <button
            onClick={handleOpen}
            className="group flex items-center gap-3.5 px-4 py-2.5 rounded-full bg-[#111216] text-white border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:border-emerald-400/40 hover:shadow-[0_10px_35px_rgba(52,211,153,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer backdrop-blur-md"
            aria-label="Open 60-second interactive journey"
          >
            {/* Avatar / Monogram */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1px] shrink-0">
              <div className="w-full h-full rounded-full bg-[#14171d] flex items-center justify-center text-[11px] font-bold font-mono tracking-tighter text-emerald-400">
                DG
              </div>
            </div>

            {/* Text Labels */}
            <div className="text-left">
              <p className="text-xs font-mono font-semibold tracking-wide text-neutral-100 flex items-center gap-1.5">
                <span>My Journey</span>
                <span className="text-[10px] text-emerald-400">in 60s!</span>
              </p>
            </div>

            {/* Play Icon Pill */}
            <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center shrink-0 group-hover:bg-emerald-400 transition-colors shadow-xs">
              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
            </div>
          </button>
        </GsapMagnetic>
      </div>

      {/* Interactive Walkthrough Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-[#14161d] border border-neutral-800 text-white shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top progress bars */}
            <div className="flex items-center gap-1.5">
              {MILESTONES.map((_, idx) => (
                <div
                  key={idx}
                  className="h-1 flex-1 rounded-full bg-neutral-800 overflow-hidden cursor-pointer"
                  onClick={() => {
                    setCurrentStep(idx);
                    setIsPlaying(false);
                  }}
                >
                  <div
                    className={`h-full transition-all duration-300 ${
                      idx === currentStep
                        ? "bg-emerald-400 w-full"
                        : idx < currentStep
                        ? "bg-white w-full"
                        : "w-0"
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Header with Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {MILESTONES[currentStep].category}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {MILESTONES[currentStep].year}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content Slide */}
            <div className="space-y-4 min-h-[180px]">
              <h3 className="text-2xl font-bold tracking-tight text-white">
                {MILESTONES[currentStep].title}
              </h3>
              <p className="text-sm font-medium text-emerald-400/90 font-mono">
                {MILESTONES[currentStep].subtitle}
              </p>
              <p className="text-neutral-300 text-sm leading-relaxed">
                {MILESTONES[currentStep].description}
              </p>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 pt-2">
                {MILESTONES[currentStep].skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 text-xs rounded-full bg-neutral-800/80 border border-neutral-700/60 text-neutral-300 font-mono"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Controls bottom */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-800">
              <button
                onClick={() => {
                  if (currentStep > 0) setCurrentStep(currentStep - 1);
                  setIsPlaying(false);
                }}
                disabled={currentStep === 0}
                className="px-3 py-1.5 rounded-full text-xs font-mono text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="text-xs font-mono text-neutral-500">
                {currentStep + 1} / {MILESTONES.length}
              </span>

              {currentStep < MILESTONES.length - 1 ? (
                <button
                  onClick={() => {
                    setCurrentStep(currentStep + 1);
                    setIsPlaying(false);
                  }}
                  className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="px-4 py-1.5 rounded-full bg-emerald-500 text-black text-xs font-semibold hover:bg-emerald-400 transition-colors flex items-center gap-1"
                >
                  <span>Explore Work</span>
                  <CheckCircle className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
