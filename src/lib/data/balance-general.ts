import { runManagementSql } from "@/lib/supabase/management";
import type { Period } from "./estado-costo-mensual";

// Traducción de las medidas DAX de la tabla "Balance General" del modelo de Power BI
// (ver /powerbi-measures/Balance General.tmdl). Todas son lecturas directas de
// Balance[Saldo Final] filtradas por Lvl2/Lvl3/Lvl4/Account.
//
// La única medida que no se traduce 1:1 es "36-37 Utilidad o Perdida del Ejercicio",
// que en el modelo original viene del Estado de Resultados ([Acum Utilidad del
// Periodo]) — una cadena de ~15 medidas adicionales que no hemos traducido todavía.
// En su lugar la derivamos como la cifra que balancea el estado: en cualquier
// balance de prueba real, Utilidad del Ejercicio = Total Activos - Total Pasivos -
// (Capital Social + Reservas + Utilidades Acumuladas). Es el mismo resultado que
// obtendría el DAX si el balance efectivamente cuadra.

type RawSpec = { key: string; where: string };

const BLANK = (col: string) => `(${col} IS NULL OR ${col} = '')`;

const specs: RawSpec[] = [
  { key: "s_1105", where: `lvl3 = '1105' and ${BLANK("lvl4")}` },
  { key: "s_1110", where: `lvl3 = '1110' and ${BLANK("lvl4")}` },
  { key: "s_1245", where: `lvl3 = '1245' and ${BLANK("lvl4")}` },
  { key: "s_1225", where: `lvl3 = '1225' and ${BLANK("lvl4")}` },
  { key: "s_1295", where: `lvl3 = '1295' and ${BLANK("lvl4")}` },
  { key: "s_13050505", where: "account = '13050505'" },
  { key: "s_13051005", where: "account = '13051005'" },
  { key: "s_13051010", where: "account = '13051010'" },
  { key: "s_1355", where: `lvl3 = '1355' and ${BLANK("lvl4")}` },
  { key: "s_1365", where: `lvl3 = '1365' and ${BLANK("lvl4")}` },
  { key: "s_1380", where: `lvl3 = '1380' and ${BLANK("lvl4")}` },
  { key: "s_13050590", where: "account = '13050590'" },
  { key: "s_13051090", where: "account = '13051090'" },
  { key: "s_13990505", where: "account = '13990505'" },
  { key: "s_1405", where: `lvl3 = '1405' and ${BLANK("lvl4")}` },
  { key: "s_14050590", where: "account = '14050590'" },
  { key: "s_1410", where: `lvl3 = '1410' and ${BLANK("lvl4")}` },
  { key: "s_1430", where: `lvl3 = '1430' and ${BLANK("lvl4")}` },
  { key: "s_14300590", where: "account = '14300590'" },
  { key: "s_1435", where: `lvl3 = '1435' and ${BLANK("lvl4")}` },
  { key: "s_14350590", where: "account = '14350590'" },
  { key: "s_1465", where: `lvl3 = '1465' and ${BLANK("lvl4")}` },
  { key: "s_1705", where: `lvl3 = '1705' and ${BLANK("lvl4")}` },
  { key: "s_15", where: `lvl2 = '15' and ${BLANK("lvl3")}` },
  { key: "s_1330", where: `lvl3 = '1330' and ${BLANK("lvl4")}` },
  { key: "s_16", where: `lvl2 = '16' and ${BLANK("lvl3")}` },
  { key: "s_1710", where: `lvl3 = '1710' and ${BLANK("lvl4")}` },
  { key: "s_1325", where: `lvl3 = '1325' and ${BLANK("lvl4")}` },

  { key: "s_21", where: `lvl2 = '21' and ${BLANK("lvl3")}` },
  { key: "s_21051020", where: "account = '21051020'" },
  { key: "s_21150505", where: "account = '21150505'" },
  { key: "s_2195", where: `lvl3 = '2195' and ${BLANK("lvl4")}` },
  { key: "s_2205", where: `lvl3 = '2205' and ${BLANK("lvl4")}` },
  { key: "s_2210", where: `lvl3 = '2210' and ${BLANK("lvl4")}` },
  { key: "s_2335", where: `lvl3 = '2335' and ${BLANK("lvl4")}` },
  { key: "s_2355", where: `lvl3 = '2355' and ${BLANK("lvl4")}` },
  { key: "s_2360", where: `lvl3 = '2360' and ${BLANK("lvl4")}` },
  { key: "s_2365", where: `lvl3 = '2365' and ${BLANK("lvl4")}` },
  { key: "s_2367", where: `lvl3 = '2367' and ${BLANK("lvl4")}` },
  { key: "s_2368", where: `lvl3 = '2368' and ${BLANK("lvl4")}` },
  { key: "s_2370", where: `lvl3 = '2370' and ${BLANK("lvl4")}` },
  { key: "s_2380", where: `lvl3 = '2380' and ${BLANK("lvl4")}` },
  { key: "s_2408", where: `lvl3 = '2408' and ${BLANK("lvl4")}` },
  { key: "s_240405", where: `lvl4 = '240405' and ${BLANK("account")}` },
  { key: "s_25", where: `lvl2 = '25' and ${BLANK("lvl3")}` },
  { key: "s_2610", where: `lvl3 = '2610' and ${BLANK("lvl4")}` },
  { key: "s_2605", where: `lvl3 = '2605' and ${BLANK("lvl4")}` },
  { key: "s_2805", where: `lvl3 = '2805' and ${BLANK("lvl4")}` },
  { key: "s_27", where: `lvl2 = '27' and ${BLANK("lvl3")}` },

  { key: "s_3105", where: `lvl3 = '3105' and ${BLANK("lvl4")}` },
  { key: "s_3305", where: `lvl3 = '3305' and ${BLANK("lvl4")}` },
  { key: "s_36", where: `lvl2 = '36' and ${BLANK("lvl3")}` },
  { key: "s_37", where: `lvl2 = '37' and ${BLANK("lvl3")}` },
  { key: "s_39", where: `lvl2 = '39' and ${BLANK("lvl3")}` },
];

