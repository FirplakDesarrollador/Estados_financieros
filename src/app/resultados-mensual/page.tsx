import { getEstadoResultadosMensual } from "@/lib/data/estado-resultados-mensual";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { EstadoResultadoMensualTable } from "@/components/estado-resultado-mensual-table";
import { PageShell } from "@/components/page-shell";
import { ComparativoBarChart } from "@/components/charts/comparativo-bar-chart";
import { nombreMes } from "@/lib/format";

export default async function ResultadosMensualPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const paramsActual = params.anio && params.mes
    ? { anio: Number(params.anio), mes: Number(params.mes) }
    : null;

  const periodosPromise = getPeriodosDisponibles();
  const dataPromise = paramsActual
    ? getEstadoResultadosMensual(paramsActual)
    : periodosPromise.then((p) => getEstadoResultadosMensual(p[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 }));

  const [periodos, data] = await Promise.all([periodosPromise, dataPromise]);
  const actual = paramsActual ?? periodos[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 };

  const RESULT_LABELS = ["Ventas Netas", "Costo de Ventas", "Utilidad Bruta en Ventas", "Utilidad Operacional", "Utilidad del Periodo"];
  const resultChartData = data.filas
    .filter((f) => RESULT_LABELS.includes(f.label))
    .map((f) => ({ name: f.label.replace("Utilidad Bruta en Ventas", "Ut. Bruta").replace("Utilidad Operacional", "Ut. Operacional").replace("Utilidad del Periodo", "Ut. Periodo"), actual: f.actual, anterior: f.mesAnterior }));

  return (
    <PageShell
      current="/resultados-mensual"
      titulo="Estado de Resultado Integral Mensual"
      subtitulo="Comparativo"
      periodos={periodos}
      actual={actual}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          {nombreMes(actual.mes)} {actual.anio} vs {nombreMes(data.periodoAnterior.mes)} {data.periodoAnterior.anio}
        </p>
        <ComparativoBarChart
          data={resultChartData}
          labelActual={`${nombreMes(actual.mes)} ${actual.anio}`}
          labelAnterior={`${nombreMes(data.periodoAnterior.mes)} ${data.periodoAnterior.anio}`}
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EstadoResultadoMensualTable data={data} />
      </div>
    </PageShell>
  );
}
