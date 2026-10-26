/** S4 · Alertas y analítica · contrato docs/openapi/analitica-v1.yaml (spa-backend-api). */
import { apiClient, datos } from "./cliente";

export const listarAlertas = (estado) => datos(apiClient.get("/alertas", { params: { estado } }));
export const resumenAlertas = () => datos(apiClient.get("/alertas/resumen"));
export const tablero = () => datos(apiClient.get("/analitica/tablero"));
/** agruparPor: "categoria" | "producto" | "dia"; fechas en formato AAAA-MM-DD */
export const consumo = (desde, hasta, agruparPor = "categoria") =>
  datos(apiClient.get("/analitica/consumo", { params: { desde, hasta, agrupar_por: agruparPor } }));
export const cobertura = () => datos(apiClient.get("/analitica/cobertura"));
/** Devuelve un Blob para descargar. conjunto: "inventario" | "movimientos"; formato: "csv" | "parquet" */
export const exportar = (conjunto, formato = "csv") =>
  datos(apiClient.get("/analitica/exportar", { params: { conjunto, formato }, responseType: "blob" }));
