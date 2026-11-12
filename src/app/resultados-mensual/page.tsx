import { getEstadoResultadosMensual } from "@/lib/data/estado-resultados-mensual";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { EstadoResultadoMensualTable } from "@/components/estado-resultado-mensual-table";
import { PageShell } from "@/components/page-shell";

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

  return (
    <PageShell
      current="/resultados-mensual"
      titulo="Estado de Resultado Integral Mensual"
      subtitulo="Comparativo"
      periodos={periodos}
      actual={actual}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EstadoResultadoMensualTable data={data} />
      </div>
    </PageShell>
  );
}
