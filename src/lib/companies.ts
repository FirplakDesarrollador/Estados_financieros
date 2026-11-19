// ─── Configuración de empresas ───────────────────────────────────────────────
// Para agregar una nueva empresa: añadir un elemento a EMPRESAS y su id a
// EMPRESA_SINGLE_IDS. Para el Consolidado no se agrega nada — se calcula
// automáticamente sumando todas las empresas de EMPRESA_SINGLE_IDS.

export type EmpresaId = string;

export type Empresa = {
  id: EmpresaId;
  nombre: string;
  nombreCorto: string;
};

// Empresas individuales (sin el consolidado)
export const EMPRESA_SINGLE_IDS = ["firplak", "empresa2"] as const;
export type SingleEmpresaId = (typeof EMPRESA_SINGLE_IDS)[number];

export const EMPRESAS: Empresa[] = [
  { id: "firplak",      nombre: "Firplak S.A.S.",   nombreCorto: "Firplak" },
  { id: "empresa2",     nombre: "Viventta",             nombreCorto: "Viventta" },
  { id: "consolidado",  nombre: "Consolidado",         nombreCorto: "Consol." },
];

export const DEFAULT_EMPRESA: EmpresaId = "firplak";

// ─── Filtro SQL por empresa ───────────────────────────────────────────────────
// TODO: actualizar EMPRESA_SQL_COL con el nombre real de la columna una vez
// se confirme la estructura del export de SAP para la segunda empresa.
// Mientras sea null, no se aplica filtro (comportamiento actual, solo Firplak).
//
// Valor esperado: algo como "empresa_id", "nit", "company_code", etc.
export const EMPRESA_SQL_COL: string | null = null;

// Valor SQL que identifica a cada empresa en esa columna.
// Actualizar cuando se confirme la estructura.
export const EMPRESA_SQL_VALUES: Record<SingleEmpresaId, string> = {
  firplak:  "FIRPLAK",  // TODO: confirmar valor real
  empresa2: "EMPRESA2", // TODO: confirmar valor real
};

export function getEmpresaWhere(empresa: EmpresaId): string {
  if (!EMPRESA_SQL_COL) return "";
  if (empresa === "consolidado") return "";
  const val = EMPRESA_SQL_VALUES[empresa as SingleEmpresaId];
  if (!val) return "";
  return ` AND ${EMPRESA_SQL_COL} = '${val}'`;
}

export function getEmpresa(id: EmpresaId): Empresa {
  return EMPRESAS.find((e) => e.id === id) ?? EMPRESAS[0];
}

export function isConsolidado(empresa: EmpresaId): boolean {
  return empresa === "consolidado";
}
