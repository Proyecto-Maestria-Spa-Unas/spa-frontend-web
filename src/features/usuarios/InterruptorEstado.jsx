import { cn } from "../../utils/cn";

/**
 * Botón deslizante para activar o desactivar una cuenta (manual de marca, 5.8).
 * Es un interruptor accesible: role="switch" con aria-checked, operable con teclado.
 */
export function InterruptorEstado({ activo, nombre, deshabilitado, titulo, onCambiar }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={`Cuenta de ${nombre}`}
      disabled={deshabilitado}
      title={titulo}
      onClick={onCambiar}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-primario focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        activo ? "bg-estado-disponible-texto" : "bg-estado-descontinuado-texto",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-marca-superficie shadow transition-transform",
          activo ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
