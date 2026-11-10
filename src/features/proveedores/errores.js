
import { ErrorApi } from "../../api/cliente";

const MENSAJES = {
  CODIGO_DUPLICADO: "Ya existe un proveedor registrado con ese NIT.",
  SIN_PERMISO: "No tienes permiso para administrar proveedores.",
  NO_AUTENTICADO: "Tu sesión venció. Vuelve a iniciar sesión.",
  SIN_CONEXION: "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.",
  NO_IMPLEMENTADO: "Esta función aún no está disponible en el servidor.",
  RECURSO_NO_EXISTE: "El proveedor ya no existe. Actualiza la lista.",
};

export const CAMPOS_PROVEEDOR = ["nombre", "nit", "telefono", "correo", "direccion"];

/** Devuelve un mensaje comprensible para los errores conocidos de la API. */
export function mensajeDeError(error, porDefecto) {
  if (MENSAJES[error?.code]) return MENSAJES[error.code];
  if (error?.code === "DATOS_INVALIDOS" && error.message) return error.message;
  return porDefecto;
}

/** Convierte los errores 422 del backend en mensajes asociados a campos del formulario. */
export function erroresPorCampo(error, camposConocidos = CAMPOS_PROVEEDOR) {
  const resultado = {};
  if (!(error instanceof ErrorApi)) return resultado;

  for (const { campo, mensaje } of error.errors) {
    const nombre = campo?.split(".").pop();
    if (nombre && camposConocidos.includes(nombre) && !resultado[nombre]) {
      resultado[nombre] = mensaje;
    }
  }

  return resultado;
}
