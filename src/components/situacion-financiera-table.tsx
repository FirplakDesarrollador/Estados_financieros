import type { FilaSF } from "@/lib/data/balance-general";
import { formatPorcentaje, nombreMes } from "@/lib/format";

// Valores en miles de pesos, sin símbolo (formato de estado financiero).
function miles(value: number): string {
  const scaled = Math.round(value / 1000);
  return (scaled === 0 ? 0 : scaled).toLocaleString("es-CO"); // evita "-0"
}

const VACIA: FilaSF = { label: "", actual: 0, anterior: 0, variacion: 0, porcentajeVariacion: null, tipo: "espacio" };

function visibles(filas: FilaSF[]): FilaSF[] {
  return filas.filter((f) => !(f.ocultarSiCero && f.actual === 0 && f.anterior === 0));
}

// Iguala el número de filas de ambos lados insertando espacios antes del gran total,
// para que TOTAL ACTIVOS y TOTAL DEL PASIVO + PATRIMONIO queden en la misma línea.
function igualar(filas: FilaSF[], largo: number): FilaSF[] {
  if (filas.length >= largo) return filas;
  const relleno = Array.from({ length: largo - filas.length }, () => VACIA);
  return [...filas.slice(0, -1), ...relleno, filas[filas.length - 1]];
}

function Celdas({ f, lado }: { f: FilaSF; lado: "izq" | "der" }) {
  const borde = lado === "der" ? "border-l-8 border-l-slate-50" : "";
  if (f.tipo === "espacio") {
    return (
      <>
        <td className={`h-3 ${borde}`} colSpan={1} />
        <td colSpan={5} />
      </>
    );
  }
  if (f.tipo === "seccion") {
    const principal = f.label === "ACTIVO" || f.label === "PASIVO" || f.label === "PATRIMONIO";
    return (
      <>
        <td className={borde} />
        <td colSpan={5} className={`py-1 text-xs font-bold text-slate-900 ${principal ? "underline underline-offset-2 tracking-widest" : ""}`}>
          {f.label}
        </td>
      </>
    );
  }

  const esTotal = f.tipo === "total" || f.tipo === "granTotal";
  const peso = f.tipo === "detalle" ? "text-slate-600" : "font-semibold text-slate-900";
  const fondo = f.tipo === "granTotal" ? "bg-slate-100" : esTotal ? "bg-slate-50" : "";
  const linea =
    f.tipo === "granTotal"
      ? "border-b-4 border-double border-slate-500"
      : f.tipo === "grupo" || f.tipo === "total"
        ? "border-b border-slate-200"
        : "";
  const num = (v: number) => (
    <span className={v < 0 ? "text-red-600" : ""}>{miles(v)}</span>
  );

  return (
    <>
      <td className={`py-1 pr-2 text-[11px] tabular-nums text-slate-400 ${borde} ${fondo}`}>{f.codigo}</td>
      <td className={`py-1 pr-3 text-xs ${peso} ${fondo} ${f.tipo === "detalle" ? "pl-2" : ""}`}>{f.label}</td>
      <td className={`py-1 pr-3 text-right text-xs tabular-nums ${peso} ${fondo} ${linea}`}>{num(f.actual)}</td>
      <td className={`py-1 pr-3 text-right text-xs tabular-nums ${peso} ${fondo} ${linea}`}>{num(f.anterior)}</td>
      <td className={`py-1 pr-3 text-right text-xs tabular-nums ${peso} ${fondo} ${linea}`}>{num(f.variacion)}</td>
      <td className={`py-1 pr-3 text-right text-[11px] tabular-nums ${peso} ${fondo} ${linea}`}>
        {f.porcentajeVariacion !== null && (
          <span className={f.porcentajeVariacion < 0 ? "text-red-600" : ""}>{formatPorcentaje(f.porcentajeVariacion)}</span>
        )}
      </td>
    </>
  );
}

function Encabezado({ mes, anioActual, anioAnterior, lado }: { mes: string; anioActual: number; anioAnterior: number; lado: "izq" | "der" }) {
  const borde = lado === "der" ? "border-l-8 border-l-slate-50" : "";
  return (
    <>
      <th className={`pb-2 ${borde}`} />
      <th className="pb-2 text-left text-xs font-bold text-slate-900">Al 31 de {mes}</th>
      <th className="pb-2 pr-3 text-right text-xs font-bold text-slate-900">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">{mes}</div>
        {anioActual}
      </th>
      <th className="pb-2 pr-3 text-right text-xs font-bold text-slate-900">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">{mes}</div>
        {anioAnterior}
      </th>
      <th className="pb-2 pr-3 text-right text-xs font-bold text-slate-900">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">Variación</div>$
      </th>
      <th className="pb-2 pr-3 text-right text-xs font-bold text-slate-900">
        <div className="text-[10px] uppercase tracking-wide text-slate-500">Variación</div>%
      </th>
    </>
  );
}

export function SituacionFinancieraTable({
  activos,
  pasivosPatrimonio,
  mes,
  anioActual,
  anioAnterior,
}: {
  activos: FilaSF[];
  pasivosPatrimonio: FilaSF[];
  mes: number;
  anioActual: number;
  anioAnterior: number;
}) {
  const izq0 = visibles(activos);
  const der0 = visibles(pasivosPatrimonio);
  const largo = Math.max(izq0.length, der0.length);
  const izq = igualar(izq0, largo);
  const der = igualar(der0, largo);
  const nombre = nombreMes(mes);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-[11px] text-slate-400">Cifras en miles de pesos</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="align-bottom">
              <Encabezado mes={nombre} anioActual={anioActual} anioAnterior={anioAnterior} lado="izq" />
              <Encabezado mes={nombre} anioActual={anioActual} anioAnterior={anioAnterior} lado="der" />
            </tr>
          </thead>
          <tbody>
            {izq.map((f, i) => (
              <tr key={i}>
                <Celdas f={f} lado="izq" />
                <Celdas f={der[i]} lado="der" />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
