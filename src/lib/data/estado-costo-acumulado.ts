import { runManagementSql } from "@/lib/supabase/management";
import type { Period } from "./estado-costo-mensual";

// Traducción de las medidas "Acum ..." de la tabla "Medidas Estado Costo" del
// modelo de Power BI, para el Estado del Costo Acumulado. A diferencia del
// Estado del Costo Mensual (que compara contra el mes anterior), este compara
// el acumulado del año contra el acumulado del mismo periodo del año anterior
// (SAMEPERIODLASTYEAR en el DAX original).
//
// Los rubros "Inicial" (inventarios) toman el Saldo Inicial de enero del año en
// curso. Casi todo lo demás (CIF, M.O.D., retiros, traslados, inventarios
// finales, TOTAL REAL, Total Ventas) se lee directo de Balance[Saldo Final] del
// mes seleccionado — porque el saldo final YA es acumulado por naturaleza, no
// hace falta sumarlo mes a mes. Solo las compras/consumos de Cuentas 14 y 74
// (Compras MP, SS a la MP, Compras Comercializado) son flujos reales que sí se
// suman desde enero hasta el mes seleccionado.

type Mode = "exact" | "jan";

type BalanceSpec = { key: string; mode: Mode; agg: "MAX" | "SUM"; where: string };

const BLANK = (col: string) => `(${col} IS NULL OR ${col} = '')`;

