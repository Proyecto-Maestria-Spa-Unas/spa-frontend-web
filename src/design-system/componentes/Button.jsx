import { cn } from "../../utils/cn";

const VARIANTES = {
  primary: "bg-marca-primario text-white hover:bg-marca-primario-hover",
  secondary: "bg-marca-superficie text-marca-texto border border-marca-borde hover:bg-white",
  danger: "bg-estado-agotado-texto text-white hover:opacity-90",
};

export function Button({ variant = "primary", className, ...props }) {
  return (
    <button
      className={cn("rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50", VARIANTES[variant], className)}
      {...props}
    />
  );
}
