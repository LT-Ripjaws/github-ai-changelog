"use client";
import { memo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS: Record<string, string> = {
  breaking: "#ef4444",
  feature: "#10b981",
  fix: "#f59e0b",
  chore: "#64748b",
  docs: "#3b82f6",
  refactor: "#a855f7",
};

interface Props {
  data: Record<string, number>;
}

export default memo(function CategoryPieChart({ data }: Props) {
  const chartData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      fill: COLORS[name] ?? "#6b7280",
    }));

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-text-tertiary text-sm">
        No commit data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, value }) => `${name} (${value})`}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} />
          ))}
        </Pie>
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
        <Legend 
          wrapperStyle={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "12px",
            color: "hsl(var(--text-secondary))",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});
