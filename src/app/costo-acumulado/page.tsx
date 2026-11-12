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
  const now = new Date();
  const paramsActual = params.anio && params.mes
    ? { anio: Number(params.anio), mes: Number(params.mes) }
    : null;

  const periodosPromise = getPeriodosDisponibles();
  const dataPromise = paramsActual
    ? getEstadoCostoAcumulado(paramsActual)
    : periodosPromise.then((p) => getEstadoCostoAcumulado(p[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 }));

  const [periodos, data] = await Promise.all([periodosPromise, dataPromise]);
  const actual = paramsActual ?? periodos[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 };

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
