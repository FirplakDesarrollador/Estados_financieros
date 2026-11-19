"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatMiles } from "@/lib/format";

export type ChartFila = { name: string; actual: number; anterior: number };

type Props = {
  data: ChartFila[];
  labelActual: string;
  labelAnterior: string;
  layout?: "vertical" | "horizontal";
  height?: number;
};

function fmt(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(v / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-sm min-w-[180px]">
      <p className="font-semibold text-slate-700 mb-2 border-b border-slate-100 pb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="mt-1" style={{ color: p.color }}>
          <span className="font-medium">{p.name}:</span> {formatMiles(p.value)}
        </p>
      ))}
      {payload.length === 2 && (
        <p className="mt-1 pt-1 border-t border-slate-100 text-slate-500">
          Var: {formatMiles(payload[0].value - payload[1].value)}
        </p>
      )}
    </div>
  );
}

export function ComparativoBarChart({
  data,
  labelActual,
  labelAnterior,
  layout = "horizontal",
  height = 280,
}: Props) {
  if (layout === "vertical") {
    return (
      <ResponsiveContainer width="100%" height={Math.max(height, data.length * 56 + 40)}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 140, bottom: 4 }}
          barCategoryGap="30%"
          barGap={4}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            tickFormatter={fmt}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={136}
            tick={{ fontSize: 11, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Bar dataKey="actual" name={labelActual} fill="#4f46e5" radius={[0, 4, 4, 0]} />
          <Bar dataKey="anterior" name={labelAnterior} fill="#cbd5e1" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
        barCategoryGap="30%"
        barGap={4}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: "#475569" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Bar dataKey="actual" name={labelActual} fill="#4f46e5" radius={[4, 4, 0, 0]} />
        <Bar dataKey="anterior" name={labelAnterior} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
