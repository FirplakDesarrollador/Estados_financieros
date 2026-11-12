import type { EstadoCambiosPatrimonio, ComponentePatrimonio } from "@/lib/data/estado-cambios-patrimonio";
import { formatMiles, nombreMes } from "@/lib/format";

function Pill({ children, negative, empty }: { children?: React.ReactNode; negative?: boolean; empty?: boolean }) {
  if (empty) return <div className="rounded-full border border-transparent px-4 py-2 text-right text-sm tabular-nums text-slate-300">—</div>;
  return (
    <div
      className={`rounded-full border px-4 py-2 text-right text-sm tabular-nums ${
        negative ? "border-red-200 text-red-600" : "border-slate-300 text-slate-800"
      }`}
    >
      {children}
    </div>
  );
}

function fmt(v: number) {
  return formatMiles(v);
}

function Cell({ v, destacado }: { v: number; destacado?: boolean }) {
  if (v === 0 && !destacado) return <Pill empty />;
  return <Pill negative={v < 0}>{fmt(v)}</Pill>;
}

const COLS: { key: keyof Omit<ComponentePatrimonio, "total">; label: string }[] = [
  { key: "capitalSocial",         label: "Capital social" },
  { key: "superavitCapital",      label: "Superávit de capital" },
  { key: "reservas",              label: "Reservas" },
  { key: "resultadosEjercicio",   label: "Resultados del ejercicio" },
  { key: "resultadosEjAnteriores",label: "Resultados de ejercicios anteriores" },
  { key: "utilidadesRetenidas",   label: "Utilidades retenidas en balance de apertura" },
];

export function EstadoCambiosPatrimonioTable({ data }: { data: EstadoCambiosPatrimonio }) {
  const { anio, mes } = data.periodo;
  const mesNombre = nombreMes(mes).toUpperCase();

  return (
    <div className="overflow-x-auto">
      <p className="mb-2 text-xs text-slate-400">
        (Cifras expresadas en miles de pesos colombianos)
      </p>
      <table className="w-full min-w-[1100px] border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="w-56 pb-3">Componente</th>
            {COLS.map((c) => (
              <th key={c.key} className="pb-3 pr-2 text-right leading-tight">
                {c.label}
              </th>
            ))}
            <th className="pb-3 pr-2 text-right font-bold">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.filas.map((fila) => (
            <tr key={fila.label} className={fila.destacado ? "font-semibold" : ""}>
              <td className="py-1 pr-3 text-sm text-slate-700">{fila.label}</td>
              {COLS.map((c) => (
                <td key={c.key} className="py-1 pr-2">
                  <Cell v={fila.valores[c.key]} destacado={fila.destacado} />
                </td>
              ))}
              <td className="py-1">
                <Pill negative={fila.valores.total < 0}>{fmt(fila.valores.total)}</Pill>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-right text-xs text-slate-400">
        Período: {mesNombre} {anio}
      </p>
    </div>
  );
}
