import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { getEstadoCostoMensual, getDetalleCostoMensual } from "@/lib/data/estado-costo-mensual";
import { DEFAULT_EMPRESA } from "@/lib/companies";
import { getEstadoCostoAcumulado, getDetalleCostoAcumulado } from "@/lib/data/estado-costo-acumulado";
import { getEstadoResultadosMensual } from "@/lib/data/estado-resultados-mensual";
import { getEstadoResultadosAcumulado } from "@/lib/data/estado-resultados-acumulado";
import { getBalanceGeneral } from "@/lib/data/balance-general";
import { getEstadoCambiosPatrimonio } from "@/lib/data/estado-cambios-patrimonio";
import { nombreMes, formatMiles, formatPorcentaje } from "@/lib/format";
import type { Period } from "@/lib/data/estado-costo-mensual";

// ─── Helpers ────────────────────────────────────────────────────────────────

function pct(v: number | null | undefined) {
  return v === null || v === undefined ? "" : formatPorcentaje(v);
}

function varPct(actual: number, ant: number): string {
  if (ant === 0) return "";
  return formatPorcentaje((actual - ant) / ant);
}

type Row = unknown[];
const SEP: Row = [];

function titulo(text: string): Row { return [text]; }
function subtitulo(text: string): Row { return [text]; }

// ─── Estilo ──────────────────────────────────────────────────────────────────

function applyStyles(ws: XLSX.WorkSheet, boldRows: number[], grayRows: number[]) {
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  ws["!cols"] = Array.from({ length: range.e.c + 1 }, (_, i) =>
    i === 0 ? { wch: 46 } : { wch: 20 },
  );
  for (let r = range.s.r; r <= range.e.r; r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      if (!ws[addr]) continue;
      const isBold = boldRows.includes(r);
      const isGray = grayRows.includes(r);
      ws[addr].s = {
        font: { bold: isBold },
        fill: isGray ? { fgColor: { rgb: "E2E8F0" } } : undefined,
      };
    }
  }
  return ws;
}

// ─── Hoja: Costo Mensual con detalle ────────────────────────────────────────

type CostoMenDetalle = Awaited<ReturnType<typeof getDetalleCostoMensual>>;

function costoMenFilas(comp: CostoMenDetalle): Row[] {
  return comp.componentes.map((c) => [
    `    ${c.label}`,
    formatMiles(c.actual),
    "",
    formatMiles(c.mesAnterior),
    "",
    formatMiles(c.variacion),
    pct(c.variacion !== 0 && c.mesAnterior !== 0 ? c.variacion / c.mesAnterior : null),
  ]);
}

function buildCostoMensual(
  data: Awaited<ReturnType<typeof getEstadoCostoMensual>>,
  detalles: Record<string, CostoMenDetalle>,
): { rows: Row[]; boldRows: number[]; grayRows: number[] } {
  const { periodoActual, periodoAnterior } = data;
  const colA = `${nombreMes(periodoActual.mes)} ${periodoActual.anio}`;
  const colB = `${nombreMes(periodoAnterior.mes)} ${periodoAnterior.anio}`;

  const rows: Row[] = [];
  const boldRows: number[] = [];
  const grayRows: number[] = [];

  const push = (...r: Row[]) => rows.push(...r);
  const bold = () => boldRows.push(rows.length - 1);
  const gray = () => grayRows.push(rows.length - 1);

  push(titulo("ESTADO DEL COSTO DE PRODUCCIÓN Y VENTAS MENSUAL"));
  push(subtitulo(`${colA} vs ${colB}`));
  push(SEP);
  push(["Concepto", colA, "% Vtas", colB, "% Vtas Ant.", "Variación", "% Variación"]); bold(); gray();
  push(SEP);

  // ── Costo MP Utilizada ──
  const mp = detalles["costo-mp-utilizada"];
  push([`COSTO MP UTILIZADA`, formatMiles(mp.totalActual), "", formatMiles(mp.totalAnterior), "", formatMiles(mp.totalActual - mp.totalAnterior), varPct(mp.totalActual, mp.totalAnterior)]); bold();
  push(...costoMenFilas(mp));
  push(SEP);

  // ── MOD ──
  const mod = detalles["costo-mod"];
  push([`COSTO M.O.D.`, formatMiles(mod.totalActual), "", formatMiles(mod.totalAnterior), "", formatMiles(mod.totalActual - mod.totalAnterior), varPct(mod.totalActual, mod.totalAnterior)]); bold();
  push(...costoMenFilas(mod));
  push(SEP);

  // ── CIF ──
  const cif = detalles["cif"];
  push([`CIF (COSTOS INDIRECTOS DE FABRICACIÓN)`, formatMiles(cif.totalActual), "", formatMiles(cif.totalAnterior), "", formatMiles(cif.totalActual - cif.totalAnterior), varPct(cif.totalActual, cif.totalAnterior)]); bold();
  push(...costoMenFilas(cif));
  push(SEP);

  // ── Totales del encadenamiento ──
  for (const f of data.filas) {
    push([
      f.label.toUpperCase(),
      formatMiles(f.actual),
      pct(f.porcentaje),
      formatMiles(f.mesAnterior),
      pct(f.porcentajeMesAnterior),
      formatMiles(f.variacion),
      pct(f.porcentajeVariacion),
    ]); bold(); if (f.destacado) gray();
  }

  return { rows, boldRows, grayRows };
}

