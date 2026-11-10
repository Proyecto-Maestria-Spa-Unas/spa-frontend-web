import { useCallback, useEffect, useState } from "react";
import { mensajeIndicador } from "./indicadores";

/**
 * Carga datos de la API: { estado: "cargando" | "error" | "listo", datos, error, reintentar }.
 * `cargar` debe cambiar solo cuando cambia lo que se consulta (envolverla en useCallback).
 */
export function useDatos(cargar) {
  const [resultado, setResultado] = useState({ estado: "cargando", datos: null, error: "" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let vigente = true;
    cargar()
      .then((datos) => vigente && setResultado({ estado: "listo", datos, error: "" }))
      .catch((error) => vigente && setResultado({ estado: "error", datos: null, error: mensajeIndicador(error) }));
    return () => {
      vigente = false;
    };
  }, [cargar, intento]);

  const reintentar = useCallback(() => {
    setResultado((r) => ({ ...r, estado: "cargando" }));
    setIntento((n) => n + 1);
  }, []);

  return { ...resultado, reintentar };
}
