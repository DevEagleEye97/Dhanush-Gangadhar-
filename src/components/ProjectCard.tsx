"use client";

import { UnifiedProject } from "@/lib/github";
import { Project } from "@/types/portfolio";
import Link from "next/link";
import { BookOpen, ArrowUpRight, GitFork, Shield, Terminal, Globe, Code } from "lucide-react";
import { GithubIcon } from "@/components/SocialIcons";

interface ProjectCardProps {
  project: UnifiedProject | Project;
  onOpenCaseStudy: (project: UnifiedProject | Project) => void;
}

export function ProjectCard({ project, onOpenCaseStudy }: ProjectCardProps) {
  // Check if it's a UnifiedProject
  const isUnified = "updatedAt" in project;
  const unified = isUnified ? (project as UnifiedProject) : null;
  const standard = !isUnified ? (project as Project) : null;

  const title = project.title;
  const description = standard ? standard.shortDescription : (unified?.description ?? "");
  const category = project.category;
  const status = project.status;
  const githubUrl = project.githubUrl;
  const demoUrl = project.demoUrl;
  const slug = project.slug;

  const technologies = standard
    ? standard.technologies
    : [
        ...(unified?.language ? [unified.language] : []),
        ...(unified?.topics || []).slice(0, 4),
      ];

  const getStatusBadge = (st: string) => {
    switch (st.toLowerCase()) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "active":
      case "in progress":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "experiment":
        return "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20";
      case "fork":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "archived":
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700";
      default:
        return "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700";
    }
  };

  // Select banner icon based on category
  const getCategoryIcon = () => {
    const c = category.toLowerCase();
    if (c.includes("cyber") || c.includes("security")) return <Shield className="w-6 h-6 text-emerald-500" />;
    if (c.includes("linux") || c.includes("software") || c.includes("tool")) return <Terminal className="w-6 h-6 text-cyan-500" />;
    if (c.includes("web") || c.includes("app")) return <Globe className="w-6 h-6 text-purple-500" />;
    return <Code className="w-6 h-6 text-amber-500" />;
  };

  return (
    <article className="group h-full rounded-3xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#12141a] overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300">
      
      {/* Top Graphic Showcase Header (nitin.design styled project preview header) */}
      <div className="relative h-44 sm:h-52 w-full bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-200 dark:from-[#161822] dark:via-[#11131a] dark:to-[#1a1d28] border-b border-neutral-200/80 dark:border-neutral-800/80 p-6 flex flex-col justify-between overflow-hidden">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: `16px 16px`,
          }}
        />

        {/* Top Badges */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-xs border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold shadow-xs">
              {category}
            </span>
            {unified?.isFork && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <GitFork className="w-2.5 h-2.5" />
                <span>Fork</span>
              </span>
            )}
          </div>

          <span className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadge(status)}`}>
            {status}
          </span>
        </div>

        {/* Central Graphic / Icon Anchor */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1a1d26] border border-neutral-200 dark:border-neutral-700 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            {getCategoryIcon()}
          </div>
          <div>
            <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">Engineering Artifact</p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white line-clamp-1">{title}</p>
          </div>
        </div>
      </div>

      {/* Main Card Body */}
      <div className="p-6 sm:p-7 space-y-4 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Project Title */}
          <h3 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white group-hover:text-emerald-500 transition-colors leading-snug">
            <Link href={`/projects/${slug}`}>
              {title}
            </Link>
          </h3>

          {/* Short Description */}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
            {description}
          </p>

          {/* Technologies Pills (nitin.design rounded-full style) */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {technologies.map((tech) => (
              <span
                key={tech}
                className="text-xs font-mono px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/80 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700/60"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-5 mt-4 border-t border-neutral-200/80 dark:border-neutral-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onOpenCaseStudy(project)}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-neutral-900 dark:text-white hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Case Study</span>
          </button>

          <div className="flex items-center gap-2">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-900 dark:hover:border-white transition-colors"
                title="View Source on GitHub"
              >
                <GithubIcon className="w-3.5 h-3.5" />
              </a>
            )}

            {demoUrl && (
              <a
                href={demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-mono font-medium hover:opacity-90 transition-opacity"
              >
                <span>Live</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