const balanceSpecs: BalanceSpec[] = [
  // Inv Inicial (enero del año)
  { key: "si_1405_jan", mode: "jan", agg: "MAX", where: "lvl3 = '1405'" },
  { key: "si_14050575_jan", mode: "jan", agg: "MAX", where: "account = '14050575'" },
  { key: "si_14050595_jan", mode: "jan", agg: "MAX", where: "account = '14050595'" },
  { key: "si_1435_jan", mode: "jan", agg: "MAX", where: "lvl3 = '1435'" },
  { key: "si_1410_blank_jan", mode: "jan", agg: "MAX", where: `lvl3 = '1410' and ${BLANK("lvl4")}` },
  { key: "si_1430_blank_jan", mode: "jan", agg: "MAX", where: `lvl3 = '1430' and ${BLANK("lvl4")}` },

  // Inv Final / retiros / MOD / CIF (saldo final del mes seleccionado)
  { key: "sf_1405", mode: "exact", agg: "MAX", where: "lvl3 = '1405'" },
  { key: "sf_14050575", mode: "exact", agg: "MAX", where: "account = '14050575'" },
  { key: "sf_14050595", mode: "exact", agg: "MAX", where: "account = '14050595'" },
  { key: "sf_1435", mode: "exact", agg: "MAX", where: "lvl3 = '1435'" },
  { key: "sf_73959510", mode: "exact", agg: "MAX", where: "account = '73959510'" },
  { key: "sf_73959535", mode: "exact", agg: "MAX", where: "account = '73959535'" },
  { key: "sf_mo_vinc", mode: "exact", agg: "SUM", where: "account in ('72059585','72059595','72059590')" },
  { key: "sf_72359595", mode: "exact", agg: "MAX", where: "account = '72359595'" },
  { key: "sf_73059595", mode: "exact", agg: "MAX", where: "account = '73059595'" },
  { key: "sf_7310", mode: "exact", agg: "MAX", where: "lvl3 = '7310'" },
  { key: "sf_7315", mode: "exact", agg: "MAX", where: "lvl3 = '7315'" },
  { key: "sf_7320", mode: "exact", agg: "MAX", where: "lvl3 = '7320'" },
  { key: "sf_7335", mode: "exact", agg: "MAX", where: "lvl3 = '7335'" },
  { key: "sf_7345", mode: "exact", agg: "MAX", where: "lvl3 = '7345'" },
  { key: "sf_7350", mode: "exact", agg: "MAX", where: "lvl3 = '7350'" },
  { key: "sf_7360", mode: "exact", agg: "MAX", where: "lvl3 = '7360'" },
  { key: "sf_7395_blank", mode: "exact", agg: "MAX", where: `lvl3 = '7395' and ${BLANK("lvl4")}` },
  { key: "sf_73959585", mode: "exact", agg: "MAX", where: "account = '73959585'" },
  { key: "sf_73959595b", mode: "exact", agg: "MAX", where: "account = '73959595'" },
  { key: "sf_73959580", mode: "exact", agg: "MAX", where: "account = '73959580'" },
  { key: "sf_73959540", mode: "exact", agg: "MAX", where: "account = '73959540'" },
  { key: "sf_73959545", mode: "exact", agg: "MAX", where: "account = '73959545'" },
  { key: "sf_7355", mode: "exact", agg: "MAX", where: "lvl3 = '7355'" },
  { key: "sf_1410_blank", mode: "exact", agg: "MAX", where: `lvl3 = '1410' and ${BLANK("lvl4")}` },
  { key: "sf_1430_blank", mode: "exact", agg: "MAX", where: `lvl3 = '1430' and ${BLANK("lvl4")}` },
  { key: "sf_52959515", mode: "exact", agg: "MAX", where: "account = '52959515'" },
  { key: "sf_52059595", mode: "exact", agg: "MAX", where: "account = '52059595'" },
  { key: "sf_52351595", mode: "exact", agg: "MAX", where: "account = '52351595'" },
  { key: "sf_52954595", mode: "exact", agg: "MAX", where: "account = '52954595'" },
  { key: "sf_61_lvl4_blank", mode: "exact", agg: "MAX", where: `lvl2 = '61' and ${BLANK("lvl4")}` },
  { key: "sf_61_lvl3_blank", mode: "exact", agg: "MAX", where: `lvl2 = '61' and ${BLANK("lvl3")}` },
  { key: "sf_42104005", mode: "exact", agg: "MAX", where: "account = '42104005'" },

  // Total Ventas (saldo final del mes seleccionado)
  { key: "sf_41_blank", mode: "exact", agg: "MAX", where: `lvl2 = '41' and ${BLANK("lvl3")}` },
  { key: "sf_4205_blank", mode: "exact", agg: "MAX", where: `lvl3 = '4205' and ${BLANK("lvl4")}` },
  { key: "sf_423565_blank", mode: "exact", agg: "MAX", where: `lvl4 = '423565' and ${BLANK("account")}` },
  { key: "sf_4275_blank", mode: "exact", agg: "MAX", where: `lvl3 = '4275' and ${BLANK("lvl4")}` },
  { key: "sf_42750510", mode: "exact", agg: "MAX", where: "account = '42750510'" },
  { key: "sf_42750520", mode: "exact", agg: "MAX", where: "account = '42750520'" },
];

// Compras/consumos reales de Cuentas 14 y 74: se suman desde enero hasta el mes seleccionado.
const cuentasYtdSpecs = [
  { key: "compras_mp", where: "cuenta_contable in ('14050505','14050510','14050520','14050555','14050560')" },
  { key: "ss_mp", where: "cuenta_contable in ('74010505','74010515','74010525')" },
  { key: "compras_comerc", where: "cuenta_contable in ('14350505','14350510')" },
];

function buildSql(cur: Period, prevYear: Period): string {
  const balCols = balanceSpecs
    .map((s) => {
      const mesExpr = (p: Period) => (s.mode === "jan" ? 1 : p.mes);
      const column = s.mode === "jan" ? "saldo_inicial" : "saldo_final";
      return (
        `${s.agg}(${column}) FILTER (WHERE anio = ${cur.anio} AND mes = ${mesExpr(cur)} AND ${s.where}) AS ${s.key}_cur,\n` +
        `${s.agg}(${column}) FILTER (WHERE anio = ${prevYear.anio} AND mes = ${mesExpr(prevYear)} AND ${s.where}) AS ${s.key}_prev`
      );
    })
    .join(",\n");

  const ctaCols = cuentasYtdSpecs
    .map(
      (s) =>
        `SUM(saldo_mensual) FILTER (WHERE anio = ${cur.anio} AND EXTRACT(MONTH FROM fecha_contabilizacion) BETWEEN 1 AND ${cur.mes} AND ${s.where}) AS ${s.key}_cur,\n` +
        `SUM(saldo_mensual) FILTER (WHERE anio = ${prevYear.anio} AND EXTRACT(MONTH FROM fecha_contabilizacion) BETWEEN 1 AND ${prevYear.mes} AND ${s.where}) AS ${s.key}_prev`,
    )
    .join(",\n");

  return `
    WITH b AS (
      SELECT\n${balCols}\n      FROM "estados financieros".balance
    ),
    c AS (
      SELECT\n${ctaCols}\n      FROM "estados financieros".cuentas_14_y_74
    )
    SELECT * FROM b, c;
  `;
}

