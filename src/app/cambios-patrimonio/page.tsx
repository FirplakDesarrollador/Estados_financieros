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
  const periodos = await getPeriodosDisponibles();
  const latest = periodos[0] ?? { anio: new Date().getFullYear(), mes: new Date().getMonth() + 1 };

  const actual = {
    anio: params.anio ? Number(params.anio) : latest.anio,
    mes: params.mes ? Number(params.mes) : latest.mes,
  };

  const data = await getEstadoCambiosPatrimonio(actual);

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
