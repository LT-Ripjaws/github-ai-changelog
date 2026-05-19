export const CATEGORIES = ['breaking', 'feature', 'fix', 'chore', 'docs', 'refactor'] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  breaking: "bg-cat-breaking/15 text-cat-breaking border-cat-breaking/30",
  feature: "bg-cat-feature/15 text-cat-feature border-cat-feature/30",
  fix: "bg-cat-fix/15 text-cat-fix border-cat-fix/30",
  chore: "bg-cat-chore/15 text-cat-chore border-cat-chore/30",
  docs: "bg-cat-docs/15 text-cat-docs border-cat-docs/30",
  refactor: "bg-cat-refactor/15 text-cat-refactor border-cat-refactor/30",
};
