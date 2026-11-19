"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { EMPRESAS, type EmpresaId } from "@/lib/companies";

export function EmpresaSelector({ actual }: { actual: EmpresaId }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(id: EmpresaId) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("empresa", id);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
      {EMPRESAS.map((e) => (
        <button
          key={e.id}
          onClick={() => handleChange(e.id)}
          className={
            actual === e.id
              ? "rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
              : "rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          }
        >
          {e.nombreCorto}
        </button>
      ))}
    </div>
  );
}
