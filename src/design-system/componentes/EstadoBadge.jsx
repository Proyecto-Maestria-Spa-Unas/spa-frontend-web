import { ESTADO_INVENTARIO } from "../estados";
import { cn } from "../../utils/cn";

/** Estado del inventario con texto + ícono + color (no depende solo del color). */
export function EstadoBadge({ estado }) {
  const e = ESTADO_INVENTARIO[estado];
  if (!e) return null;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", e.clases)}>
      <span aria-hidden="true">{e.icono}</span>
      {e.etiqueta}
    </span>
  );
}
