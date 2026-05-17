"use client";

import { memo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CATEGORY_ORDER = ["breaking", "feature", "fix", "docs", "refactor", "chore"];

const COLORS: Record<string, string> = {
  breaking: "#ef4444",
  feature: "#10b981",
  fix: "#f59e0b",
  chore: "#64748b",
  docs: "#3b82f6",
  refactor: "#a855f7",
};

interface CategoryBarChartProps {
  data: Record<string, number>;
}

function labelFor(category: string) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export default memo(function CategoryBarChart({ data }: CategoryBarChartProps) {
  const chartData = CATEGORY_ORDER
    .map((key) => ({
      key,
      name: labelFor(key),
      value: data[key] ?? 0,
      fill: COLORS[key] ?? "#6b7280",
    }))
    .filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-text-tertiary">
        No commit category data yet
      </div>
    );
  }

  const height = Math.max(240, chartData.length * 48);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 8, right: 32, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tick={{
            fill: "hsl(var(--text-tertiary))",
            fontSize: 12,
            fontFamily: "var(--font-display), IBM Plex Sans, system-ui, sans-serif",
          }}
          axisLine={{ stroke: "hsl(var(--border-standard))" }}
          tickLine={{ stroke: "hsl(var(--border-standard))" }}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={88}
          tick={{
            fill: "hsl(var(--text-secondary))",
            fontSize: 12,
            fontFamily: "var(--font-display), IBM Plex Sans, system-ui, sans-serif",
          }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--surface-2) / 0.45)" }}
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border-standard))",
            borderRadius: "6px",
            color: "hsl(var(--text-primary))",
            fontFamily: "var(--font-display), IBM Plex Sans, system-ui, sans-serif",
            fontSize: "12px",
          }}
          labelStyle={{ color: "hsl(var(--text-primary))" }}
        />
        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={22}>
          {chartData.map((entry) => (
            <Cell key={entry.key} fill={entry.fill} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            className="fill-text-tertiary text-xs tabular-nums"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
});
