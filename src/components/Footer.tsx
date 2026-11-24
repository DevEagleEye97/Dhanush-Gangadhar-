"use client";

import { portfolioConfig } from "@/config/portfolio";
import { ArrowUpRight, ArrowUp } from "lucide-react";
import { CurrentYear } from "@/components/CurrentYear";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer id="contact" className="w-full border-t border-neutral-200/90 dark:border-neutral-800/90 bg-[#f7f7f9] dark:bg-[#0c0d12] mt-24 py-16 sm:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
        
        {/* Massive Call to Action (nitin.design signature footer) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-12 border-b border-neutral-200 dark:border-neutral-800">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.08]">
              Got something interesting?
            </h2>
            <p className="text-base text-neutral-600 dark:text-neutral-400 font-normal">
              Whether it&apos;s an ethical security challenge, low-level systems collaboration, or building the next venture together.
            </p>
          </div>

          <div>
            <a
              href={portfolioConfig.email ? `mailto:${portfolioConfig.email}` : (portfolioConfig.linkedinUrl || "#")}
              className="inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 rounded-full border-2 border-neutral-900 dark:border-white bg-white dark:bg-black text-neutral-900 dark:text-white text-xl sm:text-2xl font-bold tracking-tight hover:bg-neutral-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] active:translate-x-[2px] active:translate-y-[2px]"
            >
              <span>Connect</span>
              <ArrowUpRight className="w-6 h-6" />
            </a>
          </div>
        </div>

        {/* Bottom Metadata & Social Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 text-xs font-mono text-neutral-600 dark:text-neutral-400">
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-semibold text-neutral-900 dark:text-white">
              {portfolioConfig.displayName}
            </span>

            {portfolioConfig.githubUrl && (
              <a
                href={portfolioConfig.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>GitHub</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}

            {portfolioConfig.linkedinUrl && (
              <a
                href={portfolioConfig.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>LinkedIn</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}

            {portfolioConfig.twitterUrl && (
              <a
                href={portfolioConfig.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Twitter / X</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}

            {portfolioConfig.telegramUrl && (
              <a
                href={portfolioConfig.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Telegram</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="flex items-center gap-4">
            <p>© <CurrentYear /> {portfolioConfig.displayName}. All rights reserved.</p>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-full border border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-white transition-colors"
              title="Scroll to top"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
