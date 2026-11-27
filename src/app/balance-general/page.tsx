import { getBalanceGeneral } from "@/lib/data/balance-general";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { DEFAULT_EMPRESA } from "@/lib/companies";
import { BalanceGeneralTable } from "@/components/balance-general-table";
import { PageShell } from "@/components/page-shell";
import { ComparativoBarChart } from "@/components/charts/comparativo-bar-chart";

export default async function BalanceGeneralPage({
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

  const toChart = (filas: typeof data.activos) =>
    filas.filter((f) => !f.destacado).map((f) => ({ name: f.label, actual: f.actual, anterior: f.anterior }));

  return (
    <PageShell
      current="/balance-general"
      titulo="Situación Financiera"
      subtitulo={`Activos, Pasivos y Patrimonio — comparativo contra ${data.periodoAnterior.anio}`}
      periodos={periodos}
      actual={actual}
      empresa={empresa}
    >
      <div className="grid gap-4 lg:grid-cols-2 mb-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Composición de Activos — {actual.anio} vs {data.periodoAnterior.anio}
          </p>
          <ComparativoBarChart
            data={toChart(data.activos)}
            labelActual={`${actual.anio}`}
            labelAnterior={`${data.periodoAnterior.anio}`}
            layout="vertical"
            height={200}
          />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Composición Pasivos y Patrimonio — {actual.anio} vs {data.periodoAnterior.anio}
          </p>
          <ComparativoBarChart
            data={toChart(data.pasivosPatrimonio)}
            labelActual={`${actual.anio}`}
            labelAnterior={`${data.periodoAnterior.anio}`}
            layout="vertical"
            height={200}
          />
        </div>
      </div>
      <div className="space-y-4">
        <BalanceGeneralTable
          title="Activos"
          filas={data.activos}
          anioActual={data.periodoActual.anio}
          anioAnterior={data.periodoAnterior.anio}
        />
        <BalanceGeneralTable
          title="Pasivos y Patrimonio"
          filas={data.pasivosPatrimonio}
          anioActual={data.periodoActual.anio}
          anioAnterior={data.periodoAnterior.anio}
        />
      </div>
    </PageShell>
  );
}
