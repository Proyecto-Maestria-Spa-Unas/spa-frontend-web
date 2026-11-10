/**
 * HU-10, RF-17, RF-18, RF-19 · Alertas y tablero
 * Responsable: Estefa44445 · API: src/api/analitica.js
 * Endpoints: GET /alertas, /alertas/resumen (X4, listo); /analitica/proveedores-cercanos (X6, listo); /analitica/exportar (X5, listo); /analitica/tablero, /analitica/consumo, /analitica/cobertura (F15, listo)
 * Ver README.md de esta carpeta para el alcance y los criterios.
 */
import { EncabezadoPagina } from "../../design-system/componentes/EncabezadoPagina";
import { useAuth } from "../auth/AuthContext";
import { ExportarDatos } from "./ExportarDatos";
import { ListaAlertas } from "./ListaAlertas";
import { MapaProveedores } from "./MapaProveedores";
import { TableroDecisiones } from "./TableroDecisiones";

// Calendario con señal de advertencia (trazos de 24x24, mismo estilo de línea que el ícono de Inventario).
const ICONO_ALERTAS = (
  <>
    <rect x="3" y="4" width="14" height="15" rx="2" />
    <path d="M7 2v4M13 2v4M3 9h14" />
    <path d="M19 12.5 22 18h-6l3-5.500Z" />
    <path d="M19 14.500v1.500M19 17.500v.01" />
  </>
);

export function TableroPage() {
  const { tiene } = useAuth();
  return (
    <section>
      <EncabezadoPagina
        icono={ICONO_ALERTAS}
        titulo="Alertas y tablero"
        descripcion="Revisa los productos por reponer, analiza el consumo y exporta los datos."
      />
      <ListaAlertas />
      {/* Gráficos de decisión (F15): requieren analitica.consultar, como el mapa y la exportación. */}
      {tiene("analitica.consultar") && <TableroDecisiones />}
      <ExportarDatos />
      {/* El mapa sirve para reponer (compras) y para la vista del Gerente: no se muestra a la Manicurista. */}
      {tiene("analitica.consultar") && <MapaProveedores />}
    </section>
  );
}
