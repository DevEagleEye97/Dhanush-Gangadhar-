import { CaseStudy } from "@/types/portfolio";

export type ProjectFilterCategory =
  | "All projects"
  | "Cybersecurity"
  | "Web development"
  | "Software development"
  | "AI & Automation"
  | "Other experiments";

export interface GitHubRepoOverride {
  /** Custom display title if different from repo name */
  displayName?: string;
  /** Force a specific portfolio category */
  category?: Exclude<ProjectFilterCategory, "All projects">;
  /** Curated description when GitHub repo description is empty */
  customDescription?: string;
  /** Explicit project status */
  status?: "Active" | "Completed" | "Experiment" | "Concept" | "Maintenance";
  /** Feature on top of the list / home page */
  featured?: boolean;
  /** Optional case study notes written by you */
  caseStudy?: Partial<CaseStudy>;
  /** Live demo URL if not specified in GitHub repository homepage */
  demoUrl?: string | null;
}

export interface GitHubProjectsConfig {
  /** Public GitHub username */
  username: string;
  /** Repositories marked as featured */
  featuredRepos: string[];
  /** Repositories to hide from public portfolio display */
  hiddenRepos: string[];
  /** Per-repository overrides for custom categorization or descriptions */
  repoOverrides: Record<string, GitHubRepoOverride>;
}

