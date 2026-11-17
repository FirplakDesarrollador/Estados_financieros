"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatMiles } from "@/lib/format";
import type { ComponentePatrimonio } from "@/lib/data/estado-cambios-patrimonio";

type Props = {
  saldoInicial: ComponentePatrimonio;
  saldoCierre: ComponentePatrimonio;
  anio: number;
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
    </div>
  );
}

export function PatrimonioChart({ saldoInicial, saldoCierre, anio }: Props) {
  const data = [
    { name: "Capital Social", inicial: saldoInicial.capitalSocial, cierre: saldoCierre.capitalSocial },
    { name: "Superávit", inicial: saldoInicial.superavitCapital, cierre: saldoCierre.superavitCapital },
    { name: "Reservas", inicial: saldoInicial.reservas, cierre: saldoCierre.reservas },
    { name: "Ut. Retenidas", inicial: saldoInicial.utilidadesRetenidas, cierre: saldoCierre.utilidadesRetenidas },
    { name: "Ej. Anteriores", inicial: saldoInicial.resultadosEjAnteriores, cierre: saldoCierre.resultadosEjAnteriores },
    { name: "Ut. Periodo", inicial: saldoInicial.resultadosEjercicio, cierre: saldoCierre.resultadosEjercicio },
  ].filter((d) => d.inicial !== 0 || d.cierre !== 0);

  return (
    <ResponsiveContainer width="100%" height={260}>
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
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
        <Bar dataKey="inicial" name={`Saldo Inicial ${anio}`} fill="#cbd5e1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="cierre" name={`Saldo Cierre ${anio}`} fill="#4f46e5" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
