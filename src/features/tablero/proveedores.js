/** Reglas y utilidades del mapa de proveedores cercanos (X6). Sin dependencias de React ni de Leaflet. */

/** Sede del spa (Calle 57 # 7-11, Bogotá; 4°38'35,4"N 74°03'43,3"W). Una sola sede: el modelo multisede es un escenario de escalabilidad. */
export const SEDE = Object.freeze({
  nombre: "Sede NailsSpa",
  direccion: "Calle 57 # 7-11, Bogotá",
  latitud: 4.64317,
  longitud: -74.06203,
});

/** Punto de búsqueda inicial: la sede. El usuario lo cambia escribiendo coordenadas o haciendo clic en el mapa. */
export const PUNTO_INICIAL = Object.freeze({ latitud: SEDE.latitud, longitud: SEDE.longitud });

export const RADIO_INICIAL_KM = 10;
export const RADIO_MIN_KM = 1;
export const RADIO_MAX_KM = 50;

/** Debe coincidir con el contrato: latitud −90…90 y longitud −180…180. Devuelve un mensaje por campo con error. */
export function validarPunto({ latitud, longitud }) {
  const errores = {};
  const lat = Number(latitud);
  const lon = Number(longitud);
  if (String(latitud).trim() === "" || !Number.isFinite(lat)) errores.latitud = "Escribe una latitud.";
  else if (lat < -90 || lat > 90) errores.latitud = "La latitud va entre -90 y 90.";
  if (String(longitud).trim() === "" || !Number.isFinite(lon)) errores.longitud = "Escribe una longitud.";
  else if (lon < -180 || lon > 180) errores.longitud = "La longitud va entre -180 y 180.";
  return errores;
}

const FORMATO_KM = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "0.59" → "0,59 km". La API manda la distancia como texto decimal. */
export function formatoDistancia(km) {
  const numero = Number(km);
  return Number.isFinite(numero) ? `${FORMATO_KM.format(numero)} km` : "";
}

/** Coordenada con 5 decimales (≈ 1 m) para mostrarla en los campos. */
export function redondearCoordenada(valor) {
  return String(Math.round(valor * 1e5) / 1e5);
}

/** Descarga un FeatureCollection como .geojson (RFC 7946) para abrirlo en QGIS o ArcGIS. */
export function descargarGeoJson(coleccion, nombreArchivo = "proveedores-cercanos.geojson") {
  const blob = new Blob([JSON.stringify(coleccion, null, 2)], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}

export const URL_TESELAS = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const ATRIBUCION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Contenido del globo de un proveedor. Se arma con nodos de texto: el nombre viene de la base de datos. */
export function contenidoGlobo({ nombre, telefono, distancia_km: distancia }) {
  const caja = document.createElement("div");
  const titulo = document.createElement("strong");
  titulo.textContent = nombre;
  caja.append(titulo);
  const detalles = [telefono ? `Tel. ${telefono}` : "Sin teléfono registrado", `A ${formatoDistancia(distancia)}`];
  for (const texto of detalles) {
    const linea = document.createElement("div");
    linea.textContent = texto;
    caja.append(linea);
  }
  return caja;
}
