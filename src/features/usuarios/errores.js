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

/** Campos del formulario de usuarios a los que se pueden asociar los errores de un 422. */
export const CAMPOS_USUARIO = ["nombre_completo", "correo", "rol", "contrasena_temporal"];

/** Mensaje para un error de la API; `porDefecto` si el code no tiene mensaje propio. */
export function mensajeDeError(error, porDefecto) {
  if (MENSAJES[error?.code]) return MENSAJES[error.code];
  // Un 422 sin lista de campos (p. ej. contraseña débil) trae un texto en español pensado para mostrarse.
  if (error?.code === "DATOS_INVALIDOS" && error.message) return error.message;
  return porDefecto;
}

/**
 * Convierte los errores por campo de un 422 (`errors: [{ campo, mensaje }]`) en { campo: mensaje }.
 * El backend envía la ruta completa del campo (por ejemplo "body.correo"): se usa el último tramo, y se
 * ignoran los campos que el formulario no tiene.
 */
export function erroresPorCampo(error, camposConocidos = CAMPOS_USUARIO) {
  const resultado = {};
  if (!(error instanceof ErrorApi)) return resultado;
  for (const { campo, mensaje } of error.errors) {
    const nombre = campo?.split(".").pop();
    if (nombre && camposConocidos.includes(nombre) && !resultado[nombre]) resultado[nombre] = mensaje;
  }
  return resultado;
}
