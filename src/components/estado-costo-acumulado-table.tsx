import Link from "next/link";
import type { EstadoCostoAcumulado } from "@/lib/data/estado-costo-acumulado";
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

export function EstadoCostoAcumuladoTable({ data }: { data: EstadoCostoAcumulado }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-40 pb-2"></th>
            <th className="pb-2">Acum. {data.periodoActual.anio}</th>
            <th className="pb-2">%</th>
            <th className="pb-2">Acum. {data.periodoAnterior.anio}</th>
            <th className="pb-2">% Año Anterior</th>
            <th className="pb-2">Variación</th>
            <th className="pb-2">% Variación</th>
            <th className="w-24 pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.filas.map((fila) => (
            <tr key={fila.label} className={fila.destacado ? "font-semibold" : ""}>
              <td className="py-1 pr-3 text-sm text-slate-700">{fila.label}</td>
              <td className="py-1 pr-3">
                <Pill negative={fila.actual < 0}>{formatMiles(fila.actual)}</Pill>
              </td>
              <td className="py-1 pr-3">
                {fila.porcentaje !== null && <Pill>{formatPorcentaje(fila.porcentaje)}</Pill>}
              </td>
              <td className="py-1 pr-3">
                <Pill negative={fila.anioAnterior < 0}>{formatMiles(fila.anioAnterior)}</Pill>
              </td>
              <td className="py-1 pr-3">
                {fila.porcentajeAnioAnterior !== null && (
                  <Pill negative={fila.porcentajeAnioAnterior < 0}>{formatPorcentaje(fila.porcentajeAnioAnterior)}</Pill>
                )}
              </td>
              <td className="py-1 pr-3">
                <Pill negative={fila.variacion < 0}>{formatMiles(fila.variacion)}</Pill>
              </td>
              <td className="py-1 pr-3">
                {fila.porcentajeVariacion !== null && (
                  <Pill negative={fila.porcentajeVariacion < 0}>{formatPorcentaje(fila.porcentajeVariacion)}</Pill>
                )}
              </td>
              <td className="py-1">
                <Link
                  href={`/detalle/costo-acumulado/${fila.rubro}?anio=${data.periodoActual.anio}&mes=${data.periodoActual.mes}`}
                  className="block w-full rounded-md border border-slate-300 px-3 py-2 text-center text-xs text-slate-600 hover:border-slate-400 hover:text-slate-900"
                >
                  Detalle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
