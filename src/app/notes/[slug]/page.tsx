import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { notesData } from "@/data/notes";
import { ArrowLeft, Calendar, Clock, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return notesData.map((note) => ({
    slug: note.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = notesData.find((n) => n.slug === slug);
  if (!note) return { title: "Note Not Found" };

  return {
    title: note.title,
    description: note.excerpt,
  };
}

function NoteDetailFallback() {
  return (
    <article className="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <div className="h-4 w-40 rounded bg-bg-secondary animate-pulse" />
        <div className="space-y-4 border-b border-border-main pb-8">
          <div className="h-4 w-64 rounded bg-bg-secondary animate-pulse" />
          <div className="h-10 w-3/4 rounded bg-bg-secondary animate-pulse" />
        </div>
      </div>
    </article>
  );
}

async function NoteDetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const note = notesData.find((n) => n.slug === slug);

  if (!note) {
    notFound();
  }

  return (
    <article className="py-12 sm:py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
        <Link
          href="/notes"
          className="inline-flex items-center gap-2 text-xs font-mono text-text-muted hover:text-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to all notes</span>
        </Link>

        <div className="space-y-4 border-b border-border-main pb-8">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-text-muted">
            <span className="text-accent uppercase tracking-wider font-semibold">
              {note.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {note.date}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {note.readTime}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight leading-tight">
            {note.title}
          </h1>

          <p className="text-base text-text-secondary italic border-l-2 border-accent pl-4">
            {note.excerpt}
          </p>
        </div>

        <div className="prose prose-invert max-w-none space-y-6 text-sm sm:text-base leading-relaxed text-text-secondary">
          {note.content.map((paragraph, idx) => (
            <p key={idx} className="leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="pt-8 mt-12 border-t border-border-main flex items-center justify-between">
          <Link
            href="/notes"
            className="inline-flex items-center gap-2 text-xs font-mono text-text-muted hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Journal Notes</span>
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 text-xs font-mono text-accent hover:underline"
          >
            <span>Explore Related Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function NoteDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<NoteDetailFallback />}>
      <NoteDetailContent params={params} />
    </Suspense>
  );
}