type Raw = Record<string, number>;

function n(v: unknown): number {
  return v === null || v === undefined ? 0 : Number(v);
}

function computeAtomics(row: Raw, suffix: "cur" | "prev") {
  const g = (key: string) => n(row[`${key}_${suffix}`]);

  const invInicialMp = g("si_1405_jan") - g("si_14050575_jan") - g("si_14050595_jan");
  const comprasMp = g("compras_mp");
  const ssMp = g("ss_mp");
  const retiroMpMoldes = (g("sf_73959510") + g("sf_73959535")) * -1;
  const invFinalMp = (g("sf_1405") - g("sf_14050575") - g("sf_14050595")) * -1;
  const invInicialPc = g("si_1435_jan");
  const comprasComercializado = g("compras_comerc");
  const invFinalPc = g("sf_1435") * -1;
  const costoMpUtilizada =
    invInicialMp + comprasMp + ssMp + retiroMpMoldes + invFinalMp + invInicialPc + comprasComercializado + invFinalPc;

  const moVinc = g("sf_mo_vinc") * -1;
  const moTemp = g("sf_72359595") * -1;
  const costoMod = moVinc + moTemp;

  const moIndirecta = g("sf_73059595") * -1;
  const honorarios = g("sf_7310");
  const impuestos = g("sf_7315");
  const arrendamiento = g("sf_7320");
  const servicios = g("sf_7335");
  const mantenimiento = g("sf_7345");
  const adecuacion = g("sf_7350");
  const depreciacion = g("sf_7360");
  const otrosCif =
    g("sf_7395_blank") - g("sf_73959585") - g("sf_73959595b") - g("sf_73959580") - g("sf_73959540") - g("sf_73959545");
  const gastosViaje = g("sf_7355");
  const cif =
    moIndirecta + honorarios + impuestos + arrendamiento + servicios + mantenimiento + adecuacion + depreciacion + otrosCif + gastosViaje;

  const costoProduccionPeriodo = costoMpUtilizada + costoMod + cif;

  const invInicialProdProceso = g("si_1410_blank_jan");
  const costoProdProceso = costoProduccionPeriodo + invInicialProdProceso;

  const invFinalProdProceso = g("sf_1410_blank") * -1;
  const costoProdTerminado = costoProdProceso + invFinalProdProceso;

  const invInicialProdTerminado = g("si_1430_blank_jan");
  const costoProdDispoVenta = costoProdTerminado + invInicialProdTerminado;

  const trasladoDeCostos = (g("sf_52059595") + g("sf_52351595") + g("sf_52954595")) * -1;
  const invFinalProdTerminado = g("sf_1430_blank") * -1;
  const totalReal = g("sf_61_lvl4_blank");
  const costoVentaManufacturados = totalReal;
  const retiroMuestraVentaReal = totalReal - trasladoDeCostos - invFinalProdTerminado - costoProdDispoVenta;

  const costosProductosVendidos = g("sf_61_lvl3_blank");
  const descuentosFinancierosAprovechados = g("sf_42104005");
  const totalCostoVentas = costosProductosVendidos + descuentosFinancierosAprovechados;

  const totalVentas =
    g("sf_41_blank") * -1 + g("sf_4205_blank") * -1 + g("sf_423565_blank") * -1 + g("sf_4275_blank") * -1 + g("sf_42750510") + g("sf_42750520");

  const componentes: Record<string, { label: string; valor: number }[]> = {
    "costo-prod-periodo": [
      { label: "Costo MP Utilizada", valor: costoMpUtilizada },
      { label: "Costo M.O.D.", valor: costoMod },
      { label: "CIF", valor: cif },
    ],
    "costo-mp-utilizada": [
      { label: "Inventario Inicial MP (enero)", valor: invInicialMp },
      { label: "Compras MP", valor: comprasMp },
      { label: "SS a la MP", valor: ssMp },
      { label: "Retiro MP para Moldes", valor: retiroMpMoldes },
      { label: "Inventario Final MP", valor: invFinalMp },
      { label: "Inventario Inicial Producto Comercializado (enero)", valor: invInicialPc },
      { label: "Compras Comercializado", valor: comprasComercializado },
      { label: "Inventario Final Producto Comercializado", valor: invFinalPc },
    ],
    "costo-mod": [
      { label: "M.O. Vinculados", valor: moVinc },
      { label: "M.O. Temporales", valor: moTemp },
    ],
    cif: [
      { label: "M.O. Indirecta", valor: moIndirecta },
      { label: "Honorarios", valor: honorarios },
      { label: "Impuestos", valor: impuestos },
      { label: "Arrendamiento", valor: arrendamiento },
      { label: "Servicios", valor: servicios },
      { label: "Mantenimiento", valor: mantenimiento },
      { label: "Adecuación", valor: adecuacion },
      { label: "Depreciación", valor: depreciacion },
      { label: "Otros CIF", valor: otrosCif },
      { label: "Gastos de Viaje", valor: gastosViaje },
    ],
    "costo-prod-proceso": [
      { label: "Costo Producción Periodo", valor: costoProduccionPeriodo },
      { label: "Inventario Inicial Producto en Proceso (enero)", valor: invInicialProdProceso },
    ],
    "costo-prod-terminado": [
      { label: "Costo Prod. Proceso", valor: costoProdProceso },
      { label: "Inventario Final Producto en Proceso", valor: invFinalProdProceso },
    ],
    "costo-prod-disp-venta": [
      { label: "Costo Prod. Terminado", valor: costoProdTerminado },
      { label: "Inventario Inicial Producto Terminado (enero)", valor: invInicialProdTerminado },
    ],
    "costo-venta-manufacturados": [
      { label: "Retiro Muestra Venta", valor: retiroMuestraVentaReal },
      { label: "Traslado de Costos", valor: trasladoDeCostos },
      { label: "Inventario Final Producto Terminado", valor: invFinalProdTerminado },
      { label: "Costo Prod. Disponible para Venta", valor: costoProdDispoVenta },
    ],
    "total-costo-ventas": [
      { label: "Costos Productos Vendidos (cuenta 61)", valor: costosProductosVendidos },
      { label: "Descuentos Financieros Aprovechados", valor: descuentosFinancierosAprovechados },
    ],
  };

  return {
    costoProduccionPeriodo,
    costoProdProceso,
    costoProdTerminado,
    costoProdDispoVenta,
    costoVentaManufacturados,
    totalCostoVentas,
    totalVentas,
    componentes,
  };
}

