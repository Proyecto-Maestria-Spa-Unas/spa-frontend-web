/** Opciones de registros por página (manual de marca, 4.3 Tablas). */
export const TAMANOS_PAGINA = [10, 25, 50];

/** Números de página a mostrar: hasta 5, centrados en la página actual. */
export function numerosDePagina(actual, total, maximo = 5) {
  const cantidad = Math.min(maximo, total);
  const inicio = Math.min(Math.max(1, actual - Math.floor(cantidad / 2)), total - cantidad + 1);
  return Array.from({ length: cantidad }, (_, i) => inicio + i);
}
