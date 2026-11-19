import type { Period } from "./estado-costo-mensual";
import { getEstadoResultadosAcumulado } from "./estado-resultados-acumulado";
import { EMPRESA_SINGLE_IDS, isConsolidado, DEFAULT_EMPRESA, type EmpresaId } from "@/lib/companies";
import { balanceDelMes, valorBalance, type Agregacion } from "./fuente";

// Estado de Cambios en el Patrimonio
// Columnas: Capital Social | Superávit Capital | Reservas | Resultados Ejercicio |
//           Resultados Ejercicios Anteriores | Utilidades Retenidas Apertura | Total
//
// Filas:
//   1. Saldo Inicial (01/01/anio) = saldo_final at (anio-1, 12)
//   2. Utilidades del periodo = YTD net income from P&L acumulado
//   3. Distribución de dividendos = 0 (not yet tracked in DB)
//   4. Saldo Cierre = opening + movements

const BLANK = (col: string) => `(${col} IS NULL OR ${col} = '')`;

// Saldos finales de diciembre del año de apertura.
const equitySpecs: Array<{ key: string; agg: Agregacion; where: string }> = [
  { key: "s_3105", agg: "MAX", where: `lvl3 = '3105' and ${BLANK("lvl4")}` },
  { key: "s_32", agg: "MAX", where: `lvl2 = '32' and ${BLANK("lvl3")}` },
  { key: "s_3305", agg: "MAX", where: `lvl3 = '3305' and ${BLANK("lvl4")}` },
  // MIN − MAX de la clase 36: tomaba la diferencia entre las dos copias de 36050590 que tenía la tabla
  // de Supabase en 2024. La fuente actual tiene una fila por cuenta, así que da 0 (como ya pasaba en
  // Supabase para diciembre 2025).
  { key: "s_36_min", agg: "MIN", where: `lvl2 = '36' and ${BLANK("lvl3")}` },
  { key: "s_36_max", agg: "MAX", where: `lvl2 = '36' and ${BLANK("lvl3")}` },
  { key: "s_37", agg: "MAX", where: `lvl3 = '3705' and ${BLANK("lvl4")}` },
  { key: "s_39", agg: "MAX", where: `lvl2 = '39' and ${BLANK("lvl3")}` },
];

type Raw = Record<string, number | null>;

async function cargarApertura(apertura: Period, empresa: EmpresaId): Promise<Raw> {
  const filas = await balanceDelMes(apertura, empresa);
  const row: Raw = {};
  for (const s of equitySpecs) row[s.key] = valorBalance(filas, s.agg, "saldo_final", s.where);
  return row;
}

function n(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

export type ComponentePatrimonio = {
  capitalSocial: number;
  superavitCapital: number;
  reservas: number;
  resultadosEjercicio: number;
  resultadosEjAnteriores: number;
  utilidadesRetenidas: number;
  total: number;
};

export type FilaCambioPatrimonio = {
  label: string;
  valores: ComponentePatrimonio;
  destacado?: boolean;
};

export type EstadoCambiosPatrimonio = {
  periodo: Period;
  apertura: Period;
  filas: FilaCambioPatrimonio[];
};

function comp(
  capitalSocial: number,
  superavitCapital: number,
  reservas: number,
  resultadosEjercicio: number,
  resultadosEjAnteriores: number,
  utilidadesRetenidas: number,
): ComponentePatrimonio {
  const total = capitalSocial + superavitCapital + reservas + resultadosEjercicio + resultadosEjAnteriores + utilidadesRetenidas;
  return { capitalSocial, superavitCapital, reservas, resultadosEjercicio, resultadosEjAnteriores, utilidadesRetenidas, total };
}

function fila(label: string, valores: ComponentePatrimonio, destacado?: boolean): FilaCambioPatrimonio {
  return { label, valores, destacado };
}

function mergePatrimonio(a: EstadoCambiosPatrimonio, b: EstadoCambiosPatrimonio): EstadoCambiosPatrimonio {
  const sumComp = (va: ComponentePatrimonio, vb: ComponentePatrimonio): ComponentePatrimonio => ({
    capitalSocial: va.capitalSocial + vb.capitalSocial,
    superavitCapital: va.superavitCapital + vb.superavitCapital,
    reservas: va.reservas + vb.reservas,
    resultadosEjercicio: va.resultadosEjercicio + vb.resultadosEjercicio,
    resultadosEjAnteriores: va.resultadosEjAnteriores + vb.resultadosEjAnteriores,
    utilidadesRetenidas: va.utilidadesRetenidas + vb.utilidadesRetenidas,
    total: va.total + vb.total,
  });
  return {
    periodo: a.periodo,
    apertura: a.apertura,
    filas: a.filas.map((fa, i) => ({ ...fa, valores: sumComp(fa.valores, b.filas[i].valores) })),
  };
}

export async function getEstadoCambiosPatrimonio(cur: Period, empresa: EmpresaId = DEFAULT_EMPRESA): Promise<EstadoCambiosPatrimonio> {
  if (isConsolidado(empresa)) {
    const results = await Promise.all(EMPRESA_SINGLE_IDS.map((id) => getEstadoCambiosPatrimonio(cur, id)));
    return results.reduce(mergePatrimonio);
  }

  const apertura: Period = { anio: cur.anio - 1, mes: 12 };

  // Run equity opening balances and P&L in parallel — they are independent queries
  const [row, pnl] = await Promise.all([
    cargarApertura(apertura, empresa),
    getEstadoResultadosAcumulado(cur, empresa),
  ]);

  const g = (key: string) => n(row[key]);

  // Credit accounts → × -1 to show as positive
  const capitalSocial_open   = g("s_3105") * -1;
  const superavit_open       = g("s_32")   * -1;
  const reservas_open        = g("s_3305") * -1;
  const utRet_open           = g("s_39")   * -1;
  // s_3705 total = 36 + 37 + 39; s_36 = MIN(rollup36) − MAX(rollup36) captures both entries of
  // account 36050590 (which has two values in DB). ejAnt = s_3705 − utRet = 36 + 37.
  const s36                  = g("s_36_min") - g("s_36_max");
  const ejAnt_open           = (s36 + g("s_37")) * -1;
  const utilidadPeriodo = pnl.filas.find((f) => f.label === "Utilidad del Periodo")?.actual ?? 0;

  // 3. Build rows
  const saldoInicial = comp(capitalSocial_open, superavit_open, reservas_open, 0, ejAnt_open, utRet_open);

  const movUtilidades = comp(0, 0, 0, utilidadPeriodo, 0, 0);

  const movDividendos = comp(0, 0, 0, 0, 0, 0);

  const saldoCierre = comp(
    capitalSocial_open,
    superavit_open,
    reservas_open,
    utilidadPeriodo,
    ejAnt_open,
    utRet_open,
  );

  const filas: FilaCambioPatrimonio[] = [
    fila(`Saldo Inicial 01/01/${cur.anio}`, saldoInicial, true),
    fila(`Utilidades ${cur.anio}`, movUtilidades),
    fila("Distribución de dividendos", movDividendos),
    fila(`Saldo al cierre del periodo`, saldoCierre, true),
  ];

  return { periodo: cur, apertura, filas };
}
