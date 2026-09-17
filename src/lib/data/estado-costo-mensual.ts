import { runManagementSql } from "@/lib/supabase/management";

// Traducción directa de las medidas DAX de la tabla "Medidas Estado Costo" del
// modelo de Power BI (ver /powerbi-measures/Medidas Estado Costo.tmdl) a SQL.
// Cada spec es un valor atómico que las medidas combinan con sumas y restas.

type RawSpec = {
  key: string;
  source: "balance" | "cuentas";
  agg: "MAX" | "SUM";
  column: "saldo_inicial" | "saldo_final" | "saldo_del_mes" | "debito" | "credito" | "saldo_mensual";
  where: string;
};

const BLANK = (col: string) => `(${col} IS NULL OR ${col} = '')`;

const balanceSpecs: RawSpec[] = [
  { key: "si_1405", source: "balance", agg: "MAX", column: "saldo_inicial", where: "lvl3 = '1405'" },
  { key: "si_14050575", source: "balance", agg: "MAX", column: "saldo_inicial", where: "account = '14050575'" },
  { key: "si_14050595", source: "balance", agg: "MAX", column: "saldo_inicial", where: "account = '14050595'" },
  { key: "sf_1405", source: "balance", agg: "MAX", column: "saldo_final", where: "lvl3 = '1405'" },
  { key: "sf_14050575", source: "balance", agg: "MAX", column: "saldo_final", where: "account = '14050575'" },
  { key: "sf_14050595", source: "balance", agg: "MAX", column: "saldo_final", where: "account = '14050595'" },
  { key: "si_1435", source: "balance", agg: "MAX", column: "saldo_inicial", where: "lvl3 = '1435'" },
  { key: "sf_1435", source: "balance", agg: "MAX", column: "saldo_final", where: "lvl3 = '1435'" },
  { key: "d_73959510", source: "balance", agg: "MAX", column: "debito", where: "account = '73959510'" },
  { key: "c_73959510", source: "balance", agg: "MAX", column: "credito", where: "account = '73959510'" },
  { key: "d_73959535", source: "balance", agg: "MAX", column: "debito", where: "account = '73959535'" },
  { key: "c_73959535", source: "balance", agg: "MAX", column: "credito", where: "account = '73959535'" },
  { key: "d_mo_vinc", source: "balance", agg: "SUM", column: "debito", where: "account in ('72059585','72059595','72059590')" },
  { key: "c_mo_vinc", source: "balance", agg: "SUM", column: "credito", where: "account in ('72059585','72059595','72059590')" },
  { key: "d_mo_temp", source: "balance", agg: "SUM", column: "debito", where: "account = '72359595'" },
  { key: "c_mo_temp", source: "balance", agg: "SUM", column: "credito", where: "account = '72359595'" },
  { key: "d_73059595", source: "balance", agg: "MAX", column: "debito", where: "account = '73059595'" },
  { key: "c_73059595", source: "balance", agg: "MAX", column: "credito", where: "account = '73059595'" },
  { key: "d_7310", source: "balance", agg: "MAX", column: "debito", where: "lvl3 = '7310'" },
  { key: "c_7310", source: "balance", agg: "MAX", column: "credito", where: "lvl3 = '7310'" },
  { key: "d_7315", source: "balance", agg: "MAX", column: "debito", where: "lvl3 = '7315'" },
  { key: "c_7315", source: "balance", agg: "MAX", column: "credito", where: "lvl3 = '7315'" },
  { key: "d_7320", source: "balance", agg: "MAX", column: "debito", where: "lvl3 = '7320'" },
  { key: "c_7320", source: "balance", agg: "MAX", column: "credito", where: "lvl3 = '7320'" },
  { key: "d_7335", source: "balance", agg: "MAX", column: "debito", where: "lvl3 = '7335'" },
  { key: "c_7335", source: "balance", agg: "MAX", column: "credito", where: "lvl3 = '7335'" },
  { key: "d_7345", source: "balance", agg: "MAX", column: "debito", where: "lvl3 = '7345'" },
  { key: "c_7345", source: "balance", agg: "MAX", column: "credito", where: "lvl3 = '7345'" },
  { key: "d_7350", source: "balance", agg: "MAX", column: "debito", where: "lvl3 = '7350'" },
  { key: "c_7350", source: "balance", agg: "MAX", column: "credito", where: "lvl3 = '7350'" },
  { key: "d_7360", source: "balance", agg: "MAX", column: "debito", where: "lvl3 = '7360'" },
  { key: "c_7360", source: "balance", agg: "MAX", column: "credito", where: "lvl3 = '7360'" },
  { key: "d_7395_blank", source: "balance", agg: "MAX", column: "debito", where: `lvl3 = '7395' and ${BLANK("lvl4")}` },
  { key: "c_7395_blank", source: "balance", agg: "MAX", column: "credito", where: `lvl3 = '7395' and ${BLANK("lvl4")}` },
  { key: "d_73959585", source: "balance", agg: "MAX", column: "debito", where: "account = '73959585'" },
  { key: "c_73959585", source: "balance", agg: "MAX", column: "credito", where: "account = '73959585'" },
  { key: "d_73959595b", source: "balance", agg: "MAX", column: "debito", where: "account = '73959595'" },
  { key: "c_73959595b", source: "balance", agg: "MAX", column: "credito", where: "account = '73959595'" },
  { key: "d_73959580", source: "balance", agg: "MAX", column: "debito", where: "account = '73959580'" },
  { key: "c_73959580", source: "balance", agg: "MAX", column: "credito", where: "account = '73959580'" },
  { key: "d_73959540", source: "balance", agg: "MAX", column: "debito", where: "account = '73959540'" },
  { key: "c_73959540", source: "balance", agg: "MAX", column: "credito", where: "account = '73959540'" },
  { key: "d_73959545", source: "balance", agg: "MAX", column: "debito", where: "account = '73959545'" },
  { key: "c_73959545", source: "balance", agg: "MAX", column: "credito", where: "account = '73959545'" },
  { key: "d_7355", source: "balance", agg: "MAX", column: "debito", where: "lvl3 = '7355'" },
  { key: "c_7355", source: "balance", agg: "MAX", column: "credito", where: "lvl3 = '7355'" },
  { key: "d_7330", source: "balance", agg: "MAX", column: "debito", where: "lvl3 = '7330'" },
  { key: "c_7330", source: "balance", agg: "MAX", column: "credito", where: "lvl3 = '7330'" },
  { key: "si_1410_blank", source: "balance", agg: "MAX", column: "saldo_inicial", where: `lvl3 = '1410' and ${BLANK("lvl4")}` },
  { key: "sf_1410_blank", source: "balance", agg: "MAX", column: "saldo_final", where: `lvl3 = '1410' and ${BLANK("lvl4")}` },
  { key: "si_1430_blank", source: "balance", agg: "MAX", column: "saldo_inicial", where: `lvl3 = '1430' and ${BLANK("lvl4")}` },
  { key: "sf_1430_blank", source: "balance", agg: "MAX", column: "saldo_final", where: `lvl3 = '1430' and ${BLANK("lvl4")}` },
  { key: "d_52959515", source: "balance", agg: "MAX", column: "debito", where: "account = '52959515'" },
  { key: "c_52959515", source: "balance", agg: "MAX", column: "credito", where: "account = '52959515'" },
  { key: "d_52059595", source: "balance", agg: "MAX", column: "debito", where: "account = '52059595'" },
  { key: "c_52059595", source: "balance", agg: "MAX", column: "credito", where: "account = '52059595'" },
  { key: "d_52351595", source: "balance", agg: "MAX", column: "debito", where: "account = '52351595'" },
  { key: "c_52351595", source: "balance", agg: "MAX", column: "credito", where: "account = '52351595'" },
  { key: "d_52954595", source: "balance", agg: "MAX", column: "debito", where: "account = '52954595'" },
  { key: "c_52954595", source: "balance", agg: "MAX", column: "credito", where: "account = '52954595'" },
  { key: "d_41_blank", source: "balance", agg: "MAX", column: "debito", where: `lvl2 = '41' and ${BLANK("lvl3")}` },
  { key: "c_41_blank", source: "balance", agg: "MAX", column: "credito", where: `lvl2 = '41' and ${BLANK("lvl3")}` },
  { key: "d_4205_blank", source: "balance", agg: "MAX", column: "debito", where: `lvl3 = '4205' and ${BLANK("lvl4")}` },
  { key: "c_4205_blank", source: "balance", agg: "MAX", column: "credito", where: `lvl3 = '4205' and ${BLANK("lvl4")}` },
  { key: "d_423565_blank", source: "balance", agg: "MAX", column: "debito", where: `lvl4 = '423565' and ${BLANK("account")}` },
  { key: "c_423565_blank", source: "balance", agg: "MAX", column: "credito", where: `lvl4 = '423565' and ${BLANK("account")}` },
  { key: "d_4275_blank", source: "balance", agg: "MAX", column: "debito", where: `lvl3 = '4275' and ${BLANK("lvl4")}` },
  { key: "c_4275_blank", source: "balance", agg: "MAX", column: "credito", where: `lvl3 = '4275' and ${BLANK("lvl4")}` },
  { key: "d_42750510", source: "balance", agg: "MAX", column: "debito", where: "account = '42750510'" },
  { key: "c_42750510", source: "balance", agg: "MAX", column: "credito", where: "account = '42750510'" },
  { key: "d_61_blank", source: "balance", agg: "MAX", column: "debito", where: `lvl2 = '61' and ${BLANK("lvl4")}` },
  { key: "c_61_blank", source: "balance", agg: "MAX", column: "credito", where: `lvl2 = '61' and ${BLANK("lvl4")}` },
  { key: "sm_61_lvl3_blank", source: "balance", agg: "MAX", column: "saldo_del_mes", where: `lvl2 = '61' and ${BLANK("lvl3")}` },
];

