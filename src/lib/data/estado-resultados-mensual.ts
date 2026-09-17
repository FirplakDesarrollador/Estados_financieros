import { runManagementSql } from "@/lib/supabase/management";
import type { Period } from "./estado-costo-mensual";

// Traducción de las medidas DAX de la tabla "Medidas Resultado" del modelo de
// Power BI, para el Estado de Resultados Mensual (comparativo contra el mes
// anterior, igual que el Estado del Costo Mensual). Todas son lecturas directas
// de Balance[Saldo del Mes] filtradas por Lvl2/Lvl3/Lvl4/Account.

type RawSpec = { key: string; where: string };

const BLANK = (col: string) => `(${col} IS NULL OR ${col} = '')`;

const specs: RawSpec[] = [
  // Ventas Netas
  { key: "s_41203205", where: "account = '41203205'" },
  { key: "s_41209505", where: "account = '41209505'" },
  { key: "s_41209510", where: "account = '41209510'" },
  { key: "s_41359505", where: "account = '41359505'" },
  { key: "s_41209520", where: "account = '41209520'" },
  { key: "s_41203215", where: "account = '41203215'" },
  { key: "s_41209515", where: "account = '41209515'" },
  { key: "s_41359515", where: "account = '41359515'" },
  { key: "s_42050510", where: "account = '42050510'" },
  { key: "s_42050520", where: "account = '42050520'" },
  { key: "s_42356505", where: "account = '42356505'" },
  { key: "s_42050505", where: "account = '42050505'" },
  { key: "s_42050515", where: "account = '42050515'" },
  { key: "s_42054505", where: "account = '42054505'" },
  { key: "s_4175", where: `lvl3 = '4175' and ${BLANK("lvl4")}` },
  { key: "s_4275", where: `lvl3 = '4275' and ${BLANK("lvl4")}` },
  { key: "s_42750510", where: "account = '42750510'" },
  { key: "s_42750520", where: "account = '42750520'" },
  { key: "s_53053505", where: "account = '53053505'" },

  // Costo de Ventas
  { key: "s_61", where: `lvl2 = '61' and ${BLANK("lvl3")}` },
  { key: "s_42104005", where: "account = '42104005'" },

  // Gastos Operativos
  { key: "s_51", where: `lvl2 = '51' and ${BLANK("lvl3")}` },
  { key: "s_5199", where: `lvl3 = '5199' and ${BLANK("lvl4")}` },
  { key: "s_52", where: `lvl2 = '52' and ${BLANK("lvl3")}` },
  { key: "s_52991090", where: "account = '52991090'" },
  { key: "s_51159510", where: "account = '51159510'" },
  { key: "s_51159515", where: "account = '51159515'" },

  // Ingresos No Operativos
  { key: "s_421005", where: `lvl4 = '421005' and ${BLANK("account")}` },
  { key: "s_421020", where: `lvl4 = '421020' and ${BLANK("account")}` },
  { key: "s_421095", where: `lvl4 = '421095' and ${BLANK("account")}` },
  { key: "s_4220", where: `lvl3 = '4220' and ${BLANK("lvl4")}` },
  { key: "s_4225", where: `lvl3 = '4225' and ${BLANK("lvl4")}` },
  { key: "s_423580", where: `lvl4 = '423580' and ${BLANK("account")}` },
  { key: "s_4245", where: `lvl3 = '4245' and ${BLANK("lvl4")}` },
  { key: "s_4250", where: `lvl3 = '4250' and ${BLANK("lvl4")}` },
  { key: "s_4255", where: `lvl3 = '4255' and ${BLANK("lvl4")}` },
  { key: "s_4265", where: `lvl3 = '4265' and ${BLANK("lvl4")}` },
  { key: "s_4295", where: `lvl3 = '4295' and ${BLANK("lvl4")}` },

  // Gastos No Operativos
  { key: "s_53050505", where: "account = '53050505'" },
  { key: "s_53051505", where: "account = '53051505'" },
  { key: "s_530520", where: `lvl4 = '530520' and ${BLANK("account")}` },
  { key: "s_530525", where: `lvl4 = '530525' and ${BLANK("account")}` },
  { key: "s_530595", where: `lvl4 = '530595' and ${BLANK("account")}` },
  { key: "s_5310", where: `lvl3 = '5310' and ${BLANK("lvl4")}` },
  { key: "s_5315", where: `lvl3 = '5315' and ${BLANK("lvl4")}` },
  { key: "s_5395", where: `lvl3 = '5395' and ${BLANK("lvl4")}` },
  { key: "s_5299", where: `lvl3 = '5299' and ${BLANK("lvl4")}` },

  // Provisión Impuesto de Renta
  { key: "s_54", where: `lvl2 = '54' and ${BLANK("lvl3")}` },
];

