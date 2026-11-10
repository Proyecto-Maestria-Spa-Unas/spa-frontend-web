import { useId } from "react";
import { cn } from "../../utils/cn";

/**
 * Tarjeta contenedora con título y pie opcionales.
 * Con `title` la sección queda nombrada para lectores de pantalla.
 * `as` permite cambiar la etiqueta HTML (por defecto, section).
 * `headingLevel` es el nivel del título (por defecto 3, debajo del h2 de la pantalla; en el login es 2).
 */
export function Card({ title, headingLevel = 3, footer, children, className, as: Tag = "section", ...props }) {
  const titleId = useId();
  const Heading = `h${headingLevel}`;

  return (
    <Tag
      aria-labelledby={title ? titleId : undefined}
      className={cn("rounded-xl bg-marca-superficie shadow", className)}
      {...props}
    >
      {title && (
        <Heading id={titleId} className="border-b border-marca-borde px-6 py-4 font-heading text-lg font-semibold text-marca-primario-hover">
          {title}
        </Heading>
      )}
      <div className="px-6 py-4 text-sm text-marca-texto">{children}</div>
      {footer && <div className="border-t border-marca-borde px-6 py-3">{footer}</div>}
    </Tag>
  );
}
