import { ErrorApi } from "../../api/cliente";

// Mensajes para el usuario según el `code` estable que devuelve la API.
const MENSAJES = {
  CODIGO_DUPLICADO: "Ya existe un usuario con ese correo.",
  SIN_PERMISO: "No tienes permiso para realizar esta acción.",
  NO_AUTENTICADO: "Tu sesión venció. Vuelve a iniciar sesión.",
  SIN_CONEXION: "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.",
  NO_IMPLEMENTADO: "Esta función aún no está disponible en el servidor.",
  RECURSO_NO_EXISTE: "El usuario ya no existe. Actualiza la lista.",
};

/** Mensaje para un error de la API; `porDefecto` si el code no tiene mensaje propio. */
export function mensajeDeError(error, porDefecto) {
  return MENSAJES[error?.code] ?? porDefecto;
}

/** Convierte los errores por campo de un 422 (`errors: [{ campo, mensaje }]`) en { campo: mensaje }. */
export function erroresPorCampo(error) {
  const resultado = {};
  if (!(error instanceof ErrorApi)) return resultado;
  for (const { campo, mensaje } of error.errors) {
    if (campo && !resultado[campo]) resultado[campo] = mensaje;
  }
  return resultado;
}
