import { cn } from "../../utils/cn";

const VARIANTES = {
  primary: `
    bg-marca-primario text-white
    enabled:hover:bg-marca-primario-hover
    enabled:hover:shadow-md
  `,
  secondary: `
    bg-marca-superficie text-marca-texto
    border border-marca-borde
    enabled:hover:bg-marca-primario/10
    enabled:hover:border-marca-primario
    enabled:hover:text-marca-primario
    enabled:hover:shadow-sm
  `,
  danger: `
    bg-estado-agotado-texto text-white
    enabled:hover:opacity-90
    enabled:hover:shadow-md
  `,
};

export function Button({ variant = "primary", className, ...props }) {
  return (
    <button
      className={cn(
        `
          inline-flex items-center justify-center
          rounded-lg px-5 py-2.5
          text-sm font-semibold
          transition-all duration-200 ease-in-out
          enabled:hover:-translate-y-0.5
          enabled:active:translate-y-0
          enabled:active:scale-[0.98]
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-marca-primario
          focus-visible:ring-offset-2
          disabled:cursor-not-allowed
          disabled:opacity-50
        `,
        VARIANTES[variant],
        className,
      )}
      {...props}
    />
  );
}