const cuentasSpecs: RawSpec[] = [
  { key: "compras_mp", source: "cuentas", agg: "SUM", column: "saldo_mensual", where: "cuenta_contable in ('14050505','14050510','14050520','14050555','14050560')" },
  { key: "ss_mp", source: "cuentas", agg: "SUM", column: "saldo_mensual", where: "cuenta_contable in ('74010505','74010515','74010525')" },
  { key: "compras_comerc", source: "cuentas", agg: "SUM", column: "saldo_mensual", where: "cuenta_contable in ('14350505','14350510')" },
];

export type Period = { anio: number; mes: number };

function prevMonth({ anio, mes }: Period): Period {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

// El Balance trae filas duplicadas para algunas cuentas puntuales (mismo mes/cuenta,
// a veces idénticas, a veces con Débito/Crédito distinto) — un artefacto de la fuente
// aún sin diagnosticar del todo. Sumar ciegamente por columna rompe cuentas donde el
// duplicado es una copia idéntica (dobla el valor). Por ahora replicamos el DAX
// original tal cual (MAX), que es lo que coincide con el reporte de Power BI para
// la enorme mayoría de cuentas; el caso puntual de "Traslado de Costos" queda
// pendiente de resolver deduplicando el origen de datos.
function effectiveAgg(s: RawSpec): "MAX" | "SUM" {
  return s.agg;
}

function buildSql(cur: Period, prev: Period): string {
  const balCols = balanceSpecs
    .map(
      (s) =>
        `${effectiveAgg(s)}(${s.column}) FILTER (WHERE anio = ${cur.anio} AND mes = ${cur.mes} AND ${s.where}) AS ${s.key}_cur,\n` +
        `${effectiveAgg(s)}(${s.column}) FILTER (WHERE anio = ${prev.anio} AND mes = ${prev.mes} AND ${s.where}) AS ${s.key}_prev`,
    )
    .join(",\n");

  const ctaCols = cuentasSpecs
    .map(
      (s) =>
        `${effectiveAgg(s)}(${s.column}) FILTER (WHERE anio = ${cur.anio} AND EXTRACT(MONTH FROM fecha_contabilizacion) = ${cur.mes} AND ${s.where}) AS ${s.key}_cur,\n` +
        `${effectiveAgg(s)}(${s.column}) FILTER (WHERE anio = ${prev.anio} AND EXTRACT(MONTH FROM fecha_contabilizacion) = ${prev.mes} AND ${s.where}) AS ${s.key}_prev`,
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

  const invInicialMp = g("si_1405") - g("si_14050575") - g("si_14050595");
  const comprasMp = g("compras_mp");
  const ssMp = g("ss_mp");
  const retiroMpMoldes = -g("d_73959510") + g("c_73959510") - g("d_73959535") + g("c_73959535");
  const invFinalMp = (g("sf_1405") - g("sf_14050575") - g("sf_14050595")) * -1;
  const invInicialPc = g("si_1435");
  const comprasComercializado = g("compras_comerc");
  const invFinalPc = g("sf_1435") * -1;
  const costoMpUtilizada =
    invInicialMp + comprasMp + ssMp + retiroMpMoldes + invFinalMp + invInicialPc + comprasComercializado + invFinalPc;

  const moVinc = g("d_mo_vinc") * -1 - g("c_mo_vinc") * -1;
  const moTemp = g("d_mo_temp") * -1 - g("c_mo_temp") * -1;
  const costoMod = moVinc + moTemp;

  const moIndirecta = g("d_73059595") * -1 - g("c_73059595") * -1;
  const honorarios = g("d_7310") - g("c_7310");
  const impuestos = g("d_7315") - g("c_7315");
  const arrendamiento = g("d_7320") - g("c_7320");
  const servicios = g("d_7335") - g("c_7335");
  const mantenimiento = g("d_7345") - g("c_7345");
  const adecuacion = g("d_7350") - g("c_7350");
  const depreciacion = g("d_7360") - g("c_7360");
  const otrosCif =
    g("d_7395_blank") -
    g("c_7395_blank") -
    (g("d_73959585") - g("c_73959585")) -
    (g("d_73959595b") - g("c_73959595b")) -
    (g("d_73959580") - g("c_73959580")) -
    (g("d_73959540") - g("c_73959540")) -
    (g("d_73959545") - g("c_73959545"));
  const gastosViaje = g("d_7355") - g("c_7355");
  const seguros = g("d_7330") - g("c_7330");
  const cif =
    moIndirecta + honorarios + impuestos + arrendamiento + servicios + mantenimiento + adecuacion + depreciacion + otrosCif + gastosViaje + seguros;

  const costoProduccionPeriodo = cif + costoMod + costoMpUtilizada;

  const invInicialProdProceso = g("si_1410_blank");
  const costoProdProceso = costoProduccionPeriodo + invInicialProdProceso;

  const invFinalProdProceso = g("sf_1410_blank") * -1;
  const costoProdTerminado = costoProdProceso + invFinalProdProceso;

  const invInicialProdTerminado = g("si_1430_blank");
  const costoProdDispoVenta = costoProdTerminado + invInicialProdTerminado;

  const trasladoDeCostos =
    (g("d_52059595") - g("c_52059595") + (g("d_52351595") - g("c_52351595")) + (g("d_52954595") - g("c_52954595"))) * -1;
  const invFinalProdTerminado = g("sf_1430_blank") * -1;
  // "Costo Venta Manufacturados" en el reporte real usa la variante "REAL", que
  // se simplifica algebraicamente a TOTAL REAL (el costo de ventas tal como quedó
  // registrado en la cuenta 61 del Balance) — "Retiro Muestra Venta Real" es la
  // cifra que ajusta el resto de la cadena para que cuadre exacto contra ese total.
  const totalReal = g("d_61_blank") - g("c_61_blank");
  const costoVentaManufacturados = totalReal;
  const retiroMuestraVentaReal = totalReal - trasladoDeCostos - invFinalProdTerminado - costoProdDispoVenta;

  // "Total Costo Venta" es una medida aparte ("Total Costo Ventas" = "Costos
  // Productos Vendidos"), no un duplicado de "Costo Venta Manufacturados": suma
  // el costo de ventas registrado a nivel Lvl2=61 con Lvl3 en blanco (un corte
  // distinto de la jerarquía que "TOTAL REAL", que corta en Lvl4 en blanco).
  const totalCostoVentas = g("sm_61_lvl3_blank");

  const totalVentas =
    (g("d_41_blank") - g("c_41_blank")) * -1 +
    (g("d_4205_blank") - g("c_4205_blank")) * -1 +
    (g("d_423565_blank") - g("c_423565_blank")) * -1 +
    ((g("d_4275_blank") - g("c_4275_blank")) * -1 + (g("d_42750510") - g("c_42750510")));

  const componentes: Record<string, { label: string; valor: number }[]> = {
    "costo-prod-periodo": [
      { label: "Costo MP Utilizada", valor: costoMpUtilizada },
      { label: "Costo M.O.D.", valor: costoMod },
      { label: "CIF", valor: cif },
    ],
    "costo-mp-utilizada": [
      { label: "Inventario Inicial MP", valor: invInicialMp },
      { label: "Compras MP", valor: comprasMp },
      { label: "SS a la MP", valor: ssMp },
      { label: "Retiro MP para Moldes", valor: retiroMpMoldes },
      { label: "Inventario Final MP", valor: invFinalMp },
      { label: "Inventario Inicial Producto Comercializado", valor: invInicialPc },
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
      { label: "Seguros", valor: seguros },
    ],
    "costo-prod-proceso": [
      { label: "Costo Producción Periodo", valor: costoProduccionPeriodo },
      { label: "Inventario Inicial Producto en Proceso", valor: invInicialProdProceso },
    ],
    "costo-prod-terminado": [
      { label: "Costo Prod. Proceso", valor: costoProdProceso },
      { label: "Inventario Final Producto en Proceso", valor: invFinalProdProceso },
    ],
    "costo-prod-disp-venta": [
      { label: "Costo Prod. Terminado", valor: costoProdTerminado },
      { label: "Inventario Inicial Producto Terminado", valor: invInicialProdTerminado },
    ],
    "costo-venta-manufacturados": [
      { label: "Retiro Muestra Venta", valor: retiroMuestraVentaReal },
      { label: "Traslado de Costos", valor: trasladoDeCostos },
      { label: "Inventario Final Producto Terminado", valor: invFinalProdTerminado },
      { label: "Costo Prod. Disponible para Venta", valor: costoProdDispoVenta },
    ],
    "total-costo-ventas": [{ label: "Costos Productos Vendidos (cuenta 61)", valor: totalCostoVentas }],
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

export type FilaCosto = {
  label: string;
  rubro: string;
  actual: number;
  porcentaje: number | null;
  mesAnterior: number;
  porcentajeMesAnterior: number | null;
  variacion: number;
  porcentajeVariacion: number | null;
  destacado?: boolean;
};

export type EstadoCostoMensual = {
  periodoActual: Period;
  periodoAnterior: Period;
  filas: FilaCosto[];
};

function divide(a: number, b: number): number | null {
  return b === 0 ? null : a / b;
}

export async function getPeriodosDisponibles(): Promise<Period[]> {
  const rows = await runManagementSql<{ anio: number; mes: number }>(
    `SELECT DISTINCT anio, mes FROM "estados financieros".balance WHERE anio IS NOT NULL AND mes IS NOT NULL ORDER BY anio DESC, mes DESC;`,
  );
  return rows.map((r) => ({ anio: Number(r.anio), mes: Number(r.mes) }));
}

export async function getEstadoCostoMensual(cur: Period): Promise<EstadoCostoMensual> {
  const prev = prevMonth(cur);
  const sql = buildSql(cur, prev);
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

  const filas: FilaCosto[] = rows.map(([label, rubro, key]) => {
    const a = actual[key];
    const m = anterior[key];
    const variacion = a - m;
    return {
      label,
      rubro,
      actual: a,
      porcentaje: null,
      mesAnterior: m,
      porcentajeMesAnterior: null,
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
    mesAnterior: totalAnterior,
    porcentajeMesAnterior: divide(totalAnterior, anterior.totalVentas),
    variacion: totalVariacion,
    porcentajeVariacion: divide(totalVariacion, totalAnterior),
    destacado: true,
  });

  return { periodoActual: cur, periodoAnterior: prev, filas };
}

export const RUBRO_LABELS: Record<string, string> = {
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

export type DetalleRubro = {
  rubro: string;
  label: string;
  periodoActual: Period;
  periodoAnterior: Period;
  totalActual: number;
  totalAnterior: number;
  componentes: Array<{ label: string; actual: number; mesAnterior: number; variacion: number }>;
};

export async function getDetalleCostoMensual(cur: Period, rubro: string): Promise<DetalleRubro> {
  const prev = prevMonth(cur);
  const sql = buildSql(cur, prev);
  const [row] = await runManagementSql<Raw>(sql);

  const actual = computeAtomics(row, "cur");
  const anterior = computeAtomics(row, "prev");

  const compActual = actual.componentes[rubro] ?? [];
  const compAnterior = anterior.componentes[rubro] ?? [];

  const componentes = compActual.map((c, i) => ({
    label: c.label,
    actual: c.valor,
    mesAnterior: compAnterior[i]?.valor ?? 0,
    variacion: c.valor - (compAnterior[i]?.valor ?? 0),
  }));

  const totalActual = componentes.reduce((s, c) => s + c.actual, 0);
  const totalAnterior = componentes.reduce((s, c) => s + c.mesAnterior, 0);

  return {
    rubro,
    label: RUBRO_LABELS[rubro] ?? rubro,
    periodoActual: cur,
    periodoAnterior: prev,
    totalActual,
    totalAnterior,
    componentes,
  };
}
