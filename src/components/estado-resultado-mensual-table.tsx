import Link from "next/link";
import type { EstadoResultadosMensual } from "@/lib/data/estado-resultados-mensual";
import { formatMiles, formatPorcentaje, nombreMes } from "@/lib/format";

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

export function EstadoResultadoMensualTable({ data }: { data: EstadoResultadosMensual }) {
  const actualLabel = nombreMes(data.periodoActual.mes).toUpperCase();
  const anteriorLabel = nombreMes(data.periodoAnterior.mes).toUpperCase();

  const ventasActual = data.filas[0]?.actual ?? 0;
  const ventasAnterior = data.filas[0]?.mesAnterior ?? 0;

  // Página principal: solo las 3 filas resumen (últimas del estado)
  const resumen = data.filas.slice(-3);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-44 pb-2"></th>
            <th className="pb-2">{actualLabel}</th>
            <th className="pb-2">%</th>
            <th className="pb-2">{anteriorLabel}</th>
            <th className="pb-2">% Mes Anterior</th>
            <th className="pb-2">Variación</th>
            <th className="pb-2">% Variación</th>
            <th className="w-24 pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {resumen.map((fila) => (
            <tr key={fila.label} className={fila.destacado ? "font-semibold" : ""}>
              <td className="py-1 pr-3 text-sm text-slate-700">{fila.label}</td>
              <td className="py-1 pr-3">
                <Pill negative={fila.actual < 0}>{formatMiles(fila.actual)}</Pill>
              </td>
              <td className="py-1 pr-3">
                <Pill negative={fila.actual < 0}>{pct(fila.actual, ventasActual)}</Pill>
              </td>
              <td className="py-1 pr-3">
                <Pill negative={fila.mesAnterior < 0}>{formatMiles(fila.mesAnterior)}</Pill>
              </td>
              <td className="py-1 pr-3">
                <Pill negative={fila.mesAnterior < 0}>{pct(fila.mesAnterior, ventasAnterior)}</Pill>
              </td>
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
              <td className="py-1">
                {fila.label === "Utilidad Antes de Impuesto" && (
                  <Link
                    href={`/detalle/resultado-mensual?anio=${data.periodoActual.anio}&mes=${data.periodoActual.mes}`}
                    className="block w-full rounded-md border border-slate-300 px-3 py-2 text-center text-xs text-slate-600 hover:border-slate-400 hover:text-slate-900"
                  >
                    Detalle
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
