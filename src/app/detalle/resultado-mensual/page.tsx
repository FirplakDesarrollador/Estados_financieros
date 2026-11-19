import Link from "next/link";
import { getEstadoResultadosMensual } from "@/lib/data/estado-resultados-mensual";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { DetalleResultadoMensualTable } from "@/components/detalle-resultado-mensual-table";
import { nombreMes } from "@/lib/format";

export default async function DetalleResultadoMensualPage({
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

  const [, data] = await Promise.all([periodosPromise, dataPromise]);
  const actual = paramsActual ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 };
  const { periodoActual, periodoAnterior } = data;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <h1 className="text-sm font-semibold text-slate-500">Estados Financieros</h1>
        <Link
          href={`/resultados-mensual?anio=${periodoActual.anio}&mes=${periodoActual.mes}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← Volver al Estado de Resultados Mensual
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-10">
        <h2 className="mb-1 text-2xl font-semibold text-slate-900">
          Estado de Resultado Integral Mensual
        </h2>
        <p className="mb-8 text-sm text-slate-500">
          Desglose — {nombreMes(periodoActual.mes)} {periodoActual.anio} vs{" "}
          {nombreMes(periodoAnterior.mes)} {periodoAnterior.anio}
        </p>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <DetalleResultadoMensualTable data={data} />
        </div>
      </main>
    </div>
  );
}
