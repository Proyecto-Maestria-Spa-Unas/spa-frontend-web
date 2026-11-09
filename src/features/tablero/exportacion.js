/** Reglas y utilidades de la exportación de datos (X5). Sin dependencias de React. */

export const CONJUNTOS = Object.freeze([
  { value: "inventario", label: "Inventario" },
  { value: "movimientos", label: "Movimientos" },
]);

export const FORMATOS = Object.freeze([
  { value: "csv", label: "CSV (se abre en Excel)" },
  { value: "parquet", label: "Parquet (análisis de datos)" },
]);

/** Fecha de hoy en Bogotá como AAAAMMDD, igual que el nombre que arma la API. */
function hoyBogota(ahora) {
  return ahora.toLocaleDateString("sv-SE", { timeZone: "America/Bogota" }).replaceAll("-", "");
}

/** Por ejemplo `inventario-20261108.csv`. */
export function nombreArchivo(conjunto, formato, ahora = new Date()) {
  return `${conjunto}-${hoyBogota(ahora)}.${formato}`;
}

/** Entrega el archivo al navegador como descarga. */
export function guardarArchivo(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

/**
 * Mensaje para el usuario. En una descarga el error llega como Blob, así que el `code` de la API
 * no siempre se puede leer: también se usa el estado HTTP.
 */
export function mensajeExportar(error) {
  if (error?.code === "SIN_CONEXION") return "No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  if (error?.code === "NO_AUTENTICADO" || error?.status === 401) return "Tu sesión venció. Vuelve a ingresar.";
  if (error?.code === "SIN_PERMISO" || error?.status === 403) return "No tienes permiso para exportar datos.";
  if (error?.code === "NO_IMPLEMENTADO" || error?.status === 501) {
    return "La exportación todavía no está disponible en este servidor.";
  }
  return "No fue posible generar el archivo. Inténtalo de nuevo.";
}
