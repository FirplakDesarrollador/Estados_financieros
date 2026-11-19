import { getEstadoResultadosAcumulado } from "@/lib/data/estado-resultados-acumulado";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { DEFAULT_EMPRESA } from "@/lib/companies";
import { EstadoResultadoAcumuladoTable } from "@/components/estado-resultado-acumulado-table";
import { PageShell } from "@/components/page-shell";
import { ComparativoBarChart } from "@/components/charts/comparativo-bar-chart";

export default async function ResultadosAcumuladoPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string; empresa?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const empresa = params.empresa ?? DEFAULT_EMPRESA;
  const paramsActual = params.anio && params.mes
    ? { anio: Number(params.anio), mes: Number(params.mes) }
    : null;

  const periodosPromise = getPeriodosDisponibles(empresa);
  const dataPromise = paramsActual
    ? getEstadoResultadosAcumulado(paramsActual, empresa)
    : periodosPromise.then((p) => getEstadoResultadosAcumulado(p[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 }, empresa));

  const [periodos, data] = await Promise.all([periodosPromise, dataPromise]);
  const actual = paramsActual ?? periodos[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 };

  const RESULT_LABELS = ["Ventas Netas", "Costo de Ventas", "Utilidad Bruta en Ventas", "Utilidad Operacional", "Utilidad del Periodo"];
  const resultChartData = data.filas
    .filter((f) => RESULT_LABELS.includes(f.label))
    .map((f) => ({
      name: f.label
        .replace("Utilidad Bruta en Ventas", "Ut. Bruta")
        .replace("Utilidad Operacional", "Ut. Operacional")
        .replace("Utilidad del Periodo", "Ut. Periodo"),
      actual: f.actual,
      anterior: f.mesAnterior,
    }));

  return (
    <PageShell
      current="/resultados-acumulado"
      titulo="Estado de Resultado Integral Acumulado"
      subtitulo={`Comparativo contra el mismo periodo de ${data.periodoAnterior.anio}`}
      periodos={periodos}
      actual={actual}
      empresa={empresa}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Acumulado {actual.anio} vs {data.periodoAnterior.anio}
        </p>
        <ComparativoBarChart
          data={resultChartData}
          labelActual={`Acum. ${actual.anio}`}
          labelAnterior={`Acum. ${data.periodoAnterior.anio}`}
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EstadoResultadoAcumuladoTable data={data} />
      </div>
    </PageShell>
  );
}
