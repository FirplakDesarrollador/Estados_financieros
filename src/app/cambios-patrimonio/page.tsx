import { getEstadoCambiosPatrimonio } from "@/lib/data/estado-cambios-patrimonio";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { EstadoCambiosPatrimonioTable } from "@/components/estado-cambios-patrimonio-table";
import { PageShell } from "@/components/page-shell";
import { nombreMes } from "@/lib/format";

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

  return (
    <PageShell
      current="/cambios-patrimonio"
      titulo="Estado de Cambios en el Patrimonio"
      subtitulo={`Al ${nombreMes(actual.mes)} ${actual.anio} — Cifras en miles de pesos`}
      periodos={periodos}
      actual={actual}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EstadoCambiosPatrimonioTable data={data} />
      </div>
    </PageShell>
  );
}