export type FilaCostoAcumulado = {
  label: string;
  rubro: string;
  actual: number;
  porcentaje: number | null;
  anioAnterior: number;
  porcentajeAnioAnterior: number | null;
  variacion: number;
  porcentajeVariacion: number | null;
  destacado?: boolean;
};

export type EstadoCostoAcumulado = {
  periodoActual: Period;
  periodoAnterior: Period;
  filas: FilaCostoAcumulado[];
};

function divide(a: number, b: number): number | null {
  return b === 0 ? null : a / b;
}

export async function getEstadoCostoAcumulado(cur: Period): Promise<EstadoCostoAcumulado> {
  const prevYear: Period = { anio: cur.anio - 1, mes: cur.mes };
  const sql = buildSql(cur, prevYear);
  const [row] = await runManagementSql<Raw>(sql);

  const actual = computeAtomics(row, "cur");
  const anterior = computeAtomics(row, "prev");

  const rows: Array<[string, string, Exclude<keyof ReturnType<typeof computeAtomics>, "componentes">]> = [
    ["C. Prod Periodo", "costo-prod-periodo", "costoProduccionPeriodo"],
    ["C. Prod Proceso", "costo-prod-proceso", "costoProdProceso"],
    ["C. Prod Terminado", "costo-prod-terminado", "costoProdTerminado"],
    ["C. Prod Disp Vent", "costo-prod-disp-venta", "costoProdDispoVenta"],
    ["C. Venta Manufac.", "costo-venta-manufacturados", "costoVentaManufacturados"],
  ];

  const filas: FilaCostoAcumulado[] = rows.map(([label, rubro, key]) => {
    const a = actual[key];
    const m = anterior[key];
    const variacion = a - m;
    return {
      label,
      rubro,
      actual: a,
      porcentaje: null,
      anioAnterior: m,
      porcentajeAnioAnterior: null,
      variacion,
      porcentajeVariacion: divide(variacion, m),
    };
  });

  const totalActual = actual.totalCostoVentas;
  const totalAnterior = anterior.totalCostoVentas;
  const totalVariacion = totalActual - totalAnterior;
  filas.push({
    label: "Total Costo Venta",
    rubro: "total-costo-ventas",
    actual: totalActual,
    porcentaje: divide(totalActual, actual.totalVentas),
    anioAnterior: totalAnterior,
    porcentajeAnioAnterior: divide(totalAnterior, anterior.totalVentas),
    variacion: totalVariacion,
    porcentajeVariacion: divide(totalVariacion, totalAnterior),
    destacado: true,
  });

  return { periodoActual: cur, periodoAnterior: prevYear, filas };
}