export const githubProjectsConfig: GitHubProjectsConfig = {
  username: "DevEagleEye97",

  // Repositories prioritized at the top of the portfolio
  featuredRepos: [
    "ForensIQ",
    "Threat-X",
    "teamguard-",
    "Team-Bhairava-",
    "Shvasa-Banking-co",
    "basic-chess-game-",
    "Dhanush-Gangadhar-",
  ],

  // Repositories hidden from portfolio (e.g. initial scratch/test repos or generic forks)
  hiddenRepos: [
    "first-repo",
    "team-guard",
    "github-issues-import",
  ],

  // Manual enrichments — GitHub discovery supplies the base, overrides supply extra context
  repoOverrides: {
    "ForensIQ": {
      displayName: "ForensIQ — Deepfake Detection & Digital Forensics Platform",
      category: "Cybersecurity",
      status: "Active",
      customDescription: "Tactical, zero-trust multimodal deepfake detection platform combining deterministic heuristics with AI diagnostics to ingest, analyze, and cryptographically archive multimedia evidence.",
      featured: true,
      demoUrl: "https://forensiq-teal.vercel.app",
      caseStudy: {
        problem: "The proliferation of synthetic media and deepfakes undermines evidence integrity during digital forensic investigations, judicial proceedings, and identity verification.",
        goal: "Build an industrial-grade, zero-trust digital forensics platform that ingests, analyzes, and cryptographically archives multimedia evidence.",
        approach: "Engineered for SAPTHAHACKS 2026 with Team Bhairava. Combines multi-layered deterministic forensic heuristics with neural diagnostic pipelines and cryptographic audit logging.",
        challenges: [
          "Coordinating high-throughput media ingestion with client-side frame-by-frame forensic analysis",
          "Designing an evidence chain-of-custody interface adhering to zero-trust tactical aesthetics",
        ],
        whatILearned: [
          "Multimodal synthetic artifact detection techniques and frame-level frequency analysis",
          "Structuring tamper-evident evidence manifests and cryptographic audit trails",
        ],
        futureImprovements: [
          "Integrate C2PA (Coalition for Content Provenance and Authenticity) metadata parsing",
          "Add distributed batch analysis workers for high-volume evidence triage",
        ],
      },
    },

    "Threat-X": {
      displayName: "Threat-X — Digital Threat Investigation Tool",
      category: "Cybersecurity",
      status: "Active",
      featured: true,
      demoUrl: "https://threat-x.vercel.app",
      caseStudy: {
        problem: "Triaging threat evidence and investigating security indicators often requires switching across multiple disjointed tools during time-sensitive incidents.",
        goal: "Build an evidence-driven digital threat investigation tool designed to structure threat telemetry into an actionable product.",
        approach: "Built initially as an intensive hackathon prototype, now evolving into a structured cybersecurity investigative tool with streamlined indicator analysis.",
        challenges: [
          "Organizing threat indicator correlations into a clean, responsive interface",
          "Designing evidence ingestion workflows that don't overwhelm security operators",
        ],
        whatILearned: [
          "Translating hackathon architecture into modular, maintainable production components",
          "Structuring threat telemetry data models for rapid evidence verification",
        ],
        futureImprovements: [
          "Integrate automated STIX/TAXII threat intel feeds",
          "Add exportable incident investigation timeline reports",
        ],
      },
    },

    "teamguard-": {
      displayName: "TeamGuard — AI Supply Chain Intelligence",
      category: "AI & Automation",
      status: "Active",
      featured: true,
      demoUrl: "https://teamguard-five.vercel.app",
      customDescription: "AI-powered supply chain intelligence platform designed to evaluate vendor risk, logistical vulnerabilities, and anomaly detection.",
      caseStudy: {
        problem: "Modern supply chains face complex multi-tier vendor vulnerabilities and unpredictable logistical failure points that manual audits fail to catch.",
        goal: "Develop an intelligence dashboard that models operational dependencies, scores vendor risk profiles, and predicts delivery bottlenecks.",
        approach: "Crafted with TypeScript and Next.js, integrating automated risk telemetry and threat modeling algorithms for continuous supply resilience monitoring.",
        challenges: [
          "Modeling multi-node dependency graphs without performance degradation on large vendor networks",
          "Normalizing heterogeneous logistics data into actionable risk metrics",
        ],
        whatILearned: [
          "Supply chain threat vectors and dependency tree risk propagation",
          "Responsive data visualization for complex operational metrics",
        ],
        futureImprovements: [
          "Integrate real-time geopolitical risk intelligence feeds",
          "Add automated incident response playbooks for logistics disruptions",
        ],
      },
    },

    "Team-Bhairava-": {
      displayName: "HackForge — Team Bhairava Academic & Hackathon Desk",
      category: "Web development",
      status: "Active",
      featured: true,
      demoUrl: "https://team-bhairava.vercel.app",
      customDescription: "Digital team desk and academic collaboration platform designed for hackathon tracking, asset management, and project coordination.",
      caseStudy: {
        problem: "Coordinating multi-track engineering projects during high-stakes hackathons leads to lost assets, misaligned milestones, and fragmented communications.",
        goal: "Build a unified collaboration command desk for Team Bhairava to manage project deliverables, milestone tracking, and shared resources in real time.",
        approach: "Built using Next.js 16, TypeScript, Tailwind CSS v4, and Supabase for reactive real-time state synchronization across team members.",
        challenges: [
          "Designing low-latency sync for collaborative task boards and milestone checklists",
          "Maintaining an ultra-responsive dark-mode tactical UI under intense hackathon workflows",
        ],
        whatILearned: [
          "Supabase real-time channel subscriptions and relational schema design",
          "Fast prototyping patterns with Next.js 16 App Router and Tailwind CSS v4",
        ],
        futureImprovements: [
          "Add integrated live code snippet and architecture diagram sharing",
          "Export post-hackathon retrospectives into structured markdown project briefs",
        ],
      },
    },

    "Shvasa-Banking-co": {
      displayName: "Shvasa Banking — Modern Financial Web Platform",
      category: "Web development",
      status: "Active",
      customDescription: "Responsive online banking interface focusing on account management workflows, transaction visualizations, and clean frontend UX.",
      featured: true,
      demoUrl: "https://shvasa-banking-co.vercel.app",
      caseStudy: {
        problem: "Traditional banking dashboards are often cluttered and confusing for modern users managing day-to-day accounts.",
        goal: "Develop an intuitive, performant financial interface with clear transaction histories and responsive controls.",
        approach: "Crafted accessible interface components using modern JavaScript and structured CSS layouts, prioritizing responsive accessibility.",
        challenges: [
          "State management across multi-step transaction and payment flows",
          "Ensuring responsive layout fidelity on mobile screens without horizontal clipping",
        ],
        whatILearned: [
          "Financial UI ergonomics and form validation patterns",
          "DOM state synchronization and modular styling architecture",
        ],
        futureImprovements: [
          "Add simulated two-factor authentication modal",
          "Implement spending categorization charts",
        ],
      },
    },

    "basic-chess-game-": {
      displayName: "Python Chess Game & Move Engine",
      category: "Software development",
      status: "Completed",
      customDescription: "Interactive chess implementation in Python with complete rule verification, board state evaluation, and turn mechanics.",
      featured: true,
      caseStudy: {
        problem: "Chess move validation requires tracking complex non-trivial board state conditions (castling, en passant, check, and checkmate).",
        goal: "Implement a complete, bug-free move validator and gameplay engine in Python from foundational data structures.",
        approach: "Represented the 8x8 board with coordinate matrices and designed piece-specific legal move generation algorithms.",
        challenges: [
          "Accurately detecting discovered checks and pinning states before allowing moves",
          "Handling special pawn promotion and king castling validation cleanly",
        ],
        whatILearned: [
          "Object-oriented state management for complex rule engines",
          "Algorithmic board traversal and performance considerations",
        ],
        futureImprovements: [
          "Implement Minimax engine with Alpha-Beta pruning for AI opponent",
          "Add PGN (Portable Game Notation) export and import support",
        ],
      },
    },

    "shvasaa": {
      displayName: "Shvasa Web Experience",
      category: "Web development",
      status: "Experiment",
      demoUrl: "https://shvasaa.vercel.app",
      customDescription: "Frontend design system and responsive styling experiment exploring modern CSS layouts and typography.",
    },

    "frontend-website-": {
      displayName: "Team Bhairava Web Portal",
      category: "Web development",
      status: "Active",
      customDescription: "Landing portal and engineering showcase for Team Bhairava hackathon initiatives.",
    },

    "Dhanush-Gangadhar-": {
      displayName: "Personal Digital Headquarters & Learning Hub",
      category: "Web development",
      status: "Active",
      customDescription: "Personal portfolio, interactive 7-week cybersecurity curriculum hub, and technical engineering headquarters built with Next.js 16 and GSAP.",
      featured: true,
      demoUrl: "https://dhanush-gangadhar.vercel.app/",
    },

    "Dhanush-Gangadhar": {
      displayName: "Personal Digital Headquarters & Learning Hub",
      category: "Web development",
      status: "Active",
      customDescription: "Personal portfolio, interactive 7-week cybersecurity curriculum hub, and technical engineering headquarters built with Next.js 16 and GSAP.",
      featured: true,
      demoUrl: "https://dhanush-gangadhar.vercel.app/",
    },
  },
};
