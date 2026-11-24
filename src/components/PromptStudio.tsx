"use client";

import { useState, useRef } from "react";
import { Sparkles, ArrowRight, CornerDownLeft, Copy, Check } from "lucide-react";

interface PromptPreset {
  id: string;
  category: "Philosophy" | "Security" | "Systems" | "Ventures";
  label: string;
  query: string;
  response: {
    title: string;
    badge: string;
    summary: string;
    details: string[];
    codeBlock?: string;
    actionLink?: { label: string; href: string };
  };
}

const PRESET_PROMPTS: PromptPreset[] = [
  {
    id: "security-labs",
    category: "Security",
    label: "Cybersecurity & Defensive Labs",
    query: "Analyze Dhanush's cybersecurity research methodology and ethical lab environment",
    response: {
      title: "Defensive Security & Low-Level Labs",
      badge: "ETHICAL LAB ARCHITECTURE",
      summary: "Dhanush approaches cybersecurity from first principles—studying RFC protocol specifications, raw packet headers, and Linux kernel namespaces before touching high-level vulnerability scanners.",
      details: [
        "Rigorous hands-on labs hosted in isolated virtualized environments (TryHackMe, custom Proxmox/VirtualBox testbeds).",
        "Deep focus on TCP/IP protocol analysis, Wireshark packet dissection, and understanding TCP handshake flags (SYN, ACK, RST, FIN).",
        "Linux privileges & hardening: Understanding SUID/SGID bit risks, capability drops, and file system permissions.",
        "Zero black-box testing: Everything is built to verify understanding and defend systems responsibly."
      ],
      codeBlock: `# Sample Packet Inspection Workflow
$ tcpdump -nnvv -i eth0 'tcp[tcpflags] & (tcp-syn|tcp-ack) != 0'
$ ss -tulpn | grep ':443'
$ auditctl -w /etc/shadow -p wa -k shadow_access`,
      actionLink: { label: "Explore Full Cybersecurity Roadmap", href: "/cybersecurity" },
    },
  },
  {
    id: "systems-internals",
    category: "Systems",
    label: "Linux Internals & First Principles",
    query: "Explain Dhanush's philosophy on 'First Principles Over Abstractions'",
    response: {
      title: "First Principles Engineering",
      badge: "CORE PHILOSOPHY",
      summary: "Passive reading creates the illusion of competence. Real understanding is proved by dissecting system calls, socket buffers, and breaking edge cases.",
      details: [
        "Prefers understanding memory layout, file descriptors, and CPU context switching over relying solely on heavy frameworks.",
        "Writes low-level CLI utilities in Python, C, and Rust to inspect sockets and processes directly.",
        "Champions radical transparency: zero fabricated credentials or inflated follower numbers. Continuous honest engineering iteration."
      ],
      codeBlock: `/* C Socket Demonstration - Low-level stream socket */
int server_fd = socket(AF_INET, SOCK_STREAM, 0);
struct sockaddr_in address = {
    .sin_family = AF_INET,
    .sin_addr.s_addr = INADDR_ANY,
    .sin_port = htons(8080)
};
bind(server_fd, (struct sockaddr*)&address, sizeof(address));`,
      actionLink: { label: "Read Engineering Notes", href: "/notes" },
    },
  },
  {
    id: "ventures-velora",
    category: "Ventures",
    label: "Ventures: Velora & Scaling",
    query: "What is Velora and how does Dhanush plan to scale software ventures?",
    response: {
      title: "Velora Digital & Technology Entrepreneurship",
      badge: "VENTURE INITIATIVE",
      summary: "Velora represents the convergence of resilient technical engineering and digital market execution.",
      details: [
        "Focus on building high-uptime web tools, automation pipelines, and modern digital platforms.",
        "Bridging systems architecture with intuitive user design—delivering outcome-driven software with zero bloat.",
        "Active exploration of micro-SaaS, developer tooling, and automated infrastructure management."
      ],
      actionLink: { label: "View Ventures Section", href: "#ventures" },
    },
  },
  {
    id: "tech-stack",
    category: "Philosophy",
    label: "Developer & Security Tech Stack",
    query: "What programming languages, environments, and tools are in his primary toolkit?",
    response: {
      title: "Verified Technical Stack",
      badge: "TOOLS & ENVIRONMENT",
      summary: "A multidisciplinary toolkit balanced between low-level system diagnostic tools and modern rapid software delivery frameworks.",
      details: [
        "Languages: Python, TypeScript, JavaScript, C, Bash / Shell scripting.",
        "Networking & Security: Wireshark, Nmap, Burp Suite, OpenSSL, Netcat, iptables, ufw.",
        "Systems & Cloud: Linux (Debian, Arch, Ubuntu Server), Docker, Git, Next.js, Tailwind CSS.",
        "Databases & Protocols: PostgreSQL, SQLite, TCP/IP, DNS, HTTP/2, SSH, TLS 1.3."
      ],
      actionLink: { label: "View All Projects", href: "/projects" },
    },
  },
];

