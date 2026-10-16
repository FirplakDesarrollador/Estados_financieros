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
  const periodos = await getPeriodosDisponibles();
  const latest = periodos[0] ?? { anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 };

  const actual = {
    anio: params.anio ? Number(params.anio) : latest.anio,
    mes: params.mes ? Number(params.mes) : latest.mes,
  };

  const data = await getEstadoResultadosMensual(actual);

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
