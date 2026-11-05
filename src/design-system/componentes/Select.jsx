import { useId } from "react";
import { cn } from "../../utils/cn";
import { ESTILOS_CAMPO } from "./estilosCampo";

/**
 * Lista desplegable accesible.
 * `options` es un arreglo de { value, label }. Con `placeholder` se agrega una
 * primera opción vacía. `className` se aplica al contenedor.
 */
export function Select({ label, hint, error, id, options = [], placeholder, className, required, ref, ...props }) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={selectId} className={ESTILOS_CAMPO.etiqueta}>
          {label}
          {required && (
            <span aria-hidden="true" className={ESTILOS_CAMPO.obligatorio}>
              {" *"}
            </span>
          )}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy}
        className={cn(ESTILOS_CAMPO.control, error ? ESTILOS_CAMPO.bordeError : ESTILOS_CAMPO.borde)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
