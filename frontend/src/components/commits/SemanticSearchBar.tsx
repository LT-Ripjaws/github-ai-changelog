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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commits with natural language (e.g. 'auth changes', 'database fixes')..."
            className="pl-10 bg-zinc-900/50 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
          />
        </div>
        <Button type="submit" disabled={loading || !query.trim()} className="bg-violet-600 hover:bg-violet-500">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
        </Button>
      </form>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">{results.length} result{results.length !== 1 ? "s" : ""}</p>
          {results.map((r) => (
            <a
              key={r.id}
              href={`/dashboard/repos/${repoId}/commits/${r.sha}`}
              className="block p-3 rounded-lg border border-zinc-800 bg-zinc-900/30 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <code className="text-xs text-zinc-400 font-mono">{r.sha.slice(0, 7)}</code>
                {r.category && (
                  <Badge variant="outline" className={`text-xs ${CATEGORY_COLORS[r.category] ?? ""}`}>
                    {r.category}
                  </Badge>
                )}
                <span className="text-xs text-zinc-600 ml-auto">
                  {Math.round(r.similarity * 100)}% match
                </span>
              </div>
              <p className="text-sm text-zinc-200 line-clamp-2">
                {r.aiChangelog || r.message}
              </p>
              <div className="flex gap-3 mt-1 text-xs text-zinc-500">
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
