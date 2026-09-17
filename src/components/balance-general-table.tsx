import type { FilaBalance } from "@/lib/data/balance-general";
import { formatMiles, formatPorcentaje } from "@/lib/format";

function Pill({ children, negative }: { children: React.ReactNode; negative?: boolean }) {
  return (
    <div
      className={`rounded-full border px-4 py-2 text-right text-sm tabular-nums ${
        negative ? "border-red-200 text-red-600" : "border-slate-300 text-slate-800"
      }`}
    >
      {children}
    </div>
  );
}

export function BalanceGeneralTable({
  title,
  filas,
  anioActual,
  anioAnterior,
}: {
  title: string;
  filas: FilaBalance[];
  anioActual: number;
  anioAnterior: number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">{title}</h3>
      <table className="w-full border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="pb-2">Cuenta</th>
            <th className="pb-2">{anioActual}</th>
            <th className="pb-2">{anioAnterior}</th>
            <th className="pb-2">Variación</th>
            <th className="pb-2">% Variación</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.label} className={f.destacado ? "font-semibold" : ""}>
              <td className="py-1 pr-3 text-sm text-slate-700">{f.label}</td>
              <td className="py-1 pr-3">
                <Pill negative={f.actual < 0}>{formatMiles(f.actual)}</Pill>
              </td>
              <td className="py-1 pr-3">
                <Pill negative={f.anterior < 0}>{formatMiles(f.anterior)}</Pill>
              </td>
              <td className="py-1 pr-3">
                <Pill negative={f.variacion < 0}>{formatMiles(f.variacion)}</Pill>
              </td>
              <td className="py-1 pr-3">
                {f.porcentajeVariacion !== null && (
                  <Pill negative={f.porcentajeVariacion < 0}>{formatPorcentaje(f.porcentajeVariacion)}</Pill>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
