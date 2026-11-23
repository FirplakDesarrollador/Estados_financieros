import React from "react";
import Link from "next/link";
import type { FilaResultadoAcumulado } from "@/lib/data/estado-resultados-acumulado";
import type { Period } from "@/lib/data/estado-costo-mensual";
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

function periodoLabel(mes: number, anio: number): string {
  return `ENE-${nombreMes(mes).slice(0, 3).toUpperCase()} ${anio}`;
}

export function SubDetalleResultadoAcumuladoTable({
  filas,
  periodoActual,
  periodoAnterior,
  ventasActual,
  ventasAnterior,
  links,
  empresa,
}: {
  filas: FilaResultadoAcumulado[];
  periodoActual: Period;
  periodoAnterior: Period;
  ventasActual?: number;
  ventasAnterior?: number;
  links?: Record<string, string>;
  empresa?: string;
}) {
  const actualLabel = periodoLabel(periodoActual.mes, periodoActual.anio);
  const anteriorLabel = periodoLabel(periodoAnterior.mes, periodoAnterior.anio);
  const { anio, mes } = periodoActual;
  const emp = empresa ?? "firplak";

  const baseActual = ventasActual ?? 0;
  const baseAnterior = ventasAnterior ?? 0;
  const showPct = baseActual !== 0 || baseAnterior !== 0;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-52 pb-2"></th>
            <th className="pb-2">{actualLabel}</th>
            {showPct && <th className="pb-2">%</th>}
            <th className="pb-2">{anteriorLabel}</th>
            {showPct && <th className="pb-2">% Año Anterior</th>}
            <th className="pb-2">Variación</th>
            <th className="pb-2">% Variación</th>
            {links && <th className="w-24 pb-2"></th>}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => {
            const slug = links?.[fila.label];
            return (
              <React.Fragment key={fila.label}>
                {fila.sectionHeader && (
                  <tr>
                    <td colSpan={8} className="pt-5 pb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {fila.sectionHeader}
                    </td>
                  </tr>
                )}
                <tr className={fila.destacado ? "font-semibold" : ""}>
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
                  {links && (
                    <td className="py-1">
                      {slug && (
                        <Link
                          href={`/detalle/resultado-acumulado/${slug}?anio=${anio}&mes=${mes}&empresa=${emp}`}
                          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-center text-xs text-slate-600 hover:border-slate-400 hover:text-slate-900"
                        >
                          Detalle
                        </Link>
                      )}
                    </td>
                  )}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
