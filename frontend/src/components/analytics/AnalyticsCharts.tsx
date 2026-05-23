"use client";

import dynamic from "next/dynamic";
import { SkeletonChart } from "@/components/ui/skeleton";

// recharts needs the DOM (ResponsiveContainer / ResizeObserver), so these are
// client-only. Declaring `ssr: false` here — inside a Client Component —
// instead of in the server page is the Next.js-recommended pattern and stays
// valid on a Next 15 upgrade.

export const CategoryBarChart = dynamic(
  () => import("@/components/analytics/CategoryBarChart"),
  { ssr: false, loading: () => <SkeletonChart /> },
);

export const CommitsOverTimeChart = dynamic(
  () => import("@/components/analytics/CommitsOverTimeChart"),
  { ssr: false, loading: () => <SkeletonChart /> },
);
