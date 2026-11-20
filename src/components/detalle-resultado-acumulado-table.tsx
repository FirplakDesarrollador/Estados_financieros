import type { EstadoResultadosAcumulado, FilaResultadoAcumulado } from "@/lib/data/estado-resultados-acumulado";
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

function SeccionTable({
  titulo,
  filas,
  baseActual,
  baseAnterior,
  actualLabel,
  anteriorLabel,
}: {
  titulo: string;
  filas: FilaResultadoAcumulado[];
  baseActual: number;
  baseAnterior: number;
  actualLabel: string;
  anteriorLabel: string;
}) {
  return (
    <div className="mb-8">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">{titulo}</p>
      <table className="w-full min-w-[900px] border-separate border-spacing-y-2">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-52 pb-2"></th>
            <th className="pb-2">{actualLabel}</th>
            <th className="pb-2">%</th>
            <th className="pb-2">{anteriorLabel}</th>
            <th className="pb-2">% Año Anterior</th>
            <th className="pb-2">Variación</th>
            <th className="pb-2">% Variación</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.label} className={fila.destacado ? "font-semibold" : ""}>
              <td className="py-1 pr-3 text-sm text-slate-700">{fila.label}</td>
              <td className="py-1 pr-3">
                <Pill negative={fila.actual < 0}>{formatMiles(fila.actual)}</Pill>
              </td>
              <td className="py-1 pr-3">
                <Pill negative={fila.actual < 0}>{pct(fila.actual, baseActual)}</Pill>
              </td>
              <td className="py-1 pr-3">
                <Pill negative={fila.mesAnterior < 0}>{formatMiles(fila.mesAnterior)}</Pill>
              </td>
              <td className="py-1 pr-3">
                <Pill negative={fila.mesAnterior < 0}>{pct(fila.mesAnterior, baseAnterior)}</Pill>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetalleResultadoAcumuladoTable({ data }: { data: EstadoResultadosAcumulado }) {
  const actualLabel = periodoLabel(data.periodoActual.mes, data.periodoActual.anio);
  const anteriorLabel = periodoLabel(data.periodoAnterior.mes, data.periodoAnterior.anio);

  const baseActual = data.filas[0]?.actual ?? 0;
  const baseAnterior = data.filas[0]?.mesAnterior ?? 0;

  const props = { actualLabel, anteriorLabel, baseActual, baseAnterior };

  return (
    <div className="overflow-x-auto">
      <SeccionTable titulo="Ventas Netas" filas={data.detalles.ventasNetas} {...props} />
      <SeccionTable titulo="Costo de Ventas" filas={data.detalles.costoVentas} {...props} />
      <SeccionTable titulo="Gastos Operativos" filas={data.detalles.gastosOperativos} {...props} />
      <SeccionTable titulo="Ingresos No Operativos" filas={data.detalles.ingresosNoOperativos} {...props} />
      <SeccionTable titulo="Gastos No Operativos" filas={data.detalles.gastosNoOperativos} {...props} />
    </div>
  );
}
