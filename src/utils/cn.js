import { twMerge } from "tailwind-merge";

/** Une clases CSS condicionales y resuelve conflictos de Tailwind. */
export function cn(...args) {
  return twMerge(
    args
      .flatMap((arg) => {
        if (!arg) return [];
        if (typeof arg === "string") return [arg];
        if (typeof arg === "object") {
          return Object.keys(arg).filter((key) => arg[key]);
        }
        return [];
      })
      .join(" ")
  );
}