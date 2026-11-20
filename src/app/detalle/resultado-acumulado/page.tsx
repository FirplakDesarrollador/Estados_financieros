import Link from "next/link";
import { getEstadoResultadosAcumulado } from "@/lib/data/estado-resultados-acumulado";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { DetalleResultadoAcumuladoTable } from "@/components/detalle-resultado-acumulado-table";
import { nombreMes } from "@/lib/format";

export default async function DetalleResultadoAcumuladoPage({
  searchParams,
}: {
  searchParams: Promise<{ anio?: string; mes?: string; empresa?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const empresa = params.empresa ?? "firplak";
  const paramsActual =
    params.anio && params.mes
      ? { anio: Number(params.anio), mes: Number(params.mes) }
      : null;

  const periodosPromise = getPeriodosDisponibles(empresa);
  const dataPromise = paramsActual
    ? getEstadoResultadosAcumulado(paramsActual, empresa)
    : periodosPromise.then((p) =>
        getEstadoResultadosAcumulado(
          p[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 },
          empresa,
        ),
      );

  const [, data] = await Promise.all([periodosPromise, dataPromise]);
  const { periodoActual, periodoAnterior } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <h1 className="text-sm font-semibold text-slate-500">Estados Financieros</h1>
        <Link
          href={`/resultados-acumulado?anio=${periodoActual.anio}&mes=${periodoActual.mes}&empresa=${empresa}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Volver al Estado de Resultados Acumulado
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-10">
        <h2 className="mb-1 text-2xl font-semibold text-slate-900">
          Estado de Resultado Integral Acumulado
        </h2>
        <p className="mb-8 text-sm text-slate-500">
          Desglose — ENE-{nombreMes(periodoActual.mes).slice(0, 3).toUpperCase()} {periodoActual.anio} vs ENE-
          {nombreMes(periodoAnterior.mes).slice(0, 3).toUpperCase()} {periodoAnterior.anio}
        </p>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <DetalleResultadoAcumuladoTable data={data} empresa={empresa} />
        </div>
      </main>
    </div>
  );
}