export type DetalleRubroAcumulado = {
  rubro: string;
  label: string;
  periodoActual: Period;
  periodoAnterior: Period;
  totalActual: number;
  totalAnterior: number;
  componentes: Array<{ label: string; actual: number; anioAnterior: number; variacion: number }>;
};

export async function getDetalleCostoAcumulado(cur: Period, rubro: string): Promise<DetalleRubroAcumulado> {
  const prevYear: Period = { anio: cur.anio - 1, mes: cur.mes };
  const sql = buildSql(cur, prevYear);
  const [row] = await runManagementSql<Raw>(sql);

  const actual = computeAtomics(row, "cur");
  const anterior = computeAtomics(row, "prev");

  const compActual = actual.componentes[rubro] ?? [];
  const compAnterior = anterior.componentes[rubro] ?? [];

  const componentes = compActual.map((c, i) => ({
    label: c.label,
    actual: c.valor,
    anioAnterior: compAnterior[i]?.valor ?? 0,
    variacion: c.valor - (compAnterior[i]?.valor ?? 0),
  }));

  const totalActual = componentes.reduce((s, c) => s + c.actual, 0);
  const totalAnterior = componentes.reduce((s, c) => s + c.anioAnterior, 0);

  const RUBRO_LABELS: Record<string, string> = {
    "costo-prod-periodo": "Costo Producción Periodo",
    "costo-mp-utilizada": "Costo MP Utilizada",
    "costo-mod": "Costo M.O.D.",
    cif: "CIF",
    "costo-prod-proceso": "Costo Prod. Proceso",
    "costo-prod-terminado": "Costo Prod. Terminado",
    "costo-prod-disp-venta": "Costo Prod. Disponible para Venta",
    "costo-venta-manufacturados": "Costo Venta Manufacturados",
    "total-costo-ventas": "Total Costo Venta",
  };

  return {
    rubro,
    label: RUBRO_LABELS[rubro] ?? rubro,
    periodoActual: cur,
    periodoAnterior: prevYear,
    totalActual,
    totalAnterior,
    componentes,
  };
}
