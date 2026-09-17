// TEMPORAL: ejecuta SQL contra el proyecto de Supabase via la Management API,
// mientras el schema "estados financieros" no está expuesto en PostgREST
// (Project Settings > API > Exposed schemas). Una vez expuesto, reemplazar
// por consultas normales con supabase-js + SUPABASE_SERVICE_ROLE_KEY.
export async function runManagementSql<T = Record<string, unknown>>(query: string): Promise<T[]> {
  const ref = process.env.SUPABASE_PROJECT_REF;
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!ref || !token) {
    throw new Error("Faltan SUPABASE_PROJECT_REF o SUPABASE_ACCESS_TOKEN en el entorno");
  }

  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase Management API error ${res.status}: ${text}`);
  }

  return res.json();
}
