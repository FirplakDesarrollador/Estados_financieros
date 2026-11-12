import { getBalanceGeneral } from "@/lib/data/balance-general";
import { getPeriodosDisponibles } from "@/lib/data/estado-costo-mensual";
import { BalanceGeneralTable } from "@/components/balance-general-table";
import { PageShell } from "@/components/page-shell";

export default async function BalancePasivosPage({
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
    ? getBalanceGeneral(paramsActual)
    : periodosPromise.then((p) => getBalanceGeneral(p[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 }));

  const [periodos, data] = await Promise.all([periodosPromise, dataPromise]);
  const actual = paramsActual ?? periodos[0] ?? { anio: now.getFullYear(), mes: now.getMonth() + 1 };

  return (
    <PageShell
      current="/balance-pasivos"
      titulo="Balance General — Pasivos y Patrimonio"
      subtitulo={`Comparativo contra ${data.periodoAnterior.anio}`}
      periodos={periodos}
      actual={actual}
    >
      <BalanceGeneralTable
        title="Pasivos y Patrimonio"
        filas={data.pasivosPatrimonio}
        anioActual={data.periodoActual.anio}
        anioAnterior={data.periodoAnterior.anio}
      />
    </PageShell>
  );
}
