const FORMATO_CANTIDAD = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 3 });

/** "350.000" → "350"; "2.500" → "2,5". La API manda las cantidades como texto decimal con 3 decimales. */
export function formatoCantidad(valor) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? FORMATO_CANTIDAD.format(numero) : String(valor ?? "");
}

/** Texto del contador del menú: de 100 en adelante muestra "99+" para no ensanchar el menú. */
export function textoContador(total) {
  return total > 99 ? "99+" : String(total);
}