// ─── Hoja: Costo Acumulado con detalle ──────────────────────────────────────

type CostoAcumDetalle = Awaited<ReturnType<typeof getDetalleCostoAcumulado>>;

function costoAcumFilas(comp: CostoAcumDetalle): Row[] {
  return comp.componentes.map((c) => [
    `    ${c.label}`,
    formatMiles(c.actual),
    "",
    formatMiles(c.anioAnterior),
    "",
    formatMiles(c.variacion),
    pct(c.variacion !== 0 && c.anioAnterior !== 0 ? c.variacion / c.anioAnterior : null),
  ]);
}

function buildCostoAcumulado(
  data: Awaited<ReturnType<typeof getEstadoCostoAcumulado>>,
  detalles: Record<string, CostoAcumDetalle>,
): { rows: Row[]; boldRows: number[]; grayRows: number[] } {
  const { periodoActual, periodoAnterior } = data;
  const colA = `Acum. ${periodoActual.anio}`;
  const colB = `Acum. ${periodoAnterior.anio}`;

  const rows: Row[] = [];
  const boldRows: number[] = [];
  const grayRows: number[] = [];

  const push = (...r: Row[]) => rows.push(...r);
  const bold = () => boldRows.push(rows.length - 1);
  const gray = () => grayRows.push(rows.length - 1);

  push(titulo("ESTADO DEL COSTO DE PRODUCCIÓN Y VENTAS ACUMULADO"));
  push(subtitulo(`Acumulado a ${periodoActual.mes}/${periodoActual.anio} vs ${periodoAnterior.mes}/${periodoAnterior.anio}`));
  push(SEP);
  push(["Concepto", colA, "% Vtas", colB, "% Vtas Ant.", "Variación", "% Variación"]); bold(); gray();
  push(SEP);

  const mp = detalles["costo-mp-utilizada"];
  push([`COSTO MP UTILIZADA`, formatMiles(mp.totalActual), "", formatMiles(mp.totalAnterior), "", formatMiles(mp.totalActual - mp.totalAnterior), varPct(mp.totalActual, mp.totalAnterior)]); bold();
  push(...costoAcumFilas(mp));
  push(SEP);

  const mod = detalles["costo-mod"];
  push([`COSTO M.O.D.`, formatMiles(mod.totalActual), "", formatMiles(mod.totalAnterior), "", formatMiles(mod.totalActual - mod.totalAnterior), varPct(mod.totalActual, mod.totalAnterior)]); bold();
  push(...costoAcumFilas(mod));
  push(SEP);

  const cif = detalles["cif"];
  push([`CIF (COSTOS INDIRECTOS DE FABRICACIÓN)`, formatMiles(cif.totalActual), "", formatMiles(cif.totalAnterior), "", formatMiles(cif.totalActual - cif.totalAnterior), varPct(cif.totalActual, cif.totalAnterior)]); bold();
  push(...costoAcumFilas(cif));
  push(SEP);

  for (const f of data.filas) {
    push([
      f.label.toUpperCase(),
      formatMiles(f.actual),
      pct(f.porcentaje),
      formatMiles(f.anioAnterior),
      pct(f.porcentajeAnioAnterior),
      formatMiles(f.variacion),
      pct(f.porcentajeVariacion),
    ]); bold(); if (f.destacado) gray();
  }

  return { rows, boldRows, grayRows };
}

// ─── Hoja: Resultados (Mensual & Acumulado) con detalle ─────────────────────

type FilaR = { label: string; actual: number; mesAnterior: number; destacado?: boolean };

