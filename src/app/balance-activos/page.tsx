import { getBalanceGeneral } from "@/lib/data/balance-general";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { DEFAULT_EMPRESA } from "@/lib/companies";
import { BalanceGeneralTable } from "@/components/balance-general-table";
import { PageShell } from "@/components/page-shell";
import { ComparativoBarChart } from "@/components/charts/comparativo-bar-chart";

export default async function BalanceActivosPage({
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
    ? getBalanceGeneral(paramsActual, empresa)
    : periodosPromise.then((p) => getBalanceGeneral(p[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 }, empresa));

  const [periodos, data] = await Promise.all([periodosPromise, dataPromise]);
  const actual = paramsActual ?? periodos[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 };

  const activosChartData = data.activos
    .filter((f) => !f.destacado)
    .map((f) => ({ name: f.label, actual: f.actual, anterior: f.anterior }));

  return (
    <PageShell
      current="/balance-activos"
      titulo="Balance General — Activos"
      subtitulo={`Comparativo contra ${data.periodoAnterior.anio}`}
      periodos={periodos}
      actual={actual}
      empresa={empresa}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
          Composición de Activos — {actual.anio} vs {data.periodoAnterior.anio}
        </p>
        <ComparativoBarChart
          data={activosChartData}
          labelActual={`${actual.anio}`}
          labelAnterior={`${data.periodoAnterior.anio}`}
          layout="vertical"
          height={200}
        />
      </div>
      <BalanceGeneralTable
        title="Activos"
        filas={data.activos}
        anioActual={data.periodoActual.anio}
        anioAnterior={data.periodoAnterior.anio}
      />
    </PageShell>
  );
}
