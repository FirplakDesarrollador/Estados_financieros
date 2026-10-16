export function formatPesos(value: number): string {
  const abs = Math.round(Math.abs(value)).toLocaleString("es-CO");
  const text = `$${abs}`;
  return value < 0 ? `(${text})` : text;
}

export function formatMiles(value: number): string {
  const scaled = Math.round(value / 1000);
  const formatted = Math.abs(scaled).toLocaleString("es-CO");
  const text = `$${formatted} mil`;
  return scaled < 0 ? `(${text})` : text;
}

export function formatPorcentaje(value: number | null): string {
  if (value === null) return "";
  return `${(value * 100).toLocaleString("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} %`;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function nombreMes(mes: number): string {
  return MESES[mes - 1] ?? String(mes);
}

export { MESES };
