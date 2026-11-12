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

  const url = `https://api.supabase.com/v1/projects/${ref}/database/query`;
  const init = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
    cache: "no-store" as RequestCache,
  };

  // Retry with exponential backoff on 429 (rate limit)
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, init);

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? 0);
      const delay = retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Supabase Management API error ${res.status}: ${text}`);
    }

    return res.json();
  }

  throw new Error("Supabase Management API: demasiadas solicitudes (429) después de 5 reintentos");
}
