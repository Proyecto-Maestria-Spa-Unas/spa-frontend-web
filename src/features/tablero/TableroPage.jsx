/**
 * HU-10, RF-17, RF-18, RF-19 · Alertas y tablero
 * Responsable: Estefa44445 · API: src/api/analitica.js
 * Endpoints: GET /alertas, /alertas/resumen (X4, listo); /analitica/proveedores-cercanos (X6, listo); /analitica/exportar (X5, listo); /analitica/tablero, /analitica/consumo, /analitica/cobertura (F15, listo)
 * Ver README.md de esta carpeta para el alcance y los criterios.
 */
import { useAuth } from "../auth/AuthContext";
import { ExportarDatos } from "./ExportarDatos";
import { ListaAlertas } from "./ListaAlertas";
import { MapaProveedores } from "./MapaProveedores";
import { TableroDecisiones } from "./TableroDecisiones";

export function TableroPage() {
  const { tiene } = useAuth();
  return (
    <section>
      <h2 className="font-heading text-[1.375rem] font-semibold text-marca-texto">Alertas y tablero</h2>
      <ListaAlertas />
      {/* Gráficos de decisión (F15): requieren analitica.consultar, como el mapa y la exportación. */}
      {tiene("analitica.consultar") && <TableroDecisiones />}
      <ExportarDatos />
      {/* El mapa sirve para reponer (compras) y para la vista del Gerente: no se muestra a la Manicurista. */}
      {tiene("analitica.consultar") && <MapaProveedores />}
    </section>
  );
}
