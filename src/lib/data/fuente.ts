import { getBalanceMes, getCuentas1474PorCuenta, type BalanceApiRow } from "@/lib/reporting-api";

// Fuente de datos de los estados financieros. Antes cada módulo armaba un SELECT con
// "MAX(columna) FILTER (WHERE anio = … AND mes = … AND <where>)" sobre las tablas balance y
// cuentas_14_y_74 de Supabase. Ahora las filas vienen de la Reporting API y este módulo evalúa
// los mismos <where> y agregaciones en memoria, para que las fórmulas de cada estado no cambien.
//
// Los <where> de los módulos solo usan estas formas, unidas con "and":
//   col = 'valor'      col in ('a','b')      (col IS NULL OR col = '')
// Cualquier otra forma lanza un error en lugar de devolver una cifra equivocada.

export type Period = { anio: number; mes: number };

export type ColumnaBalance = "saldo_inicial" | "saldo_final" | "saldo_del_mes" | "debito" | "credito";
export type Agregacion = "MAX" | "SUM";

type Fila = Record<string, string | number | null>;
type Predicado = (fila: Fila) => boolean;

function filaBalance(r: BalanceApiRow): Fila {
  return {
    lvl1: r.lvl1,
    lvl2: r.lvl2,
    lvl3: r.lvl3,
    lvl4: r.lvl4,
    account: r.account,
    saldo_inicial: r.openingBalance,
    saldo_final: r.closingBalance,
    saldo_del_mes: r.monthBalance,
    debito: r.debit,
    credito: r.credit,
  };
}

const predicados = new Map<string, Predicado>();

function compilarWhere(where: string): Predicado {
  const existente = predicados.get(where);
  if (existente) return existente;

  const partes = where.trim().split(/\s+and\s+/i).map((parte) => {
    const p = parte.trim();
    let m = /^\(\s*(\w+)\s+IS\s+NULL\s+OR\s+\1\s*=\s*''\s*\)$/i.exec(p);
    if (m) {
      const col = m[1];
      return (f: Fila) => f[col] === null || f[col] === undefined || f[col] === "";
    }
    m = /^(\w+)\s*=\s*'([^']*)'$/.exec(p);
    if (m) {
      const [, col, valor] = m;
      return (f: Fila) => f[col] === valor;
    }
    m = /^(\w+)\s+in\s*\(([^)]*)\)$/i.exec(p);
    if (m) {
      const col = m[1];
      const valores = new Set(m[2].split(",").map((v) => v.trim().replace(/^'|'$/g, "")));
      return (f: Fila) => typeof f[col] === "string" && valores.has(f[col] as string);
    }
    throw new Error(`Filtro no soportado en la fuente de datos: ${p}`);
  });

  const predicado: Predicado = (f) => partes.every((cumple) => cumple(f));
  predicados.set(where, predicado);
  return predicado;
}

// Igual que MAX/SUM de SQL: sin filas que cumplan, el resultado es null (los módulos lo leen como 0).
function agregar(filas: Fila[], agg: Agregacion, columna: string, where: string): number | null {
  const cumple = compilarWhere(where);
  let resultado: number | null = null;
  for (const f of filas) {
    if (!cumple(f)) continue;
    const valor = Number(f[columna] ?? 0);
    if (resultado === null) resultado = valor;
    else resultado = agg === "MAX" ? Math.max(resultado, valor) : resultado + valor;
  }
  return resultado;
}

/* ───────────── Balance ───────────── */

export type FilasBalance = Fila[];

// Filas de un mes (todos los niveles).
export async function balanceDelMes({ anio, mes }: Period): Promise<FilasBalance> {
  const res = await getBalanceMes(anio, mes);
  return res.rows.map(filaBalance);
}

export function valorBalance(filas: FilasBalance, agg: Agregacion, columna: ColumnaBalance, where: string): number | null {
  return agregar(filas, agg, columna, where);
}

/* ───────────── Cuentas 14 y 74 ───────────── */

export type FilasCuentas = Fila[];

const pad = (n: number) => String(n).padStart(2, "0");
const ultimoDia = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();

// Totales por cuenta desde el mes `desdeMes` hasta el mes `p.mes` del año `p.anio`.
export async function cuentasDelPeriodo(p: Period, desdeMes = p.mes): Promise<FilasCuentas> {
  const desde = `${p.anio}-${pad(desdeMes)}-01`;
  const hasta = `${p.anio}-${pad(p.mes)}-${pad(ultimoDia(p.anio, p.mes))}`;
  const porCuenta = await getCuentas1474PorCuenta(desde, hasta);
  return porCuenta.map((c) => ({ cuenta_contable: c.account, saldo_mensual: c.balance }));
}

// Solo SUM(saldo_mensual), que es lo único que los módulos piden de esta tabla.
export function valorCuentas(filas: FilasCuentas, where: string): number | null {
  return agregar(filas, "SUM", "saldo_mensual", where);
}

/* ───────────── Periodos ───────────── */

// Meses con balance, del más reciente al más antiguo. La API los devuelve en cualquier consulta
// del balance; se pide el mes en curso (hora de Colombia), que siempre existe tras la carga de las 5:00.
export async function periodosDisponibles(): Promise<Period[]> {
  const hoy = new Date(Date.now() - 5 * 3_600_000);
  const res = await getBalanceMes(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1);
  return res.periods.map((p) => ({ anio: p.year, mes: p.month }));
}
