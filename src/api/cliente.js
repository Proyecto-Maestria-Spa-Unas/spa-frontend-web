/**
 * Cliente HTTP común para los 4 servicios del backend (sección 4 del documento de arquitectura).
 *
 * - Base: VITE_API_BASE_URL (en Vercel apunta a la API de staging /api/v1).
 * - Adjunta `Authorization: Bearer <jwt>` si hay sesión.
 * - Convierte las respuestas application/problem+json en `ErrorApi` con `code` estable.
 * - Con VITE_API_MOCK=true responde con datos simulados (src/mocks), sin backend.
 */
import axios from "axios";

export const TOKEN_KEY = "spa.token";
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
export const MODO_SIMULADO = import.meta.env.VITE_API_MOCK === "true";

export class ErrorApi extends Error {
  constructor({ status, code, title, detail, errors }) {
    super(detail || title || "Error de comunicación con la API");
    this.name = "ErrorApi";
    this.status = status;
    this.code = code;
    this.errors = errors ?? [];
  }
}

export function normalizarError(error) {
  const respuesta = error?.response;
  if (!respuesta) {
    return new ErrorApi({ status: 0, code: "SIN_CONEXION", detail: "No hay conexión con la API" });
  }
  const cuerpo = respuesta.data ?? {};
  return new ErrorApi({
    status: respuesta.status,
    code: cuerpo.code ?? "ERROR_HTTP",
    title: cuerpo.title,
    detail: cuerpo.detail,
    errors: cuerpo.errors,
  });
}

export function crearCliente({ simulado = MODO_SIMULADO } = {}) {
  const instancia = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    // Carga diferida: en producción (VITE_API_MOCK sin definir) el simulador ni siquiera se empaqueta.
    ...(simulado ? { adapter: async (config) => (await import("../mocks/adaptador")).adaptadorSimulado(config) } : {}),
  });
  instancia.interceptors.request.use((config) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  instancia.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => Promise.reject(normalizarError(error)),
  );
  return instancia;
}

export const apiClient = crearCliente();

/** Devuelve solo el cuerpo de la respuesta. */
export const datos = (promesa) => promesa.then((r) => r.data);

/** Idempotency-Key para los POST de movimientos (un UUID por intento del usuario). */
export const nuevaClaveIdempotencia = () => crypto.randomUUID();
