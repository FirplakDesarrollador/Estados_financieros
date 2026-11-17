import { getEstadoCambiosPatrimonio } from "@/lib/data/estado-cambios-patrimonio";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { EstadoCambiosPatrimonioTable } from "@/components/estado-cambios-patrimonio-table";
import { PageShell } from "@/components/page-shell";
import { nombreMes } from "@/lib/format";
import { PatrimonioChart } from "@/components/charts/patrimonio-chart";

export default async function CambiosPatrimonioPage({
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
    ? getEstadoCambiosPatrimonio(paramsActual)
    : periodosPromise.then((p) => getEstadoCambiosPatrimonio(p[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 }));

  const [periodos, data] = await Promise.all([periodosPromise, dataPromise]);
  const actual = paramsActual ?? periodos[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 };

  const saldoInicial = data.filas[0]?.valores;
  const saldoCierre = data.filas[data.filas.length - 1]?.valores;

  return (
    <PageShell
      current="/cambios-patrimonio"
      titulo="Estado de Cambios en el Patrimonio"
      subtitulo={`Al ${nombreMes(actual.mes)} ${actual.anio} — Cifras en miles de pesos`}
      periodos={periodos}
      actual={actual}
    >
      {saldoInicial && saldoCierre && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm mb-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">
            Componentes del Patrimonio — Saldo Inicial vs Saldo Cierre {actual.anio}
          </p>
          <PatrimonioChart
            saldoInicial={saldoInicial}
            saldoCierre={saldoCierre}
            anio={actual.anio}
          />
        </div>
      )}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EstadoCambiosPatrimonioTable data={data} />
      </div>
    </PageShell>
  );
}
