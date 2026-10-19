import { runManagementSql } from "@/lib/supabase/management";
import type { Period } from "./estado-costo-mensual";

// Traducción de las medidas DAX (mensuales) de "Medidas Resultado" del modelo Power BI.
// Usa Balance[Saldo del Mes] filtrado por jerarquía. Las medidas acumuladas usan Saldo Final.

type RawSpec = { key: string; where: string };

const BLANK = (col: string) => `(${col} IS NULL OR ${col} = '')`;

const specs: RawSpec[] = [
  // Ventas Netas
  { key: "s_41203205", where: "account = '41203205'" },
  { key: "s_41209505", where: "account = '41209505'" },
  { key: "s_41209510", where: "account = '41209510'" },
  { key: "s_41359505", where: "account = '41359505'" },
  { key: "s_41209520", where: "account = '41209520'" },
  { key: "s_41203240", where: "account = '41203240'" }, // cuenta adicional en grupo 412032
  { key: "s_41203215", where: "account = '41203215'" },
  { key: "s_41203245", where: "account = '41203245'" }, // cuenta adicional en grupo 412032
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
  { key: "s_42104005", where: "account = '42104005'" }, // Descuentos Financieros Aprovechados

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
  // 530595 Otros Gastos Financieros — cuenta 53059515 excluida (asiento par de 53959520, se anulan)
  { key: "s_53059505", where: "account = '53059505'" },
  { key: "s_53059510", where: "account = '53059510'" },
  { key: "s_5310", where: `lvl3 = '5310' and ${BLANK("lvl4")}` },
  { key: "s_5315", where: `lvl3 = '5315' and ${BLANK("lvl4")}` },
  // 5395 Gastos Extraordinarios — cuenta 53959520 excluida (saldo crédito/reversión no capturada en BI)
  { key: "s_53950505", where: "account = '53950505'" },
  { key: "s_53951505", where: "account = '53951505'" },
  { key: "s_53952005", where: "account = '53952005'" },
  { key: "s_53952505", where: "account = '53952505'" },
  { key: "s_53959505", where: "account = '53959505'" },
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

  // Ventas Netas
  const ventasNacionales = (g("s_41203205") + g("s_41209505") + g("s_41209510") + g("s_41359505") + g("s_41209520") + g("s_41203240")) * -1;
  const ventasExportaciones = (g("s_41203215") + g("s_41203245") + g("s_41209515") + g("s_41359515") + g("s_42050510") + g("s_42050520")) * -1;
  const ventasServicios = g("s_42356505") * -1;
  const ventasMP = (g("s_42050505") + g("s_42050515") + g("s_42054505")) * -1;
  const devolucionesVentas = (g("s_4175") + g("s_4275") - (g("s_42750510") - g("s_42750520"))) * -1;
  const descuentosFinancierosVentas = g("s_53053505") * -1;
  const totalVentasNetas =
    ventasNacionales + ventasExportaciones + ventasServicios + ventasMP + devolucionesVentas + descuentosFinancierosVentas;

  // Costo de Ventas — usa Total Costo Ventas Resultado (= Costos + Descuentos Financieros Aprovechados)
  // 42104005 es cuenta crédito (saldo negativo) → reduce el costo neto, igual que el DAX
  const costosProductosVendidos = g("s_61");
  const descuentosFinancierosAprovechados = g("s_42104005");
  const totalCostoVentas = costosProductosVendidos + descuentosFinancierosAprovechados;

  const utilidadBrutaVentas = totalVentasNetas - totalCostoVentas;

  // Gastos Operativos
  const contribucion4x1000 = g("s_51159510") + g("s_51159515");
  const gastosAdministracion = g("s_51") - contribucion4x1000 - g("s_5199");
  const gastosVentasBruto = g("s_52");
  const descuentosCom = -g("s_52991090");
  const gastosVentas = gastosVentasBruto + descuentosCom;
  const gastosOperativos = gastosAdministracion + gastosVentas;

  const utilidadOperacional = utilidadBrutaVentas - gastosOperativos;

  // Ingresos No Operativos (sub-componentes)
  const ingrIntereses = g("s_421005") * -1;
  const ingrDifCambio = g("s_421020") * -1;
  const ingrCoberturaTC = g("s_421095") * -1;
  const ingrArrendamientos = g("s_4220") * -1;
  const ingrComisiones = g("s_4225") * -1;
  const ingrFletes = g("s_423580") * -1 - g("s_42750510") - g("s_42750520");
  const ingrUtilidadPPE = g("s_4245") * -1;
  const ingrRecuperaciones = g("s_4250") * -1;
  const ingrIndemnizaciones = g("s_4255") * -1;
  const ingrEjerciciosAnt = g("s_4265") * -1;
  const ingrDiversos = g("s_4295") * -1;
  const diverBenefPAEF = ingrEjerciciosAnt + ingrDiversos;
  const ingresosNoOperativos =
    ingrIntereses + ingrDifCambio + ingrCoberturaTC + ingrArrendamientos + ingrComisiones +
    ingrFletes + ingrUtilidadPPE + ingrRecuperaciones + ingrIndemnizaciones + ingrEjerciciosAnt + ingrDiversos;

  // Gastos No Operativos (sub-componentes)
  const gastosBancarios = g("s_53050505");
  const gastosComisiones = g("s_53051505");
  const gastosIntereses = g("s_530520");
  const gastosDifCambio = g("s_530525");
  const otrosGastosFinancieros = g("s_53059505") + g("s_53059510");
  const perdidaRetiroBienes = g("s_5310");
  const impuestosAsumidos = g("s_5315");
  const gastosExtraordinarios = g("s_53950505") + g("s_53951505") + g("s_53952005") + g("s_53952505") + g("s_53959505");
  const provisionCartera = g("s_5199") + g("s_5299");
  const gastosNoOperativos =
    gastosBancarios + gastosComisiones + gastosIntereses + gastosDifCambio + otrosGastosFinancieros +
    perdidaRetiroBienes + contribucion4x1000 + impuestosAsumidos + gastosExtraordinarios + provisionCartera;

  const utilidadAntesImpuestos = utilidadOperacional - gastosNoOperativos + ingresosNoOperativos;
  const provisionImpuestoRenta = g("s_54");
  const utilidadPeriodo = utilidadAntesImpuestos - provisionImpuestoRenta;

  return {
    totalVentasNetas, totalCostoVentas, utilidadBrutaVentas, gastosOperativos,
    utilidadOperacional, ingresosNoOperativos, gastosNoOperativos, utilidadAntesImpuestos,
    provisionImpuestoRenta, utilidadPeriodo,
    // Sub-componentes Ventas
    ventasNacionales, ventasExportaciones, ventasServicios, ventasMP,
    devolucionesVentas, descuentosFinancierosVentas,
    // Sub-componentes Costo Ventas
    costosProductosVendidos, descuentosFinancierosAprovechados,
    // Sub-componentes Gastos Operativos
    gastosAdministracion, gastosVentasBruto, descuentosCom,
    // Sub-componentes Ingresos No Operativos
    ingrIntereses, ingrDifCambio, ingrCoberturaTC, ingrArrendamientos, ingrComisiones,
    ingrFletes, ingrUtilidadPPE, ingrRecuperaciones, ingrIndemnizaciones,
    ingrEjerciciosAnt, ingrDiversos, diverBenefPAEF,
    // Sub-componentes Gastos No Operativos
    gastosBancarios, gastosComisiones, gastosIntereses, gastosDifCambio,
    otrosGastosFinancieros, perdidaRetiroBienes, contribucion4x1000,
    impuestosAsumidos, gastosExtraordinarios, provisionCartera,
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
  detalles: {
    ventasNetas: FilaResultado[];
    costoVentas: FilaResultado[];
    gastosOperativos: FilaResultado[];
    ingresosNoOperativos: FilaResultado[];
    gastosNoOperativos: FilaResultado[];
  };
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

  const detalles = {
    ventasNetas: [
      fila("Ventas Nacionales", actual.ventasNacionales, anterior.ventasNacionales),
      fila("Ventas Exportaciones", actual.ventasExportaciones, anterior.ventasExportaciones),
      fila("Ventas Servicios", actual.ventasServicios, anterior.ventasServicios),
      fila("Ventas Materia Prima", actual.ventasMP, anterior.ventasMP),
      fila("Devoluciones en Ventas", actual.devolucionesVentas, anterior.devolucionesVentas),
      fila("Descuentos Financieros", actual.descuentosFinancierosVentas, anterior.descuentosFinancierosVentas),
      fila("Total Ventas Netas", actual.totalVentasNetas, anterior.totalVentasNetas, true),
    ],
    costoVentas: [
      fila("Costos Productos Vendidos", actual.costosProductosVendidos, anterior.costosProductosVendidos),
      fila("Descuentos Financieros Aprovechados", actual.descuentosFinancierosAprovechados, anterior.descuentosFinancierosAprovechados),
      fila("Total Costo de Ventas", actual.totalCostoVentas, anterior.totalCostoVentas, true),
    ],
    gastosOperativos: [
      fila("Gastos Administración", actual.gastosAdministracion, anterior.gastosAdministracion),
      fila("Gastos de Ventas", actual.gastosVentasBruto, anterior.gastosVentasBruto),
      fila("Descuento com", actual.descuentosCom, anterior.descuentosCom),
      fila("Total Gastos Operativos", actual.gastosOperativos, anterior.gastosOperativos, true),
    ],
    ingresosNoOperativos: [
      fila("Ingresos Intereses", actual.ingrIntereses, anterior.ingrIntereses),
      fila("Diferencia en Cambio", actual.ingrDifCambio, anterior.ingrDifCambio),
      fila("Cobertura TC", actual.ingrCoberturaTC, anterior.ingrCoberturaTC),
      fila("Arrendamientos", actual.ingrArrendamientos, anterior.ingrArrendamientos),
      fila("Comisiones", actual.ingrComisiones, anterior.ingrComisiones),
      fila("Ingresos Fletes", actual.ingrFletes, anterior.ingrFletes),
      fila("Utilidad PPE", actual.ingrUtilidadPPE, anterior.ingrUtilidadPPE),
      fila("Recuperaciones", actual.ingrRecuperaciones, anterior.ingrRecuperaciones),
      fila("Indemnizaciones", actual.ingrIndemnizaciones, anterior.ingrIndemnizaciones),
      fila("Diver - Benef PAEF", actual.diverBenefPAEF, anterior.diverBenefPAEF),
      fila("Total Ingresos No Operativos", actual.ingresosNoOperativos, anterior.ingresosNoOperativos, true),
    ],
    gastosNoOperativos: [
      fila("Gastos Bancarios", actual.gastosBancarios, anterior.gastosBancarios),
      fila("Comisiones", actual.gastosComisiones, anterior.gastosComisiones),
      fila("Intereses", actual.gastosIntereses, anterior.gastosIntereses),
      fila("Diferencia en Cambio", actual.gastosDifCambio, anterior.gastosDifCambio),
      fila("Otros Gastos Financieros", actual.otrosGastosFinancieros, anterior.otrosGastosFinancieros),
      fila("Pérdida en Retiro de Bienes", actual.perdidaRetiroBienes, anterior.perdidaRetiroBienes),
      fila("Contribución 4x1000", actual.contribucion4x1000, anterior.contribucion4x1000),
      fila("Impuestos Asumidos", actual.impuestosAsumidos, anterior.impuestosAsumidos),
      fila("Gastos Extraordinarios", actual.gastosExtraordinarios, anterior.gastosExtraordinarios),
      fila("Provisión Cartera e Inventarios", actual.provisionCartera, anterior.provisionCartera),
      fila("Total Gastos No Operativos", actual.gastosNoOperativos, anterior.gastosNoOperativos, true),
    ],
  };

  return { periodoActual: cur, periodoAnterior: prev, filas, detalles };
}
