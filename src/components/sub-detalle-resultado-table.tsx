import type { FilaResultado } from "@/lib/data/estado-resultados-mensual";
import { formatMiles, formatPorcentaje, nombreMes } from "@/lib/format";
import type { Period } from "@/lib/data/estado-costo-mensual";

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

function pct(valor: number, base: number): string {
  if (base === 0) return "-";
  return formatPorcentaje(valor / base);
}

export function SubDetalleResultadoTable({
  filas,
  periodoActual,
  periodoAnterior,
  ventasActual,
  ventasAnterior,
}: {
  filas: FilaResultado[];
  periodoActual: Period;
  periodoAnterior: Period;
  ventasActual?: number;
  ventasAnterior?: number;
}) {
  const actualLabel = nombreMes(periodoActual.mes).toUpperCase();
  const anteriorLabel = nombreMes(periodoAnterior.mes).toUpperCase();

  const baseActual = ventasActual ?? 0;
  const baseAnterior = ventasAnterior ?? 0;
  const showPct = baseActual !== 0 || baseAnterior !== 0;

  const visibles = filas;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-52 pb-2"></th>
            <th className="pb-2">{actualLabel}</th>
            {showPct && <th className="pb-2">%</th>}
            <th className="pb-2">{anteriorLabel}</th>
            {showPct && <th className="pb-2">% Mes Anterior</th>}
            <th className="pb-2">Variación</th>
            <th className="pb-2">% Variación</th>
          </tr>
        </thead>
        <tbody>
          {visibles.map((fila) => (
            <tr key={fila.label} className={fila.destacado ? "font-semibold" : ""}>
              <td className="py-1 pr-3 text-sm text-slate-700">{fila.label}</td>
              <td className="py-1 pr-3">
                <Pill negative={fila.actual < 0}>{formatMiles(fila.actual)}</Pill>
              </td>
              {showPct && (
                <td className="py-1 pr-3">
                  <Pill negative={fila.actual < 0}>{pct(fila.actual, baseActual)}</Pill>
                </td>
              )}
              <td className="py-1 pr-3">
                <Pill negative={fila.mesAnterior < 0}>{formatMiles(fila.mesAnterior)}</Pill>
              </td>
              {showPct && (
                <td className="py-1 pr-3">
                  <Pill negative={fila.mesAnterior < 0}>{pct(fila.mesAnterior, baseAnterior)}</Pill>
                </td>
              )}
              <td className="py-1 pr-3">
                <Pill negative={fila.variacion < 0}>{formatMiles(fila.variacion)}</Pill>
              </td>
              <td className="py-1 pr-3">
                {fila.porcentajeVariacion !== null && (
                  <Pill negative={fila.porcentajeVariacion < 0}>
                    {formatPorcentaje(fila.porcentajeVariacion)}
                  </Pill>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
