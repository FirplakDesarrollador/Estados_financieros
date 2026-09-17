import { getEstadoCostoAcumulado } from "@/lib/data/estado-costo-acumulado";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { EstadoCostoAcumuladoTable } from "@/components/estado-costo-acumulado-table";
import { PageShell } from "@/components/page-shell";

export default async function CostoAcumuladoPage({
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

  const data = await getEstadoCostoAcumulado(actual);

  return (
    <PageShell
      current="/costo-acumulado"
      titulo="Estado del Costo de Producción y Ventas Acumulado"
      subtitulo={`Comparativo contra el mismo periodo de ${data.periodoAnterior.anio}`}
      periodos={periodos}
      actual={actual}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <EstadoCostoAcumuladoTable data={data} />
      </div>
    </PageShell>
  );
}
