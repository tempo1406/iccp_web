'use client';
// highlight.js dark theme — scoped to our code blocks via .hljs class
import 'highlight.js/styles/github-dark.min.css';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Components } from 'react-markdown';

// ── Language label map (show friendly names) ──────────────────────────────

const LANG_LABELS: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  py: 'Python',
  python: 'Python',
  json: 'JSON',
  bash: 'Bash',
  sh: 'Shell',
  zsh: 'Zsh',
  sql: 'SQL',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  yaml: 'YAML',
  yml: 'YAML',
  md: 'Markdown',
  go: 'Go',
  rs: 'Rust',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  cs: 'C#',
  php: 'PHP',
  rb: 'Ruby',
  swift: 'Swift',
  kt: 'Kotlin',
  dart: 'Dart',
};

function langLabel(raw: string) {
  return LANG_LABELS[raw.toLowerCase()] ?? raw.toUpperCase();
}

// ── Code block (fenced) ────────────────────────────────────────────────────

function CodeBlock({
  lang,
  className,
  children,
  copyLabel,
  copiedLabel,
  codeLabel,
}: {
  lang: string;
  className?: string;
  children: React.ReactNode;
  copyLabel: string;
  copiedLabel: string;
  codeLabel: string;
}) {
  const codeRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = codeRef.current?.textContent ?? '';
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <div className="not-prose my-4 overflow-hidden rounded-xl bg-[#0d1117] ring-1 ring-white/10">
      {/* Header bar */}
      <div className="flex items-center justify-between bg-white/4 px-4 py-2.5">
        <span className="font-mono text-[11px] font-semibold tracking-wide text-zinc-400">
          {lang ? langLabel(lang) : codeLabel}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-zinc-400 transition-all hover:bg-white/10 hover:text-zinc-200 active:scale-95"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>

      {/* Code content */}
      <pre className="m-0 overflow-x-auto p-5 text-[13px] leading-[1.7]">
        <code ref={codeRef} className={className}>
          {children}
        </code>
      </pre>
    </div>
  );
}

// ── Markdown component map ─────────────────────────────────────────────────

function getComponents(
  copyLabel: string,
  copiedLabel: string,
  codeLabel: string,
): Components {
  return {
    // Code — block and inline
    code({ className, children, ...props }) {
      // language-* class is added by remark-gfm for fenced blocks
      // rehype-highlight also adds "hljs" — strip it to get clean lang name
      const langClass = (className ?? '')
        .split(/\s+/)
        .find((c) => c.startsWith('language-'));
      const lang = langClass?.replace('language-', '') ?? '';

      if (langClass) {
        return (
          <CodeBlock
            lang={lang}
            className={cn(langClass, 'hljs')}
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            codeLabel={codeLabel}
          >
            {children}
          </CodeBlock>
        );
      }

      // Multi-line without a declared language (rare but happens)
      if (typeof children === 'string' && children.includes('\n')) {
        return (
          <CodeBlock
            lang=""
            copyLabel={copyLabel}
            copiedLabel={copiedLabel}
            codeLabel={codeLabel}
          >
            {children}
          </CodeBlock>
        );
      }

      // Inline code
      return (
        <code
          className="rounded-md bg-zinc-100 px-1.25 py-0.5 font-mono text-[0.8em] text-rose-600 dark:bg-zinc-800 dark:text-rose-400"
          {...props}
        >
          {children}
        </code>
      );
    },

    // Swallow <pre> — CodeBlock already wraps it
    pre({ children }) {
      return <>{children}</>;
    },

    // Headings
    h1({ children }) {
      return <h1 className="mt-5 mb-3 text-xl font-bold">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="mt-4 mb-2 text-lg font-semibold">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="mt-3 mb-1.5 text-base font-semibold">{children}</h3>;
    },

    // Paragraph
    p({ children }) {
      return <p className="my-1.5 leading-relaxed">{children}</p>;
    },

    // Lists
    ul({ children }) {
      return <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>;
    },
    li({ children }) {
      return <li className="leading-relaxed">{children}</li>;
    },

    // Blockquote
    blockquote({ children }) {
      return (
        <blockquote className="border-primary/50 bg-primary/5 text-muted-foreground my-3 rounded-r-lg border-l-[3px] py-1 pr-3 pl-4">
          {children}
        </blockquote>
      );
    },

    // Horizontal rule
    hr() {
      return <hr className="border-border my-4" />;
    },

    // Tables
    table({ children }) {
      return (
        <div className="not-prose my-3 overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return <thead className="bg-muted/60">{children}</thead>;
    },
    th({ children }) {
      return (
        <th className="text-muted-foreground border-b px-4 py-2.5 text-left text-xs font-semibold tracking-wider uppercase">
          {children}
        </th>
      );
    },
    td({ children }) {
      return <td className="border-b px-4 py-2.5 text-sm last:border-b-0">{children}</td>;
    },

    // Strong & em
    strong({ children }) {
      return <strong className="font-semibold">{children}</strong>;
    },
    em({ children }) {
      return <em className="italic">{children}</em>;
    },

    // Links
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary font-medium underline underline-offset-2 hover:opacity-75"
        >
          {children}
        </a>
      );
    },
  };
}

// ── Main export ────────────────────────────────────────────────────────────

interface MarkdownContentProps {
  content: string;
  className?: string;
  /** Skip rehype-highlight while streaming to avoid per-token rehype overhead */
  isStreaming?: boolean;
}

export function MarkdownContent({
  content,
  className,
  isStreaming,
}: MarkdownContentProps) {
  const t = useTranslations('chatbot');
  const rehypePlugins = isStreaming
    ? [rehypeRaw, rehypeSanitize]
    : [rehypeRaw, rehypeSanitize, rehypeHighlight];

  const components = getComponents(
    t('markdown.copy'),
    t('markdown.copied'),
    t('markdown.code'),
  );

  return (
    <div className={cn('text-sm leading-relaxed', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={rehypePlugins}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
