export const CATEGORIES = ['breaking', 'feature', 'fix', 'chore', 'docs', 'refactor'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  breaking: "bg-red-500/15 text-red-400 border-red-500/30",
  feature: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  fix: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  chore: "bg-slate-500/15 text-slate-400 border-slate-500/30",
  docs: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  refactor: "bg-purple-500/15 text-purple-400 border-purple-500/30",
};