function buildSql(cur: Period, prevYear: Period): string {
  const cols = specs
    .map(
      (s) =>
        `MAX(saldo_final) FILTER (WHERE anio = ${cur.anio} AND mes = ${cur.mes} AND ${s.where}) AS ${s.key}_cur,\n` +
        `MAX(saldo_final) FILTER (WHERE anio = ${prevYear.anio} AND mes = ${prevYear.mes} AND ${s.where}) AS ${s.key}_prev`,
    )
    .join(",\n");
  return `SELECT\n${cols}\nFROM "estados financieros".balance;`;
}

type Raw = Record<string, number>;

function n(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

function computeFrom(row: Raw, suffix: "cur" | "prev", mes: number) {
  const g = (key: string) => n(row[`${key}_${suffix}`]);

  const efectivo = g("s_1105") + g("s_1110") + g("s_1245") + g("s_1225") + g("s_1295");
  const clientesNacionales = g("s_13050505");
  const clientesExterior = g("s_13051005") + g("s_13051010");
  const deterioroCartera = g("s_13050590") + g("s_13051090") + g("s_13990505");
  const activosFinancieros = clientesNacionales + clientesExterior + g("s_1355") + g("s_1365") + g("s_1380") + deterioroCartera;
  const materiasPrimas = g("s_1405") - g("s_14050590");
  const productoProceso = g("s_1410");
  const productosTerminados = g("s_1430") - g("s_14300590");
  const merciasNoFabricadas = g("s_1435") - g("s_14350590");
  const inventarioTransito = g("s_1465");
  const deterioroInventarios = g("s_14050590") + g("s_14300590") + g("s_14350590");
  const inventarios = materiasPrimas + productoProceso + productosTerminados + merciasNoFabricadas + inventarioTransito + deterioroInventarios;
  const gastosPagadosAnticipado = g("s_1705");
  const totalActivoCorriente = efectivo + activosFinancieros + inventarios + gastosPagadosAnticipado;

  const ppe = g("s_15");
  const otrosActivos = g("s_1330") + (g("s_16") + g("s_1710")) + g("s_1325");
  const totalActivos = totalActivoCorriente + ppe + otrosActivos;

  const obligacionesFinancieras = (g("s_21") - g("s_21051020") - g("s_21150505")) * -1;
  const obligacionesForward = g("s_2195");
  const proveedoresNacionales = g("s_2205") * -1;
  const proveedoresExterior = g("s_2210") * -1;
  const costosGastosPorPagar = g("s_2335") * -1;
  const deudaSocios = g("s_2355") * -1;
  const dividendos = g("s_2360") * -1;
  const retencionFuente = g("s_2365") * -1;
  const retencionIva = g("s_2367") * -1;
  const retencionIca = g("s_2368") * -1;
  const retencionesNomina = (g("s_2370") + g("s_2380")) * -1;
  const impuestoVentasPorPagar = g("s_2408") * -1;
  const impuestoRenta = mes === 12 ? 0 : g("s_240405") * -1;
  const obligacionesLaborales = g("s_25") * -1;
  const pasivosEstimadosLaborales = g("s_2610") * -1;
  const pasivosEstimadosDiversos = g("s_2605") * -1;
  const anticiposAvances = g("s_2805") * -1;
  const totalPasivoCorriente =
    obligacionesFinancieras +
    obligacionesForward +
    proveedoresNacionales +
    proveedoresExterior +
    costosGastosPorPagar +
    deudaSocios +
    dividendos +
    retencionFuente +
    retencionIva +
    retencionIca +
    retencionesNomina +
    impuestoVentasPorPagar +
    impuestoRenta +
    obligacionesLaborales +
    pasivosEstimadosLaborales +
    pasivosEstimadosDiversos +
    anticiposAvances;

  const obligacionesFinancierasLargoPlazo = g("s_21051020") * -1;
  const leasingInmobiliario = g("s_21150505") * -1;
  const pasivoImpuestoDiferido = g("s_27") * -1;
  const totalPasivoNoCorriente = obligacionesFinancierasLargoPlazo + leasingInmobiliario + pasivoImpuestoDiferido;

  const totalPasivos = totalPasivoCorriente + totalPasivoNoCorriente;

  const capitalSocial = g("s_3105") * -1;
  const reservasObligatorias = g("s_3305") * -1;
  const utilidadesAcumuladas = (g("s_36") + g("s_37") + g("s_39")) * -1;
  // Utilidad del ejercicio derivada como cifra que balancea el estado (ver nota arriba).
  const utilidadEjercicio = totalActivos - totalPasivos - capitalSocial - reservasObligatorias - utilidadesAcumuladas;
  const totalPatrimonio = capitalSocial + reservasObligatorias + utilidadEjercicio + utilidadesAcumuladas;

  return {
    efectivo,
    activosFinancieros,
    inventarios,
    gastosPagadosAnticipado,
    totalActivoCorriente,
    ppe,
    otrosActivos,
    totalActivos,
    totalPasivoCorriente,
    totalPasivoNoCorriente,
    totalPasivos,
    capitalSocial,
    reservasObligatorias,
    utilidadEjercicio,
    utilidadesAcumuladas,
    totalPatrimonio,
  };
}

export type FilaBalance = {
  label: string;
  actual: number;
  anterior: number;
  variacion: number;
  porcentajeVariacion: number | null;
  destacado?: boolean;
};

export type BalanceGeneral = {
  periodoActual: Period;
  periodoAnterior: Period;
  activos: FilaBalance[];
  pasivosPatrimonio: FilaBalance[];
};

function divide(a: number, b: number): number | null {
  return b === 0 ? null : a / b;
}

function fila(label: string, actual: number, anterior: number, destacado?: boolean): FilaBalance {
  const variacion = actual - anterior;
  return { label, actual, anterior, variacion, porcentajeVariacion: divide(variacion, anterior), destacado };
}

export async function getBalanceGeneral(cur: Period): Promise<BalanceGeneral> {
  const prevYear: Period = { anio: cur.anio - 1, mes: cur.mes };
  const sql = buildSql(cur, prevYear);
  const [row] = await runManagementSql<Raw>(sql);

  const actual = computeFrom(row, "cur", cur.mes);
  const anterior = computeFrom(row, "prev", prevYear.mes);

  const activos: FilaBalance[] = [
    fila("Efectivo y Equivalentes", actual.efectivo, anterior.efectivo),
    fila("Activos Financieros", actual.activosFinancieros, anterior.activosFinancieros),
    fila("Inventarios", actual.inventarios, anterior.inventarios),
    fila("Gastos Pagados por Anticipado", actual.gastosPagadosAnticipado, anterior.gastosPagadosAnticipado),
    fila("Total Activo Corriente", actual.totalActivoCorriente, anterior.totalActivoCorriente, true),
    fila("Propiedad, Planta y Equipo", actual.ppe, anterior.ppe),
    fila("Otros Activos", actual.otrosActivos, anterior.otrosActivos),
    fila("Total Activos", actual.totalActivos, anterior.totalActivos, true),
  ];

  const pasivosPatrimonio: FilaBalance[] = [
    fila("Total Pasivo Corriente", actual.totalPasivoCorriente, anterior.totalPasivoCorriente, true),
    fila("Total Pasivo No Corriente", actual.totalPasivoNoCorriente, anterior.totalPasivoNoCorriente, true),
    fila("Total Pasivos", actual.totalPasivos, anterior.totalPasivos, true),
    fila("Capital Social", actual.capitalSocial, anterior.capitalSocial),
    fila("Reservas Obligatorias", actual.reservasObligatorias, anterior.reservasObligatorias),
    fila("Utilidad del Ejercicio", actual.utilidadEjercicio, anterior.utilidadEjercicio),
    fila("Utilidades Acumuladas", actual.utilidadesAcumuladas, anterior.utilidadesAcumuladas),
    fila("Total Patrimonio", actual.totalPatrimonio, anterior.totalPatrimonio, true),
    fila("Total Pasivo + Patrimonio", actual.totalPasivos + actual.totalPatrimonio, anterior.totalPasivos + anterior.totalPatrimonio, true),
  ];

  return { periodoActual: cur, periodoAnterior: prevYear, activos, pasivosPatrimonio };
}
