"use client"

import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

// Languages the lessons actually use; anything else renders as plain text.
const SHIKI_LANGS = new Set([
  "rust",
  "bash",
  "toml",
  "sql",
  "json",
  "yaml",
  "dockerfile",
  "ts",
  "tsx",
])

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const language = SHIKI_LANGS.has(lang) ? lang : "text"
    import("shiki")
      .then(({ codeToHtml }) =>
        codeToHtml(code, {
          lang: language,
          themes: { light: "github-light", dark: "github-dark" },
        }),
      )
      .then((out) => {
        if (!cancelled) setHtml(out)
      })
      // Highlighting is progressive enhancement; the plain block below stands in.
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [code, lang])

  return (
    <div
      tabIndex={0}
      aria-label={`Code sample (${lang})`}
      className="my-4 overflow-x-auto rounded-lg border text-sm [&_pre]:p-4"
    >
      {html ? (
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="p-4">
          <code>{code}</code>
        </pre>
      )}
    </div>
  )
}

// Markdown renderer for lesson content and quiz prompts stored in the
// database. Content is authored in this repo (seeded, not user-supplied).
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("text-sm leading-6", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="mt-8 mb-3 text-lg font-semibold">{children}</h2>,
          h2: ({ children }) => <h2 className="mt-8 mb-3 text-lg font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mt-6 mb-2 font-semibold">{children}</h3>,
          p: ({ children }) => <p className="my-3">{children}</p>,
          ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
          blockquote: ({ children }) => (
            <blockquote className="border-border text-muted-foreground my-3 border-l-2 pl-4">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              {children}
            </a>
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || "")
            const text = String(children).replace(/\n$/, "")
            if (match || text.includes("\n")) {
              return <CodeBlock code={text} lang={match?.[1] ?? "text"} />
            }
            return (
              <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">{children}</code>
            )
          },
          table: ({ children }) => (
            <div tabIndex={0} aria-label="Table" className="my-3 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-border border-b px-3 py-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-border border-b px-3 py-2 align-top">{children}</td>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
