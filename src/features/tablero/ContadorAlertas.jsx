/**
 * RF-18 · Contador de alertas del menú (X4)
 * API: GET /alertas/resumen  (src/api/analitica.js → resumenAlertas)
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { resumenAlertas } from "../../api/analitica";
import { textoContador } from "./formato";

const REFRESCO_MS = 60_000;

/**
 * Número de productos en alerta junto a la opción del menú. Se actualiza al cambiar de pantalla y cada minuto.
 * Si la consulta falla conserva el último valor: un error de alertas no debe estorbar el resto de la aplicación.
 * No se muestra cuando no hay alertas. `intervaloMs` solo se cambia en las pruebas.
 */
export function ContadorAlertas({ intervaloMs = REFRESCO_MS }) {
  const { pathname } = useLocation();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let vigente = true;
    const cargar = () =>
      resumenAlertas()
        .then((resumen) => vigente && setTotal(resumen.total))
        .catch(() => {});
    cargar();
    const temporizador = setInterval(cargar, intervaloMs);
    return () => {
      vigente = false;
      clearInterval(temporizador);
    };
  }, [pathname, intervaloMs]);

  if (total <= 0) return null;

  return (
    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-estado-agotado-fondo px-1.5 text-xs font-semibold text-estado-agotado-texto">
      <span aria-hidden="true">{textoContador(total)}</span>
      <span className="sr-only">
        {total} {total === 1 ? "alerta" : "alertas"} de stock
      </span>
    </span>
  );
}
