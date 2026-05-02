"use client";
import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  data: { month: string; count: number }[];
}

export default memo(function CommitsOverTimeChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-tertiary text-sm">
        No commit data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border-subtle))" />
        <XAxis
          dataKey="month"
          tick={{ fill: "hsl(var(--text-tertiary))", fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" }}
          axisLine={{ stroke: "hsl(var(--border-standard))" }}
        />
        <YAxis
          tick={{ fill: "hsl(var(--text-tertiary))", fontSize: 12, fontFamily: "Inter, system-ui, sans-serif" }}
          axisLine={{ stroke: "hsl(var(--border-standard))" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border-standard))",
            borderRadius: "6px",
            color: "hsl(var(--text-primary))",
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "12px",
          }}
        />
        <Bar dataKey="count" fill="hsl(var(--brand-indigo))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
});
