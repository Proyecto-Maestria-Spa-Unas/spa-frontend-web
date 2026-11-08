const MENSAJES = Object.freeze({
  SIN_CONEXION: "No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.",
  SIN_PERMISO: "No tienes permiso para consultar las alertas.",
  NO_AUTENTICADO: "Tu sesión venció. Vuelve a ingresar.",
  NO_IMPLEMENTADO: "Las alertas todavía no están disponibles en este servidor.",
});

/** Mensaje para el usuario según el `code` estable de la API (no según su texto). */
export function mensajeDeError(error, porDefecto = "No fue posible cargar las alertas.") {
  return MENSAJES[error?.code] ?? porDefecto;
}
