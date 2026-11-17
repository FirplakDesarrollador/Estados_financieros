import { getEstadoCostoMensual, getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { EstadoCostoMensualTable } from "@/components/estado-costo-mensual-table";
import { PageShell } from "@/components/page-shell";
import { ComparativoBarChart } from "@/components/charts/comparativo-bar-chart";
import { nombreMes } from "@/lib/format";

export default async function Home({
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
    ? getEstadoCostoMensual(paramsActual)
    : periodosPromise.then((p) => getEstadoCostoMensual(p[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 }));

  const [periodos, data] = await Promise.all([periodosPromise, dataPromise]);
  const actual = paramsActual ?? periodos[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 };

  const COSTO_CHART_LABELS = ["C. Prod Periodo", "C. Venta Manufac.", "Total Costo Venta"];
  const costoChartData = data.filas
    .filter((f) => COSTO_CHART_LABELS.includes(f.label))
    .map((f) => ({ name: f.label, actual: f.actual, anterior: f.mesAnterior }));

  return (
    <PageShell
      current="/"
      titulo="Estado del Costo de Producción y Ventas Mensual"
      subtitulo="Comparativo"
      periodos={periodos}
      actual={actual}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Resumen — {nombreMes(actual.mes)} {actual.anio} vs {nombreMes(data.periodoAnterior.mes)} {data.periodoAnterior.anio}
        </p>
        <ComparativoBarChart
          data={costoChartData}
          labelActual={`${nombreMes(actual.mes)} ${actual.anio}`}
          labelAnterior={`${nombreMes(data.periodoAnterior.mes)} ${data.periodoAnterior.anio}`}
        />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EstadoCostoMensualTable data={data} />
      </div>
    </PageShell>
  );
}
