import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../utils/cn";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Ventana emergente accesible (role="dialog").
 * - Se cierra con Escape, con el botón "Cerrar" o al hacer clic en el fondo.
 * - Al abrir, el foco pasa al diálogo y queda atrapado dentro; al cerrar vuelve
 *   al elemento que lo abrió.
 * - Bloquea el scroll de la página mientras está abierto.
 */
export function Modal({ open, onClose, title, children, footer, className }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;

    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;

      const items = dialog.querySelectorAll(FOCUSABLE);
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === dialog)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-marca-texto/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("w-full max-w-lg rounded-xl bg-marca-superficie shadow-xl focus:outline-none", className)}
      >
        <div className="flex items-center justify-between border-b border-marca-borde px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-marca-texto">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => onClose?.()}
            className="rounded px-2 text-marca-texto hover:bg-marca-borde/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-primario"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        <div className="px-6 py-4 text-sm text-marca-texto">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-marca-borde px-6 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
