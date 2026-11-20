import type { EstadoResultadosAcumulado } from "@/lib/data/estado-resultados-acumulado";
import { SubDetalleResultadoAcumuladoTable } from "./sub-detalle-resultado-acumulado-table";

export function DetalleResultadoAcumuladoTable({
  data,
  empresa,
}: {
  data: EstadoResultadosAcumulado;
  empresa?: string;
}) {
  const ventasNetas = data.filas[0];
  const utOp = data.filas[4];
  const ingresosNoOp = data.filas[5];
  const gastosNoOp = data.filas[6];
  const utAntes = data.filas[7];

  const links: Record<string, string> = {
    [utOp?.label]: "utilidad-operacional",
    [ingresosNoOp?.label]: "ingresos-no-operativos",
    [gastosNoOp?.label]: "gastos-no-operativos",
  };

  const filas = [utOp, ingresosNoOp, gastosNoOp, utAntes].filter(Boolean);

  return (
    <SubDetalleResultadoAcumuladoTable
      filas={filas}
      periodoActual={data.periodoActual}
      periodoAnterior={data.periodoAnterior}
      ventasActual={ventasNetas?.actual}
      ventasAnterior={ventasNetas?.mesAnterior}
      links={links}
      empresa={empresa}
    />
  );
}
