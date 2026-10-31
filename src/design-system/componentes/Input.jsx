import { useId } from "react";
import { cn } from "../../utils/cn";
import { ESTILOS_CAMPO } from "./estilosCampo";

/**
 * Campo de texto accesible: etiqueta asociada, ayuda y error enlazados con ARIA.
 * `className` se aplica al contenedor; el resto de props van al <input>.
 */
export function Input({ label, hint, error, id, className, required, ref, ...props }) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className={ESTILOS_CAMPO.etiqueta}>
          {label}
          {required && (
            <span aria-hidden="true" className={ESTILOS_CAMPO.obligatorio}>
              {" *"}
            </span>
          )}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={cn(ESTILOS_CAMPO.control, error ? ESTILOS_CAMPO.bordeError : ESTILOS_CAMPO.borde)}
        {...props}
      />
      {hint && (
        <p id={hintId} className={ESTILOS_CAMPO.ayuda}>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className={ESTILOS_CAMPO.error}>
          {error}
        </p>
      )}
    </div>
  );
}
