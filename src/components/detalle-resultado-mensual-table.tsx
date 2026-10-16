import Link from "next/link";
import type { EstadoResultadosMensual, FilaResultado } from "@/lib/data/estado-resultados-mensual";
import { formatMiles, formatPesos, formatPorcentaje, nombreMes } from "@/lib/format";

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

function valor(fila: FilaResultado, campo: "actual" | "mesAnterior" | "variacion") {
  const v = fila[campo];
  return fila.destacado ? formatMiles(v) : formatPesos(v);
}

function pct(valor: number, base: number): string {
  if (base === 0) return "-";
  return formatPorcentaje(valor / base);
}

// Detalle de Ut. Antes de Impuesto: Ut. Op | Gtos No Op | Ingr. No Op | Ut. Antes Impto
export function DetalleResultadoMensualTable({ data }: { data: EstadoResultadosMensual }) {
  const actualLabel = nombreMes(data.periodoActual.mes).toUpperCase();
  const anteriorLabel = nombreMes(data.periodoAnterior.mes).toUpperCase();
  const { anio, mes } = data.periodoActual;

  const ventasNetas = data.filas[0];
  const baseActual = ventasNetas?.actual ?? 0;
  const baseAnterior = ventasNetas?.mesAnterior ?? 0;

  const utOp = data.filas[4];
  const gastosNoOp = data.filas[6];
  const ingresosNoOp = data.filas[5];
  const utAntes = data.filas[7];

  const LINKS: Record<string, string> = {
    [utOp?.label]: "utilidad-operacional",
    [gastosNoOp?.label]: "gastos-no-operativos",
    [ingresosNoOp?.label]: "ingresos-no-operativos",
  };

  const filas = [utOp, gastosNoOp, ingresosNoOp, utAntes].filter(Boolean);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-52 pb-2"></th>
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
          {filas.map((fila) => {
            const slug = LINKS[fila.label];
            return (
              <tr key={fila.label} className={fila.destacado ? "font-semibold" : ""}>
                <td className="py-1 pr-3 text-sm text-slate-700">{fila.label}</td>
                <td className="py-1 pr-3">
                  <Pill negative={fila.actual < 0}>{valor(fila, "actual")}</Pill>
                </td>
                <td className="py-1 pr-3">
                  <Pill negative={fila.actual < 0}>{pct(fila.actual, baseActual)}</Pill>
                </td>
                <td className="py-1 pr-3">
                  <Pill negative={fila.mesAnterior < 0}>{valor(fila, "mesAnterior")}</Pill>
                </td>
                <td className="py-1 pr-3">
                  <Pill negative={fila.mesAnterior < 0}>{pct(fila.mesAnterior, baseAnterior)}</Pill>
                </td>
                <td className="py-1 pr-3">
                  <Pill negative={fila.variacion < 0}>{valor(fila, "variacion")}</Pill>
                </td>
                <td className="py-1 pr-3">
                  {fila.porcentajeVariacion !== null && (
                    <Pill negative={fila.porcentajeVariacion < 0}>
                      {formatPorcentaje(fila.porcentajeVariacion)}
                    </Pill>
                  )}
                </td>
                <td className="py-1">
                  {slug && (
                    <Link
                      href={`/detalle/resultado-mensual/${slug}?anio=${anio}&mes=${mes}`}
                      className="block w-full rounded-md border border-slate-300 px-3 py-2 text-center text-xs text-slate-600 hover:border-slate-400 hover:text-slate-900"
                    >
                      Detalle
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
