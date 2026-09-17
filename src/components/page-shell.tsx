import type { Period } from "@/lib/data/estado-costo-mensual";
import { MainNav } from "./main-nav";
import { PeriodoSelector } from "./periodo-selector";
import { signOut } from "@/app/actions";

export function PageShell({
  current,
  titulo,
  subtitulo,
  periodos,
  actual,
  children,
}: {
  current: string;
  titulo: string;
  subtitulo?: string;
  periodos: Period[];
  actual: Period;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
        <h1 className="text-sm font-semibold text-slate-500">Estados Financieros</h1>
        <form action={signOut}>
          <button type="submit" className="text-sm text-slate-500 hover:text-slate-800">
            Cerrar sesión
          </button>
        </form>
      </header>

      <MainNav current={current} />

      <main className="mx-auto max-w-6xl px-8 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">{titulo}</h2>
            {subtitulo && <p className="text-sm text-slate-500">{subtitulo}</p>}
          </div>
          <PeriodoSelector periodos={periodos} actual={actual} />
        </div>

        {children}
      </main>
    </div>
  );
}
