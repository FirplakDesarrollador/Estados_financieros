import { redirect } from "next/navigation";

// Ruta antigua: el Balance General ahora se muestra unificado en /balance-general.
export default async function BalancePasivosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const qs = new URLSearchParams(await searchParams).toString();
  redirect(`/balance-general${qs ? `?${qs}` : ""}`);
}
