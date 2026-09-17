import type { Period } from "@/lib/data/estado-costo-mensual";
import { nombreMes } from "@/lib/format";

export function PeriodoSelector({
  periodos,
  actual,
}: {
  periodos: Period[];
  actual: Period;
}) {
  const anios = Array.from(new Set(periodos.map((p) => p.anio))).sort((a, b) => b - a);
  const meses = periodos.filter((p) => p.anio === actual.anio).map((p) => p.mes);

  return (
    <form className="flex gap-3" method="GET">
      <select
        name="anio"
        defaultValue={actual.anio}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      >
        {anios.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>
      <select
        name="mes"
        defaultValue={actual.mes}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
      >
        {meses.map((m) => (
          <option key={m} value={m}>
            {nombreMes(m)}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Ver
      </button>
    </form>
  );
}