function prevMonth({ anio, mes }: Period): Period {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

function buildSql(cur: Period, prev: Period): string {
  const cols = specs
    .map(
      (s) =>
        `MAX(saldo_del_mes) FILTER (WHERE anio = ${cur.anio} AND mes = ${cur.mes} AND ${s.where}) AS ${s.key}_cur,\n` +
        `MAX(saldo_del_mes) FILTER (WHERE anio = ${prev.anio} AND mes = ${prev.mes} AND ${s.where}) AS ${s.key}_prev`,
    )
    .join(",\n");
  return `SELECT\n${cols}\nFROM "estados financieros".balance;`;
}

type Raw = Record<string, number>;

function n(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

function computeFrom(row: Raw, suffix: "cur" | "prev") {
  const g = (key: string) => n(row[`${key}_${suffix}`]);

  const ventasNacionales = (g("s_41203205") + g("s_41209505") + g("s_41209510") + g("s_41359505") + g("s_41209520")) * -1;
  const ventasExportaciones = (g("s_41203215") + g("s_41209515") + g("s_41359515") + g("s_42050510") + g("s_42050520")) * -1;
  const ventasServicios = g("s_42356505") * -1;
  const ventasMP = (g("s_42050505") + g("s_42050515") + g("s_42054505")) * -1;
  const devolucionesVentas = (g("s_4175") + g("s_4275") - (g("s_42750510") - g("s_42750520"))) * -1;
  const ventasDescuentosFinancieros = g("s_53053505") * -1;
  const totalVentasNetas =
    ventasNacionales + ventasExportaciones + ventasServicios + ventasMP + devolucionesVentas + ventasDescuentosFinancieros;

  const costosProductosVendidos = g("s_61");
  const descuentosFinancierosAprovechados = g("s_42104005");
  const totalCostoVentas = costosProductosVendidos + descuentosFinancierosAprovechados;

  const utilidadBrutaVentas = totalVentasNetas - totalCostoVentas;

  const contribucion4x1000 = g("s_51159510") + g("s_51159515");
  const gastosAdministracion = g("s_51") - contribucion4x1000 - g("s_5199");
  const gastosVentas = g("s_52") - g("s_52991090");
  const gastosOperativos = gastosAdministracion + gastosVentas;

  const utilidadOperacional = utilidadBrutaVentas - gastosOperativos;

  const ingresosNoOperativos =
    g("s_421005") * -1 +
    g("s_421020") * -1 +
    g("s_421095") * -1 +
    g("s_4220") * -1 +
    g("s_4225") * -1 +
    (g("s_423580") * -1 - g("s_42750510") - g("s_42750520")) +
    g("s_4245") * -1 +
    g("s_4250") * -1 +
    g("s_4255") * -1 +
    g("s_4265") * -1 +
    g("s_4295") * -1;

  const gastosNoOperativos =
    g("s_53050505") +
    g("s_53051505") +
    g("s_530520") +
    g("s_530525") +
    g("s_530595") +
    g("s_5310") +
    contribucion4x1000 +
    g("s_5315") +
    g("s_5395") +
    (g("s_5199") + g("s_5299"));

  const utilidadAntesImpuestos = utilidadOperacional - gastosNoOperativos + ingresosNoOperativos;
  const provisionImpuestoRenta = g("s_54");
  const utilidadPeriodo = utilidadAntesImpuestos - provisionImpuestoRenta;

  return {
    totalVentasNetas,
    totalCostoVentas,
    utilidadBrutaVentas,
    gastosOperativos,
    utilidadOperacional,
    ingresosNoOperativos,
    gastosNoOperativos,
    utilidadAntesImpuestos,
    provisionImpuestoRenta,
    utilidadPeriodo,
  };
}

export type FilaResultado = {
  label: string;
  actual: number;
  mesAnterior: number;
  variacion: number;
  porcentajeVariacion: number | null;
  destacado?: boolean;
};

export type EstadoResultadosMensual = {
  periodoActual: Period;
  periodoAnterior: Period;
  filas: FilaResultado[];
};

function divide(a: number, b: number): number | null {
  return b === 0 ? null : a / b;
}

function fila(label: string, actual: number, mesAnterior: number, destacado?: boolean): FilaResultado {
  const variacion = actual - mesAnterior;
  return { label, actual, mesAnterior, variacion, porcentajeVariacion: divide(variacion, mesAnterior), destacado };
}

export async function getEstadoResultadosMensual(cur: Period): Promise<EstadoResultadosMensual> {
  const prev = prevMonth(cur);
  const sql = buildSql(cur, prev);
  const [row] = await runManagementSql<Raw>(sql);

  const actual = computeFrom(row, "cur");
  const anterior = computeFrom(row, "prev");

  const filas: FilaResultado[] = [
    fila("Ventas Netas", actual.totalVentasNetas, anterior.totalVentasNetas),
    fila("Costo de Ventas", actual.totalCostoVentas, anterior.totalCostoVentas),
    fila("Utilidad Bruta en Ventas", actual.utilidadBrutaVentas, anterior.utilidadBrutaVentas, true),
    fila("Gastos Operativos", actual.gastosOperativos, anterior.gastosOperativos),
    fila("Utilidad Operacional", actual.utilidadOperacional, anterior.utilidadOperacional, true),
    fila("Ingresos No Operativos", actual.ingresosNoOperativos, anterior.ingresosNoOperativos),
    fila("Gastos No Operativos", actual.gastosNoOperativos, anterior.gastosNoOperativos),
    fila("Utilidad Antes de Impuesto", actual.utilidadAntesImpuestos, anterior.utilidadAntesImpuestos, true),
    fila("Provisión Impuesto de Renta", actual.provisionImpuestoRenta, anterior.provisionImpuestoRenta),
    fila("Utilidad del Periodo", actual.utilidadPeriodo, anterior.utilidadPeriodo, true),
  ];

  return { periodoActual: cur, periodoAnterior: prev, filas };
}
