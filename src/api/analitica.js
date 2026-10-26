/** S4 · Alertas y analítica · contrato docs/openapi/analitica-v1.yaml (spa-backend-api). */
import { apiClient, datos } from "./cliente";

export const listarAlertas = (estado) => datos(apiClient.get("/alertas", { params: { estado } }));
export const resumenAlertas = () => datos(apiClient.get("/alertas/resumen"));
export const tablero = () => datos(apiClient.get("/analitica/tablero"));
/** agruparPor: "categoria" | "producto" | "dia"; fechas en formato AAAA-MM-DD */
export const consumo = (desde, hasta, agruparPor = "categoria") =>
  datos(apiClient.get("/analitica/consumo", { params: { desde, hasta, agrupar_por: agruparPor } }));
export const cobertura = () => datos(apiClient.get("/analitica/cobertura"));
/** Kardex valorizado por costo promedio ponderado (DEC-11). Fechas AAAA-MM-DD opcionales. */
export const kardex = (productoId, desde, hasta) =>
  datos(apiClient.get("/analitica/kardex", { params: { producto_id: productoId, desde, hasta } }));
/** GeoJSON FeatureCollection: úselo directo en Leaflet (L.geoJSON) o descárguelo para QGIS/ArcGIS. */
export const proveedoresCercanos = (latitud, longitud, radioKm = 10) =>
  datos(apiClient.get("/analitica/proveedores-cercanos", { params: { latitud, longitud, radio_km: radioKm } }));
/** Devuelve un Blob para descargar. conjunto: "inventario" | "movimientos"; formato: "csv" | "parquet" */
export const exportar = (conjunto, formato = "csv") =>
  datos(apiClient.get("/analitica/exportar", { params: { conjunto, formato }, responseType: "blob" }));
