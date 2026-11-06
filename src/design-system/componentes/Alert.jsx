import { cn } from "../../utils/cn";

// Cada variante usa los tokens de estado y lleva ícono además del color
// (no depende solo del color, igual que EstadoBadge). Errores y advertencias se
// anuncian de inmediato (role="alert"); el resto, sin interrumpir (role="status").
const VARIANTES = Object.freeze({
  info: {
    rol: "status",
    icono: "ℹ",
    clases: "border-estado-descontinuado-texto/30 bg-estado-descontinuado-fondo text-estado-descontinuado-texto",
  },
  success: {
    rol: "status",
    icono: "●",
    clases: "border-estado-disponible-texto/30 bg-estado-disponible-fondo text-estado-disponible-texto",
  },
  warning: {
    rol: "alert",
    icono: "▲",
    clases: "border-estado-bajo-texto/30 bg-estado-bajo-fondo text-estado-bajo-texto",
  },
  error: {
    rol: "alert",
    icono: "■",
    clases: "border-estado-agotado-texto/30 bg-estado-agotado-fondo text-estado-agotado-texto",
  },
});

/**
 * Mensaje de aviso. Variantes: info, success, warning, error.
 * Con `onClose` muestra un botón para descartarlo.
 */
export function Alert({ variant = "info", title, children, onClose, className }) {
  const v = VARIANTES[variant] ?? VARIANTES.info;

  return (
    <div role={v.rol} className={cn("flex items-start gap-3 rounded-lg border px-4 py-3 text-sm", v.clases, className)}>
      <span aria-hidden="true">{v.icono}</span>
      <div className="flex-1">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div>{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Cerrar alerta"
          onClick={onClose}
          className="rounded px-1 hover:bg-marca-superficie/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-primario"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </div>
  );
}
