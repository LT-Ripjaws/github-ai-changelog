"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SemanticSearchBarProps {
  value?: string;
  loading: boolean;
  onQueryChange?: (query: string) => void;
  onSearch: (query: string) => Promise<void>;
}

export default function SemanticSearchBar({
  value,
  loading,
  onQueryChange,
  onSearch,
}: SemanticSearchBarProps) {
  const [localQuery, setLocalQuery] = useState("");
  const query = value ?? localQuery;

  const setQuery = (next: string) => {
    if (onQueryChange) onQueryChange(next);
    else setLocalQuery(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    void onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full min-w-0 flex-col gap-2 sm:flex-row xl:flex-1" role="search">
      <div className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search commits with natural language…"
          aria-label="Search commits with natural language"
          autoComplete="off"
          className="input-linear pl-10"
        />
      </div>
      <Button
        type="submit"
        disabled={loading || !query.trim()}
        className="btn-linear-primary w-full sm:w-auto"
        aria-label={loading ? "Searching commits" : "Search commits"}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : "Search"}
      </Button>
    </form>
  );
}
