// ─── Configuración de empresas ───────────────────────────────────────────────
// Para agregar una nueva empresa: añadir un elemento a EMPRESAS, su id a
// EMPRESA_SINGLE_IDS y su valor del parámetro empresa de la Reporting API en
// EMPRESA_API (src/lib/data/fuente.ts). Para el Consolidado no se agrega nada —
// se calcula automáticamente sumando todas las empresas de EMPRESA_SINGLE_IDS.

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

export function getEmpresa(id: EmpresaId): Empresa {
  return EMPRESAS.find((e) => e.id === id) ?? EMPRESAS[0];
}

export function isConsolidado(empresa: EmpresaId): boolean {
  return empresa === "consolidado";
}
