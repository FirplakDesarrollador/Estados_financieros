import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getEstadoCostoMensual } from "@/lib/data/estado-costo-mensual";
import { getEstadoCostoAcumulado } from "@/lib/data/estado-costo-acumulado";
import { getEstadoResultadosMensual } from "@/lib/data/estado-resultados-mensual";
import { getEstadoResultadosAcumulado } from "@/lib/data/estado-resultados-acumulado";
import { getBalanceGeneral } from "@/lib/data/balance-general";
import { getEstadoCambiosPatrimonio } from "@/lib/data/estado-cambios-patrimonio";
import { nombreMes, formatMiles, formatPorcentaje } from "@/lib/format";
import type { Period } from "@/lib/data/estado-costo-mensual";

function pct(v: number | null) {
  return v === null ? "" : formatPorcentaje(v);
}

function hdr(...cols: string[]) {
  return cols;
}

// ─── Hoja: Costo Mensual ────────────────────────────────────────────────────
function sheetCostoMensual(data: Awaited<ReturnType<typeof getEstadoCostoMensual>>) {
  const { periodoActual, periodoAnterior, filas } = data;
  const colA = `${nombreMes(periodoActual.mes)} ${periodoActual.anio}`;
  const colB = `${nombreMes(periodoAnterior.mes)} ${periodoAnterior.anio}`;

  const rows: unknown[][] = [
    hdr("ESTADO DEL COSTO DE PRODUCCIÓN Y VENTAS MENSUAL"),
    hdr(`${colA} vs ${colB}`),
    [],
    hdr("Concepto", colA, "% Vtas", colB, "% Vtas Ant.", "Variación", "% Variación"),
    ...filas.map((f) => [
      f.label,
      formatMiles(f.actual),
      pct(f.porcentaje),
      formatMiles(f.mesAnterior),
      pct(f.porcentajeMesAnterior),
      formatMiles(f.variacion),
      pct(f.porcentajeVariacion),
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

// ─── Hoja: Costo Acumulado ──────────────────────────────────────────────────
function sheetCostoAcumulado(data: Awaited<ReturnType<typeof getEstadoCostoAcumulado>>) {
  const { periodoActual, periodoAnterior, filas } = data;
  const colA = `Acum. ${periodoActual.anio}`;
  const colB = `Acum. ${periodoAnterior.anio}`;

  const rows: unknown[][] = [
    hdr("ESTADO DEL COSTO DE PRODUCCIÓN Y VENTAS ACUMULADO"),
    hdr(`Acumulado a ${periodoActual.mes}/${periodoActual.anio} vs ${periodoAnterior.mes}/${periodoAnterior.anio}`),
    [],
    hdr("Concepto", colA, "% Vtas", colB, "% Vtas Ant.", "Variación", "% Variación"),
    ...filas.map((f) => [
      f.label,
      formatMiles(f.actual),
      pct(f.porcentaje),
      formatMiles(f.anioAnterior),
      pct(f.porcentajeAnioAnterior),
      formatMiles(f.variacion),
      pct(f.porcentajeVariacion),
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

// ─── Hoja: Resultados Mensual ───────────────────────────────────────────────
function sheetResultadosMensual(data: Awaited<ReturnType<typeof getEstadoResultadosMensual>>) {
  const { periodoActual, periodoAnterior, filas } = data;
  const colA = `${nombreMes(periodoActual.mes)} ${periodoActual.anio}`;
  const colB = `${nombreMes(periodoAnterior.mes)} ${periodoAnterior.anio}`;

  const rows: unknown[][] = [
    hdr("ESTADO DE RESULTADO INTEGRAL MENSUAL"),
    hdr(`${colA} vs ${colB}`),
    [],
    hdr("Concepto", colA, colB, "Variación", "% Variación"),
    ...filas.map((f) => [
      f.label,
      formatMiles(f.actual),
      formatMiles(f.mesAnterior),
      formatMiles(f.actual - f.mesAnterior),
      pct(f.actual - f.mesAnterior !== 0 && f.mesAnterior !== 0 ? (f.actual - f.mesAnterior) / f.mesAnterior : null),
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

// ─── Hoja: Resultados Acumulado ─────────────────────────────────────────────
function sheetResultadosAcumulado(data: Awaited<ReturnType<typeof getEstadoResultadosAcumulado>>) {
  const { periodoActual, periodoAnterior, filas } = data;
  const colA = `Acum. ${periodoActual.anio}`;
  const colB = `Acum. ${periodoAnterior.anio}`;

  const rows: unknown[][] = [
    hdr("ESTADO DE RESULTADO INTEGRAL ACUMULADO"),
    hdr(`Acumulado a ${periodoActual.mes}/${periodoActual.anio} vs ${periodoAnterior.mes}/${periodoAnterior.anio}`),
    [],
    hdr("Concepto", colA, colB, "Variación", "% Variación"),
    ...filas.map((f) => [
      f.label,
      formatMiles(f.actual),
      formatMiles(f.mesAnterior),
      formatMiles(f.actual - f.mesAnterior),
      pct(f.actual - f.mesAnterior !== 0 && f.mesAnterior !== 0 ? (f.actual - f.mesAnterior) / f.mesAnterior : null),
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

// ─── Hoja: Balance ──────────────────────────────────────────────────────────
function sheetBalance(
  data: Awaited<ReturnType<typeof getBalanceGeneral>>,
  seccion: "activos" | "pasivosPatrimonio",
  titulo: string,
) {
  const filas = data[seccion];
  const colA = `${data.periodoActual.anio}`;
  const colB = `${data.periodoAnterior.anio}`;

  const rows: unknown[][] = [
    hdr(titulo),
    hdr(`${colA} vs ${colB}`),
    [],
    hdr("Concepto", colA, colB, "Variación", "% Variación"),
    ...filas.map((f) => [
      f.label,
      formatMiles(f.actual),
      formatMiles(f.anterior),
      formatMiles(f.actual - f.anterior),
      pct(f.actual - f.anterior !== 0 && f.anterior !== 0 ? (f.actual - f.anterior) / f.anterior : null),
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

// ─── Hoja: Cambios Patrimonio ───────────────────────────────────────────────
function sheetCambiosPatrimonio(data: Awaited<ReturnType<typeof getEstadoCambiosPatrimonio>>) {
  const { periodo, filas } = data;

  const rows: unknown[][] = [
    hdr("ESTADO DE CAMBIOS EN EL PATRIMONIO"),
    hdr(`Al ${nombreMes(periodo.mes)} ${periodo.anio} — Cifras en miles de pesos`),
    [],
    hdr("Concepto", "Capital Social", "Superávit Capital", "Reservas", "Resultados Ejercicio", "Ej. Anteriores", "Ut. Retenidas", "Total"),
    ...filas.map((f) => [
      f.label,
      formatMiles(f.valores.capitalSocial),
      formatMiles(f.valores.superavitCapital),
      formatMiles(f.valores.reservas),
      formatMiles(f.valores.resultadosEjercicio),
      formatMiles(f.valores.resultadosEjAnteriores),
      formatMiles(f.valores.utilidadesRetenidas),
      formatMiles(f.valores.total),
    ]),
  ];
  return XLSX.utils.aoa_to_sheet(rows);
}

// ─── Estilo básico de cabeceras ─────────────────────────────────────────────
function styleSheet(ws: XLSX.WorkSheet, headerRow: number) {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  // Ancho de columnas
  ws["!cols"] = Array.from({ length: range.e.c + 1 }, (_, i) =>
    i === 0 ? { wch: 42 } : { wch: 20 },
  );
  // Negrita en la fila de encabezado de columnas (índice headerRow)
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: headerRow, c });
    if (ws[addr]) {
      ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: "E2E8F0" } } };
    }
  }
  return ws;
}

// ─── Handler GET ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const anio = Number(searchParams.get("anio") ?? new Date().getFullYear());
  const mes = Number(searchParams.get("mes") ?? new Date().getMonth() + 1);
  const cur: Period = { anio, mes };

  const [costoMen, costoAcum, resultMen, resultAcum, balance, patrimonio] = await Promise.all([
    getEstadoCostoMensual(cur),
    getEstadoCostoAcumulado(cur),
    getEstadoResultadosMensual(cur),
    getEstadoResultadosAcumulado(cur),
    getBalanceGeneral(cur),
    getEstadoCambiosPatrimonio(cur),
  ]);

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, styleSheet(sheetCostoMensual(costoMen), 3), "Costo Mensual");
  XLSX.utils.book_append_sheet(wb, styleSheet(sheetCostoAcumulado(costoAcum), 3), "Costo Acumulado");
  XLSX.utils.book_append_sheet(wb, styleSheet(sheetResultadosMensual(resultMen), 3), "Result. Mensual");
  XLSX.utils.book_append_sheet(wb, styleSheet(sheetResultadosAcumulado(resultAcum), 3), "Result. Acumulado");
  XLSX.utils.book_append_sheet(wb, styleSheet(sheetBalance(balance, "activos", "BALANCE GENERAL — ACTIVOS"), 3), "Balance Activos");
  XLSX.utils.book_append_sheet(wb, styleSheet(sheetBalance(balance, "pasivosPatrimonio", "BALANCE GENERAL — PASIVOS Y PATRIMONIO"), 3), "Balance Pasivos");
  XLSX.utils.book_append_sheet(wb, styleSheet(sheetCambiosPatrimonio(patrimonio), 3), "Cambios Patrimonio");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Estados_Financieros_${nombreMes(mes)}_${anio}.xlsx"`,
    },
  });
}
