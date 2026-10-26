/** S3 · Movimientos · contrato docs/openapi/movimientos-v1.yaml (spa-backend-api). */
import { apiClient, datos, nuevaClaveIdempotencia } from "./cliente";

const conClave = (clave) => ({ headers: { "Idempotency-Key": clave ?? nuevaClaveIdempotencia() } });

export const listarMotivos = (tipo) => datos(apiClient.get("/motivos-movimiento", { params: { tipo } }));
/** Si la red falla, reintente con la MISMA `clave` para no duplicar el movimiento. */
export const registrarEntrada = (entrada, clave) => datos(apiClient.post("/movimientos/entradas", entrada, conClave(clave)));
export const registrarSalida = (salida, clave) => datos(apiClient.post("/movimientos/salidas", salida, conClave(clave)));
/** params: { producto_id, tipo, usuario_id, desde, hasta, page, size } */
export const listarMovimientos = (params = {}) => datos(apiClient.get("/movimientos", { params }));
export const obtenerMovimiento = (id) => datos(apiClient.get(`/movimientos/${id}`));
export const anularMovimiento = (id, motivo, clave) =>
  datos(apiClient.post(`/movimientos/${id}/anulaciones`, { motivo, confirmacion: true }, conClave(clave)));
