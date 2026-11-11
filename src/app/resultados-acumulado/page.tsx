import { getEstadoResultadosAcumulado } from "@/lib/data/estado-resultados-acumulado";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { EstadoResultadoAcumuladoTable } from "@/components/estado-resultado-acumulado-table";
import { PageShell } from "@/components/page-shell";

export default async function ResultadosAcumuladoPage({
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

  const data = await getEstadoResultadosAcumulado(actual);

  return (
    <PageShell
      current="/resultados-acumulado"
      titulo="Estado de Resultado Integral Acumulado"
      subtitulo={`Comparativo contra el mismo periodo de ${data.periodoAnterior.anio}`}
      periodos={periodos}
      actual={actual}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EstadoResultadoAcumuladoTable data={data} />
      </div>
    </PageShell>
  );
}
