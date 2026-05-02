"use client";
import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SearchResult } from "@/lib/types";

const CATEGORY_COLORS: Record<string, string> = {
  breaking: "bg-red-500/15 text-red-400 border-red-500/30",
  feature: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  fix: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  chore: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  docs: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  refactor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};

interface Props {
  repoId: string;
  onSearch: (query: string) => Promise<void>;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
}

export default function SemanticSearchBar({ repoId, onSearch, results, loading, error }: Props) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commits with natural language (e.g. 'auth changes'…"
            aria-label="Search commits"
            autoComplete="off"
            className="input-linear pl-10"
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !query.trim()}
          className="btn-linear-primary"
          aria-label={loading ? "Searching…" : "Search commits"}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Search"}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-destructive" role="alert">{error}</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2" aria-live="polite">
          <p className="text-xs text-text-tertiary">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.map((r) => (
            <a
              key={r.id}
              href={`/dashboard/repos/${repoId}/commits/${r.sha}`}
              className="block p-3 rounded-md card-linear hover:border-brand-indigo/20 transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <code className="text-xs text-text-tertiary font-mono bg-surface-2 px-1.5 py-0.5 rounded">{r.sha.slice(0, 7)}</code>
                {r.category && (
                  <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[r.category] ?? ""}`}>
                    {r.category}
                  </Badge>
                )}
                <span className="text-xs text-text-tertiary ml-auto tabular-nums">
                  {Math.round(r.similarity * 100)}% match
                </span>
              </div>
              <p className="text-sm text-text-primary line-clamp-2">
                {r.aiChangelog || r.message}
              </p>
              <div className="flex gap-3 mt-1 text-xs text-text-tertiary tabular-nums">
                <span>+{r.additions} -{r.deletions}</span>
                <span>{r.filesChanged} files</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