export function PromptStudio() {
  const [selectedPreset, setSelectedPreset] = useState<PromptPreset>(PRESET_PROMPTS[0]);
  const [customInput, setCustomInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<Array<{ query: string; response: PromptPreset["response"] }>>([
    { query: PRESET_PROMPTS[0].query, response: PRESET_PROMPTS[0].response },
  ]);
  const consoleBottomRef = useRef<HTMLDivElement>(null);

  const activeItem = history[history.length - 1] || {
    query: PRESET_PROMPTS[0].query,
    response: PRESET_PROMPTS[0].response,
  };

  const handleSelectPreset = (preset: PromptPreset) => {
    setSelectedPreset(preset);
    setCustomInput("");
    setIsTyping(true);
    setTimeout(() => {
      setHistory((prev) => [...prev, { query: preset.query, response: preset.response }]);
      setIsTyping(false);
    }, 300);
  };

  const handleExecuteCustomPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const trimmed = customInput.trim();
    setIsTyping(true);

    // Smart contextual prompt matcher
    let matchedResponse: PromptPreset["response"];
    const lower = trimmed.toLowerCase();

    if (lower.includes("security") || lower.includes("hack") || lower.includes("cyber") || lower.includes("packet") || lower.includes("firewall")) {
      matchedResponse = PRESET_PROMPTS[0].response;
    } else if (lower.includes("linux") || lower.includes("kernel") || lower.includes("first principle") || lower.includes("c ") || lower.includes("system")) {
      matchedResponse = PRESET_PROMPTS[1].response;
    } else if (lower.includes("velora") || lower.includes("venture") || lower.includes("business") || lower.includes("startup")) {
      matchedResponse = PRESET_PROMPTS[2].response;
    } else {
      matchedResponse = {
        title: `Response to: "${trimmed}"`,
        badge: "AGENT QUERY EXECUTED",
        summary: `Dhanush Gangadhar is focused on computer science engineering, network architecture, and defensive cybersecurity labs. He combines low-level understanding with modern web architectures.`,
        details: [
          `Query processed: "${trimmed}"`,
          "Always learning from primary RFC specifications, hands-on packet dissections, and resilient system design.",
          "Check out his GitHub repositories, cybersecurity roadmap, or schedule a conversation directly."
        ],
        actionLink: { label: "Schedule a chat with Dhanush", href: "#contact" }
      };
    }

    setTimeout(() => {
      setHistory((prev) => [...prev, { query: trimmed, response: matchedResponse }]);
      setIsTyping(false);
      setCustomInput("");
    }, 450);
  };

  const handleCopy = () => {
    const textToCopy = `${activeItem.response.title}\n\n${activeItem.response.summary}\n\n${activeItem.response.details.join("\n")}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="prompt-studio" className="w-full py-16 sm:py-24 border-b border-neutral-200/80 dark:border-neutral-800/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header (nitin.design style) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800/80 text-[11px] font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-300">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>Interactive AI & System Prompts</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Prompt Dhanush&apos;s Engineering Agent
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 max-w-xl">
              Select an inquiry or write your own custom prompt below to inspect his methodology, cybersecurity labs, and architectural thinking in real time.
            </p>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs text-neutral-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Prompt Engine Online</span>
          </div>
        </div>

        {/* Preset Prompt Pills */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mr-1 hidden sm:inline">
            Curated Prompts:
          </span>
          {PRESET_PROMPTS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-full transition-all border ${
                selectedPreset.id === preset.id
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white shadow-sm"
                  : "bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-600"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Console / Prompt Execution Container */}
        <div className="rounded-3xl border border-neutral-200/90 dark:border-neutral-800/90 bg-white dark:bg-[#12141a] shadow-lg overflow-hidden transition-all">
          {/* Top terminal bar */}
          <div className="px-5 py-3.5 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/80 dark:bg-neutral-900/60 backdrop-blur-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-400/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-400/80 inline-block" />
              <span className="ml-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                agent@dhanush:~/prompts
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 text-xs font-mono rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors flex items-center gap-1.5"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Active Query Output Area */}
          <div className="p-6 sm:p-8 space-y-6 min-h-[320px]">
            {/* User Prompt Echo */}
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-mono text-xs shrink-0 mt-0.5">
                PROMPT
              </div>
              <p className="text-base sm:text-lg font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                &ldquo;{activeItem.query}&rdquo;
              </p>
            </div>

            {/* Simulated Response Content */}
            {isTyping ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono animate-pulse">Consulting systems knowledge base...</span>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-300">
                {/* Response Title & Badge */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {activeItem.response.badge}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                    {activeItem.response.title}
                  </h3>
                </div>

                {/* Summary */}
                <p className="text-neutral-700 dark:text-neutral-300 text-base leading-relaxed">
                  {activeItem.response.summary}
                </p>

                {/* Key Bullet Points */}
                <ul className="space-y-2 pt-1">
                  {activeItem.response.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-neutral-600 dark:text-neutral-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-2" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>

                {/* Code Block if available */}
                {activeItem.response.codeBlock && (
                  <div className="mt-4 p-4 rounded-xl bg-neutral-900 dark:bg-black text-neutral-200 font-mono text-xs overflow-x-auto border border-neutral-800">
                    <pre>{activeItem.response.codeBlock}</pre>
                  </div>
                )}

                {/* Action Link Button */}
                {activeItem.response.actionLink && (
                  <div className="pt-3">
                    <a
                      href={activeItem.response.actionLink.href}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
                    >
                      <span>{activeItem.response.actionLink.label}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>
            )}
            <div ref={consoleBottomRef} />
          </div>

          {/* Prompt Input Form Bar (Type your own prompt!) */}
          <form
            onSubmit={handleExecuteCustomPrompt}
            className="p-4 sm:p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Ask or prompt anything (e.g. 'How do you learn cybersecurity?', 'Explain your projects', 'What is Velora?')..."
                className="w-full px-4 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white pr-10 transition-all font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={!customInput.trim() || isTyping}
              className="px-5 py-3 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-medium text-xs flex items-center gap-2 hover:opacity-90 disabled:opacity-40 transition-all shrink-0 cursor-pointer shadow-sm"
            >
              <span>Run Prompt</span>
              <CornerDownLeft className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
