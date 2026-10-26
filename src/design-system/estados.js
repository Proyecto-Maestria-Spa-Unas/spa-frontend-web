/**
 * Los 4 estados del inventario (RN-08..RN-11). F3 · Gleidy725: reemplazar las clases por los tokens
 * de marca definidos en tokens.css. Cada estado lleva texto e ícono además del color (WCAG 2.2 AA).
 */
export const ESTADO_INVENTARIO = Object.freeze({
  DISPONIBLE: { etiqueta: "Disponible", icono: "●", clases: "bg-estado-disponible-fondo text-estado-disponible-texto" },
  BAJO_STOCK: { etiqueta: "Bajo stock", icono: "▲", clases: "bg-estado-bajo-fondo text-estado-bajo-texto" },
  AGOTADO: { etiqueta: "Agotado", icono: "■", clases: "bg-estado-agotado-fondo text-estado-agotado-texto" },
  DESCONTINUADO: { etiqueta: "Descontinuado", icono: "—", clases: "bg-estado-descontinuado-fondo text-estado-descontinuado-texto" },
});