function buildResultados(
  filas: FilaR[],
  detalles: {
    ventasNetas: FilaR[];
    costoVentas: FilaR[];
    gastosOperativos: FilaR[];
    ingresosNoOperativos: FilaR[];
    gastosNoOperativos: FilaR[];
  },
  tituloStr: string,
  subtituloStr: string,
  colA: string,
  colB: string,
): { rows: Row[]; boldRows: number[]; grayRows: number[] } {
  const rows: Row[] = [];
  const boldRows: number[] = [];
  const grayRows: number[] = [];

  const push = (...r: Row[]) => rows.push(...r);
  const bold = () => boldRows.push(rows.length - 1);
  const gray = () => grayRows.push(rows.length - 1);

  const detRow = (f: FilaR, indent = "    "): Row => [
    `${indent}${f.label}`,
    formatMiles(f.actual),
    formatMiles(f.mesAnterior),
    formatMiles(f.actual - f.mesAnterior),
    varPct(f.actual, f.mesAnterior),
  ];

  push(titulo(tituloStr));
  push(subtitulo(subtituloStr));
  push(SEP);
  push(["Concepto", colA, colB, "Variación", "% Variación"]); bold(); gray();
  push(SEP);

  // Map label → detail section
  const detailMap: Record<string, FilaR[]> = {
    "Ventas Netas": detalles.ventasNetas,
    "Costo de Ventas": detalles.costoVentas,
    "Gastos Operativos": detalles.gastosOperativos,
    "Ingresos No Operativos": detalles.ingresosNoOperativos,
    "Gastos No Operativos": detalles.gastosNoOperativos,
  };

  for (const f of filas) {
    push(detRow(f, "")); bold(); if (f.destacado) gray();
    const sub = detailMap[f.label];
    if (sub?.length) {
      push(...sub.map((s) => detRow(s)));
      push(SEP);
    }
  }

  return { rows, boldRows, grayRows };
}

// ─── Hoja: Balance con detalle ───────────────────────────────────────────────

function buildBalance(
  data: Awaited<ReturnType<typeof getBalanceGeneral>>,
  seccion: "activos" | "pasivosPatrimonio",
  tituloStr: string,
): { rows: Row[]; boldRows: number[]; grayRows: number[] } {
  const filas = data[seccion];
  const colA = `${data.periodoActual.anio}`;
  const colB = `${data.periodoAnterior.anio}`;

  const rows: Row[] = [];
  const boldRows: number[] = [];
  const grayRows: number[] = [];

  const push = (...r: Row[]) => rows.push(...r);
  const bold = () => boldRows.push(rows.length - 1);
  const gray = () => grayRows.push(rows.length - 1);

  push(titulo(tituloStr));
  push(subtitulo(`${colA} vs ${colB} — Cifras en miles de pesos`));
  push(SEP);
  push(["Concepto", colA, colB, "Variación", "% Variación"]); bold(); gray();
  push(SEP);

  for (const f of filas) {
    push([
      f.label,
      formatMiles(f.actual),
      formatMiles(f.anterior),
      formatMiles(f.actual - f.anterior),
      varPct(f.actual, f.anterior),
    ]); if (f.destacado) { bold(); gray(); }
  }

  return { rows, boldRows, grayRows };
}

// ─── Hoja: Cambios en el Patrimonio ─────────────────────────────────────────

function buildPatrimonio(
  data: Awaited<ReturnType<typeof getEstadoCambiosPatrimonio>>,
): { rows: Row[]; boldRows: number[]; grayRows: number[] } {
  const { periodo, filas } = data;

  const rows: Row[] = [];
  const boldRows: number[] = [];
  const grayRows: number[] = [];

  const push = (...r: Row[]) => rows.push(...r);
  const bold = () => boldRows.push(rows.length - 1);
  const gray = () => grayRows.push(rows.length - 1);

  push(titulo("ESTADO DE CAMBIOS EN EL PATRIMONIO"));
  push(subtitulo(`Al ${nombreMes(periodo.mes)} ${periodo.anio} — Cifras en miles de pesos`));
  push(SEP);
  push(["Concepto", "Capital Social", "Superávit Capital", "Reservas", "Resultados Ejercicio", "Ej. Anteriores", "Ut. Retenidas", "Total"]); bold(); gray();
  push(SEP);

  for (const f of filas) {
    push([
      f.label,
      formatMiles(f.valores.capitalSocial),
      formatMiles(f.valores.superavitCapital),
      formatMiles(f.valores.reservas),
      formatMiles(f.valores.resultadosEjercicio),
      formatMiles(f.valores.resultadosEjAnteriores),
      formatMiles(f.valores.utilidadesRetenidas),
      formatMiles(f.valores.total),
    ]); if (f.destacado) { bold(); gray(); }
  }

  return { rows, boldRows, grayRows };
}

