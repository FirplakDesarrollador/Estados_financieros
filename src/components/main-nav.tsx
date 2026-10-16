const SECCIONES = [
  { href: "/", label: "Estado del Costo Mensual", ready: true },
  { href: "/costo-acumulado", label: "Estado del Costo Acumulado", ready: true },
  { href: "/resultados-mensual", label: "Estado de Resultados Mensual", ready: true },
  { href: "/resultados-acumulado", label: "Estado de Resultados Acumulado", ready: false },
  { href: "/balance-activos", label: "Balance General Activos", ready: true },
  { href: "/balance-pasivos", label: "Balance General Pasivos y Patrimonio", ready: true },
];

export function MainNav({ current }: { current: string }) {
  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-200 bg-white px-8">
      {SECCIONES.map((s) =>
        s.ready ? (
          <a
            key={s.href}
            href={s.href}
            className={`border-b-2 px-3 py-3 text-sm font-medium ${
              current === s.href
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {s.label}
          </a>
        ) : (
          <span
            key={s.href}
            title="Próximamente"
            className="cursor-not-allowed border-b-2 border-transparent px-3 py-3 text-sm text-slate-300"
          >
            {s.label}
          </span>
        ),
      )}
    </nav>
  );
}
