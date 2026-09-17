import { getEstadoCostoMensual, getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { EstadoCostoMensualTable } from "@/components/estado-costo-mensual-table";
import { PageShell } from "@/components/page-shell";

export default async function Home({
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

  const data = await getEstadoCostoMensual(actual);

  return (
    <PageShell
      current="/"
      titulo="Estado del Costo de Producción y Ventas Mensual"
      subtitulo="Comparativo"
      periodos={periodos}
      actual={actual}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EstadoCostoMensualTable data={data} />
      </div>
    </PageShell>
  );
}
