/* ============================================
   EVM DASHBOARD — Formateadores
   ============================================ */

/**
 * Formatea un valor como moneda USD.
 * Ejemplo: 50000 → "$50,000.00"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formatea un valor como porcentaje con 2 decimales.
 * Ejemplo: 75 → "75.00%"
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

/**
 * Formatea CPI/SPI con 2 decimales.
 * Ejemplo: 1.3333 → "1.33"
 * Si es null/undefined → "—"
 */
export function formatIndex(value: number | null | undefined): string {
  if (value === null || value === undefined) return '\u2014';
  return value.toFixed(2);
}

/**
 * Formatea una fecha ISO a formato legible.
 * Ejemplo: "2026-07-26T..." → "26 Jul 2026"
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
}

/**
 * Formatea valores para el eje Y de la gráfica.
 * Ejemplo: 50000 → "$50k", 1000000 → "$1.0M"
 */
export function formatYAxis(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
}
