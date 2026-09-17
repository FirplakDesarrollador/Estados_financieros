import { getBalanceGeneral } from "@/lib/data/balance-general";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { BalanceGeneralTable } from "@/components/balance-general-table";
import { PageShell } from "@/components/page-shell";

export default async function BalanceActivosPage({
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

  const data = await getBalanceGeneral(actual);

  return (
    <PageShell
      current="/balance-activos"
      titulo="Balance General — Activos"
      subtitulo={`Comparativo contra ${data.periodoAnterior.anio}`}
      periodos={periodos}
      actual={actual}
    >
      <BalanceGeneralTable
        title="Activos"
        filas={data.activos}
        anioActual={data.periodoActual.anio}
        anioAnterior={data.periodoAnterior.anio}
      />
    </PageShell>
  );
}
