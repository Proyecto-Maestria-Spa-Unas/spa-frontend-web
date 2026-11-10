/**
 * X6 · Mapa Leaflet con OpenStreetMap. Parte imperativa: crea el mapa una vez y sincroniza las capas
 * (círculo del radio, punto de búsqueda y proveedores) cuando cambian las props.
 */
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { ATRIBUCION, URL_TESELAS, contenidoGlobo } from "./proveedores";

// Marcadores con clases de Tailwind y tokens del proyecto (los iconos por defecto de Leaflet no se empaquetan bien con Vite).
const ICONO_PROVEEDOR = L.divIcon({
  className: "",
  html: '<span class="block size-4 rounded-full border-2 border-marca-superficie bg-marca-primario shadow"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});
const ICONO_SEDE = L.divIcon({
  className: "",
  html: '<span class="flex size-7 items-center justify-center rounded-full border-2 border-marca-superficie bg-marca-texto text-xs font-bold text-marca-superficie shadow">S</span>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});
const ICONO_PUNTO = L.divIcon({
  className: "",
  html: '<span class="block size-5 rotate-45 border-2 border-marca-superficie bg-marca-texto shadow"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function MapaLeaflet({ punto, radioKm, coleccion, alElegirPunto, sede }) {
  const contenedor = useRef(null);
  const mapa = useRef(null);
  const capas = useRef({});
  const alElegir = useRef(alElegirPunto);

  useEffect(() => {
    alElegir.current = alElegirPunto;
  }, [alElegirPunto]);

  // El mapa se crea una sola vez; las demás capas se sincronizan en los efectos siguientes.
  useEffect(() => {
    const instancia = L.map(contenedor.current, { zoomControl: true }).setView([punto.latitud, punto.longitud], 12);
    L.tileLayer(URL_TESELAS, { attribution: ATRIBUCION, maxZoom: 19 }).addTo(instancia);
    capas.current.proveedores = L.layerGroup().addTo(instancia);
    instancia.on("click", (evento) => alElegir.current?.({ latitud: evento.latlng.lat, longitud: evento.latlng.lng }));
    mapa.current = instancia;
    return () => {
      instancia.remove();
      mapa.current = null;
      capas.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo la creación inicial usa `punto`
  }, []);

  // Punto de búsqueda y círculo del radio; el mapa se ajusta para que el círculo se vea completo.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia) return;
    const centro = [punto.latitud, punto.longitud];
    capas.current.circulo?.remove();
    capas.current.punto?.remove();
    capas.current.circulo = L.circle(centro, {
      radius: radioKm * 1000,
      color: "currentColor",
      fillColor: "currentColor",
      fillOpacity: 0.08,
      weight: 1,
      interactive: false,
    }).addTo(instancia);
    capas.current.punto = L.marker(centro, { icon: ICONO_PUNTO, keyboard: false, title: "Punto de búsqueda" }).addTo(instancia);
    const { x, y } = instancia.getSize();
    if (x > 0 && y > 0) instancia.fitBounds(capas.current.circulo.getBounds(), { padding: [16, 16] });
    else instancia.setView(centro, 12); // contenedor sin tamaño (p. ej. pruebas): fitBounds no puede calcular el zoom
  }, [punto.latitud, punto.longitud, radioKm]);

  // Sede del spa: marcador fijo, distinto del punto de búsqueda y de los proveedores.
  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia || !sede) return undefined;
    const caja = document.createElement("div");
    const titulo = document.createElement("strong");
    titulo.textContent = sede.nombre;
    const direccion = document.createElement("div");
    direccion.textContent = sede.direccion;
    caja.append(titulo, direccion);
    const marcador = L.marker([sede.latitud, sede.longitud], {
      icon: ICONO_SEDE,
      keyboard: false,
      title: `Sede: ${sede.nombre}`,
      zIndexOffset: 1000,
    })
      .bindPopup(caja)
      .addTo(instancia);
    return () => marcador.remove();
  }, [sede]);

  // Proveedores: el GeoJSON de la API se dibuja tal cual (L.geoJSON lee [longitud, latitud]).
  useEffect(() => {
    const grupo = capas.current.proveedores;
    if (!grupo) return;
    grupo.clearLayers();
    L.geoJSON(coleccion, {
      // `title` da el nombre accesible al marcador (axe: aria-command-name).
      pointToLayer: (feature, latlng) =>
        L.marker(latlng, { icon: ICONO_PROVEEDOR, title: `Proveedor: ${feature.properties.nombre}` }),
      onEachFeature: (feature, capa) => capa.bindPopup(contenidoGlobo(feature.properties)),
    }).addTo(grupo);
  }, [coleccion]);

  return (
    <div
      ref={contenedor}
      role="region"
      aria-label="Mapa de proveedores cercanos"
      className="isolate z-0 h-96 w-full rounded-lg border border-marca-borde text-marca-primario"
    />
  );
}
