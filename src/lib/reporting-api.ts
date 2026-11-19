import { cache } from "react";

// Cliente de la Reporting API de Firplak (repositorio firplak-reporting-api). Los datos salen de
// Planos_Symphony.dbo.Informe_balance e Informe_cuentas_14_74, que actualizan los jobs del SQL Server
// Agent todos los días a las 5:00. Solo corre en el servidor: el token nunca llega al navegador.

export type BalanceApiRow = {
  code: string;
  level: number;
  lvl1: string;
  lvl2: string | null;
  lvl3: string | null;
  lvl4: string | null;
  account: string | null;
  name: string;
  openingBalance: number;
  debit: number;
  credit: number;
  monthBalance: number;
  closingBalance: number;
  date: string;
};

type BalanceApiResponse = {
  period: { year: number; month: number };
  rows: BalanceApiRow[];
  previousYear: { period: { year: number; month: number }; rows: BalanceApiRow[] };
  periods: Array<{ year: number; month: number }>;
  loadedAt: string | null;
};

export type CuentaApiTotals = { account: string; name: string; debit: number; credit: number; balance: number; rows: number };

type Cuentas1474ApiResponse = {
  summary: { debit: number; credit: number; balance: number; rows: number; byAccount: CuentaApiTotals[] };
  loadedAt: string | null;
};

async function apiGet<T>(path: string, params: Record<string, string | number>): Promise<T> {
  const base = process.env.REPORTING_API_URL?.trim().replace(/\/+$/, "");
  const token = process.env.REPORTING_API_TOKEN?.trim();
  if (!base || !token) {
    throw new Error("Faltan REPORTING_API_URL o REPORTING_API_TOKEN en el entorno");
  }

  const url = new URL(base + path);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) {
    // Sin el cuerpo completo: la API ya responde sin detalles internos.
    throw new Error(`Reporting API ${res.status} en ${path}`);
  }
  return res.json() as Promise<T>;
}

// Un mes del balance (todos los niveles) y el mismo mes del año anterior. cache() evita repetir la
// llamada cuando varias partes de la misma página piden el mismo mes.
export const getBalanceMes = cache(
  (anio: number, mes: number): Promise<BalanceApiResponse> => apiGet("/api/v1/balance", { anio, mes }),
);

// Débito, crédito y saldo por cuenta de las cuentas 14 y 74 entre dos fechas (yyyy-mm-dd, inclusive).
export const getCuentas1474PorCuenta = cache(
  async (desde: string, hasta: string): Promise<CuentaApiTotals[]> => {
    const res = await apiGet<Cuentas1474ApiResponse>("/api/v1/cuentas-14-74", {
      fechaDesde: desde,
      fechaHasta: hasta,
      pageSize: 1,
    });
    return res.summary.byAccount;
  },
);
