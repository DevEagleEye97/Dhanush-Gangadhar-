"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { portfolioConfig } from "@/config/portfolio";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { TerminalModal } from "@/components/TerminalModal";
import { 
  Command, 
  Terminal, 
  Menu, 
  X,
  ArrowUpRight
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navLinks = [
    { label: "About", href: "/#about", isRoute: false },
    { label: "Projects", href: "/projects", isRoute: true },
    { label: "Cybersecurity", href: "/cybersecurity", isRoute: true },
    { label: "Prompt Studio", href: "/#prompt-studio", isRoute: false },
    { label: "Notes", href: "/notes", isRoute: true },
  ];

  const isLinkActive = (href: string) => {
    if (href.startsWith("/#")) return false;
    return pathname === href;
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 ${
          isScrolled
            ? "bg-[#f5f5f7]/85 dark:bg-[#0d0e12]/85 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-xs"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          {/* Logo / Monogram + Full Name (nitin.design style) */}
          <Link
            href="/"
            className="flex items-center gap-3 group focus-visible:outline-none rounded-full py-1 px-1.5"
            aria-label="Dhanush Gangadhar Home"
          >
            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-mono text-xs font-bold shadow-xs">
              {portfolioConfig.monogram}
            </div>
            <span className="font-medium text-sm sm:text-base tracking-tight text-neutral-900 dark:text-white group-hover:text-emerald-500 transition-colors">
              {portfolioConfig.displayName}
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-1.5 text-sm font-medium"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`px-3.5 py-1.5 rounded-full transition-all text-xs font-mono ${
                    active
                      ? "text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 shadow-xs font-semibold"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Signature Pill Button "Connect ↗" (nitin.design style) */}
            <Link
              href="#contact"
              className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full border border-neutral-900 dark:border-white bg-transparent text-neutral-900 dark:text-white text-xs font-mono font-semibold hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-neutral-900 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-[1px] active:translate-y-[1px]"
            >
              <span>Connect</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            {/* Terminal Trigger */}
            <button
              type="button"
              onClick={() => setTerminalOpen(true)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-900 dark:hover:border-white transition-colors"
              aria-label="Open CLI Terminal"
              title="Interactive Terminal"
            >
              <Terminal className="w-3.5 h-3.5" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden inline-flex items-center justify-center w-8 h-8 rounded-full border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#12141a] px-4 pt-3 pb-6 space-y-2 animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setCommandPaletteOpen(true);
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono"
              >
                <Command className="w-3.5 h-3.5 text-emerald-500" />
                <span>Command (⌘K)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setTerminalOpen(true);
                }}
                className="flex items-center justify-center gap-2 p-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs font-mono"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                <span>CLI Terminal</span>
              </button>
            </div>

            <nav className="flex flex-col gap-1 pt-2" aria-label="Mobile Navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-3.5 py-2.5 rounded-xl text-sm font-mono text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Global Modals */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <TerminalModal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
      />
    </>
  );
}