// ─── Crear WorkSheet desde rows + estilos ────────────────────────────────────

function makeSheet(build: { rows: Row[]; boldRows: number[]; grayRows: number[] }): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(build.rows);
  return applyStyles(ws, build.boldRows, build.grayRows);
}

// ─── Handler GET ────────────────────────────────────────────────────────────

const RUBROS_MENSUAL = ["costo-mp-utilizada", "costo-mod", "cif"] as const;
const RUBROS_ACUMUL = ["costo-mp-utilizada", "costo-mod", "cif"] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const anio = Number(searchParams.get("anio") ?? new Date().getFullYear());
  const mes = Number(searchParams.get("mes") ?? new Date().getMonth() + 1);
  const empresa = searchParams.get("empresa") ?? DEFAULT_EMPRESA;
  const cur: Period = { anio, mes };

  // Fetch all data in parallel (detail calls are cache hits after main calls resolve)
  const [costoMen, costoAcum, resultMen, resultAcum, balance, patrimonio] = await Promise.all([
    getEstadoCostoMensual(cur, empresa),
    getEstadoCostoAcumulado(cur, empresa),
    getEstadoResultadosMensual(cur, empresa),
    getEstadoResultadosAcumulado(cur, empresa),
    getBalanceGeneral(cur, empresa),
    getEstadoCambiosPatrimonio(cur, empresa),
  ]);

  // Fetch detail rubros (cache hits — same SQL already ran above)
  const [detMenArr, detAcumArr] = await Promise.all([
    Promise.all(RUBROS_MENSUAL.map((r) => getDetalleCostoMensual(cur, r, empresa))),
    Promise.all(RUBROS_ACUMUL.map((r) => getDetalleCostoAcumulado(cur, r, empresa))),
  ]);

  const detMen = Object.fromEntries(RUBROS_MENSUAL.map((r, i) => [r, detMenArr[i]]));
  const detAcum = Object.fromEntries(RUBROS_ACUMUL.map((r, i) => [r, detAcumArr[i]]));

  // Build resultados columns
  const colAMen = `${nombreMes(resultMen.periodoActual.mes)} ${resultMen.periodoActual.anio}`;
  const colBMen = `${nombreMes(resultMen.periodoAnterior.mes)} ${resultMen.periodoAnterior.anio}`;
  const colAAcum = `Acum. ${resultAcum.periodoActual.anio}`;
  const colBAcum = `Acum. ${resultAcum.periodoAnterior.anio}`;

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, makeSheet(buildCostoMensual(costoMen, detMen)), "Costo Mensual");
  XLSX.utils.book_append_sheet(wb, makeSheet(buildCostoAcumulado(costoAcum, detAcum)), "Costo Acumulado");
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(buildResultados(
      resultMen.filas,
      resultMen.detalles,
      "ESTADO DE RESULTADO INTEGRAL MENSUAL",
      `${colAMen} vs ${colBMen}`,
      colAMen, colBMen,
    )),
    "Result. Mensual",
  );
  XLSX.utils.book_append_sheet(
    wb,
    makeSheet(buildResultados(
      resultAcum.filas,
      resultAcum.detalles,
      "ESTADO DE RESULTADO INTEGRAL ACUMULADO",
      `Acumulado a ${resultAcum.periodoActual.mes}/${resultAcum.periodoActual.anio} vs ${resultAcum.periodoAnterior.mes}/${resultAcum.periodoAnterior.anio}`,
      colAAcum, colBAcum,
    )),
    "Result. Acumulado",
  );
  XLSX.utils.book_append_sheet(wb, makeSheet(buildBalance(balance, "activos", "BALANCE GENERAL — ACTIVOS")), "Balance Activos");
  XLSX.utils.book_append_sheet(wb, makeSheet(buildBalance(balance, "pasivosPatrimonio", "BALANCE GENERAL — PASIVOS Y PATRIMONIO")), "Balance Pasivos");
  XLSX.utils.book_append_sheet(wb, makeSheet(buildPatrimonio(patrimonio)), "Cambios Patrimonio");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="Estados_Financieros_${nombreMes(mes)}_${anio}.xlsx"`,
    },
  });
}
