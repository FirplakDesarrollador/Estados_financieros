import Link from "next/link";
import { getDetalleCostoAcumulado } from "@/lib/data/estado-costo-acumulado";
import { formatMiles } from "@/lib/format";

const DRILLDOWN_RUBRO: Record<string, string> = {
  "Costo MP Utilizada": "costo-mp-utilizada",
  "Costo M.O.D.": "costo-mod",
  CIF: "cif",
};

function Pill({ children, negative }: { children: React.ReactNode; negative?: boolean }) {
  return (
    <div
      className={`inline-block rounded-full border px-4 py-2 text-right text-sm tabular-nums ${
        negative ? "border-red-200 text-red-600" : "border-slate-300 text-slate-800"
      }`}
    >
      {children}
    </div>
  );
}

export default async function DetalleCostoAcumuladoPage({
  params,
  searchParams,
}: {
  params: Promise<{ rubro: string }>;
  searchParams: Promise<{ anio?: string; mes?: string }>;
}) {
  const { rubro } = await params;
  const sp = await searchParams;
  const anio = sp.anio ? Number(sp.anio) : new Date().getFullYear();
  const mes = sp.mes ? Number(sp.mes) : new Date().getMonth() + 1;

  const detalle = await getDetalleCostoAcumulado({ anio, mes }, rubro);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <h1 className="text-sm font-semibold text-slate-500">Estados Financieros</h1>
        <Link href={`/costo-acumulado?anio=${anio}&mes=${mes}`} className="text-sm text-slate-500 hover:text-slate-800">
          ← Volver al Estado del Costo Acumulado
        </Link>
      </header>

      <main className="mx-auto max-w-4xl px-8 py-10">
        <h2 className="mb-1 text-2xl font-semibold text-slate-900">Detalle: {detalle.label}</h2>
        <p className="mb-8 text-sm text-slate-500">
          Acumulado a {mes}/{anio} vs Acumulado a {mes}/{detalle.periodoAnterior.anio}
        </p>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="pb-2">Componente</th>
                <th className="pb-2">Acum. {anio}</th>
                <th className="pb-2">Acum. {detalle.periodoAnterior.anio}</th>
                <th className="pb-2">Variación</th>
                <th className="w-24 pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {detalle.componentes.map((c) => {
                const subRubro = DRILLDOWN_RUBRO[c.label];
                return (
                  <tr key={c.label}>
                    <td className="py-1 pr-3 text-sm text-slate-700">{c.label}</td>
                    <td className="py-1 pr-3">
                      <Pill negative={c.actual < 0}>{formatMiles(c.actual)}</Pill>
                    </td>
                    <td className="py-1 pr-3">
                      <Pill negative={c.anioAnterior < 0}>{formatMiles(c.anioAnterior)}</Pill>
                    </td>
                    <td className="py-1 pr-3">
                      <Pill negative={c.variacion < 0}>{formatMiles(c.variacion)}</Pill>
                    </td>
                    <td className="py-1">
                      {subRubro && (
                        <Link
                          href={`/detalle/costo-acumulado/${subRubro}?anio=${anio}&mes=${mes}`}
                          className="block w-full rounded-md border border-slate-300 px-3 py-2 text-center text-xs text-slate-600 hover:border-slate-400 hover:text-slate-900"
                        >
                          Detalle
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="font-semibold">
                <td className="py-1 pr-3 text-sm text-slate-900">Total {detalle.label}</td>
                <td className="py-1 pr-3">
                  <Pill negative={detalle.totalActual < 0}>{formatMiles(detalle.totalActual)}</Pill>
                </td>
                <td className="py-1 pr-3">
                  <Pill negative={detalle.totalAnterior < 0}>{formatMiles(detalle.totalAnterior)}</Pill>
                </td>
                <td className="py-1 pr-3">
                  <Pill negative={detalle.totalActual - detalle.totalAnterior < 0}>
                    {formatMiles(detalle.totalActual - detalle.totalAnterior)}
                  </Pill>
                </td>
                <td className="py-1"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
