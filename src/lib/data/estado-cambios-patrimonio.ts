import { runManagementSql } from "@/lib/supabase/management";
import type { Period } from "./estado-costo-mensual";
import { getEstadoResultadosAcumulado } from "./estado-resultados-acumulado";

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

function buildEquitySql(aperturaAnio: number): string {
  return `
    SELECT
      MAX(saldo_final) FILTER (WHERE anio=${aperturaAnio} AND mes=12 AND lvl3='3105' AND ${BLANK("lvl4")})  AS s_3105,
      MAX(saldo_final) FILTER (WHERE anio=${aperturaAnio} AND mes=12 AND lvl2='32'  AND ${BLANK("lvl3")})  AS s_32,
      MAX(saldo_final) FILTER (WHERE anio=${aperturaAnio} AND mes=12 AND lvl3='3305' AND ${BLANK("lvl4")}) AS s_3305,
      MIN(saldo_final) FILTER (WHERE anio=${aperturaAnio} AND mes=12 AND lvl2='36'  AND ${BLANK("lvl3")})  AS s_36_min,
      MAX(saldo_final) FILTER (WHERE anio=${aperturaAnio} AND mes=12 AND lvl2='36'  AND ${BLANK("lvl3")})  AS s_36_max,
      MAX(saldo_final) FILTER (WHERE anio=${aperturaAnio} AND mes=12 AND lvl3='3705' AND ${BLANK("lvl4")}) AS s_37,
      MAX(saldo_final) FILTER (WHERE anio=${aperturaAnio} AND mes=12 AND lvl2='39'  AND ${BLANK("lvl3")})  AS s_39
    FROM "estados financieros".balance;
  `;
}

type Raw = Record<string, unknown>;

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

export async function getEstadoCambiosPatrimonio(cur: Period): Promise<EstadoCambiosPatrimonio> {
  const apertura: Period = { anio: cur.anio - 1, mes: 12 };

  // Run equity opening balances and P&L in parallel — they are independent queries
  const sql = buildEquitySql(apertura.anio);
  const [[row], pnl] = await Promise.all([
    runManagementSql<Raw>(sql),
    getEstadoResultadosAcumulado(cur),
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
