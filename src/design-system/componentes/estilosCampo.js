/**
 * Estilos compartidos por Input y Select. Solo usan tokens de tokens.css
 * (marca-*, estado-*): ningún color hexadecimal ni clase de color de Tailwind suelta.
 */
export const ESTILOS_CAMPO = Object.freeze({
  etiqueta: "mb-1 block text-sm font-medium text-marca-texto",
  obligatorio: "text-estado-agotado-texto",
  ayuda: "mt-1 text-xs text-marca-texto",
  error: "mt-1 text-xs text-estado-agotado-texto",
  control:
    "w-full rounded-lg border bg-marca-superficie px-3 py-2 text-sm text-marca-texto placeholder:text-marca-texto/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-primario disabled:cursor-not-allowed disabled:bg-estado-descontinuado-fondo",
  borde: "border-marca-borde",
  bordeError: "border-estado-agotado-texto",
});
