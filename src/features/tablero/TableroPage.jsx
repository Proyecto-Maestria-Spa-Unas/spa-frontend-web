/**
 * HU-10, RF-17, RF-18, RF-19 · Alertas y tablero
 * Responsable: Estefa44445 · API: src/api/analitica.js
 * Endpoints: GET /alertas, /alertas/resumen (X4, listo); /analitica/proveedores-cercanos (X6, listo); /analitica/tablero, /analitica/cobertura, /analitica/exportar (pendientes)
 * Ver README.md de esta carpeta para el alcance y los criterios.
 */
import { ListaAlertas } from "./ListaAlertas";
import { MapaProveedores } from "./MapaProveedores";

export function TableroPage() {
  return (
    <section>
      <h2 className="font-heading text-[1.375rem] font-semibold text-marca-texto">Alertas y tablero</h2>
      <ListaAlertas />
      <MapaProveedores />
      {/* Tablero de decisiones (indicadores, consumo y cobertura): pendiente en otra entrega. */}
    </section>
  );
}
