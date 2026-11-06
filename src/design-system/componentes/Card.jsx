import { useId } from "react";
import { cn } from "../../utils/cn";

/**
 * Tarjeta contenedora con título y pie opcionales.
 * Con `title` la sección queda nombrada para lectores de pantalla.
 * `as` permite cambiar la etiqueta HTML (por defecto, section).
 */
export function Card({ title, footer, children, className, as: Tag = "section", ...props }) {
  const titleId = useId();

  return (
    <Tag
      aria-labelledby={title ? titleId : undefined}
      className={cn("rounded-xl bg-marca-superficie shadow", className)}
      {...props}
    >
      {title && (
        <h3 id={titleId} className="border-b border-marca-borde px-6 py-4 text-base font-semibold text-marca-texto">
          {title}
        </h3>
      )}
      <div className="px-6 py-4 text-sm text-marca-texto">{children}</div>
      {footer && <div className="border-t border-marca-borde px-6 py-3">{footer}</div>}
    </Tag>
  );
}
