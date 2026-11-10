import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { ATRIBUCION, URL_TESELAS } from "../tablero/proveedores";

const ICONO_UBICACION = L.divIcon({
  className: "",
  html: '<span class="block size-5 rounded-full border-2 border-white bg-marca-primario shadow"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

export function MapaUbicacionProveedor({ ubicacion, alElegirPunto }) {
  const contenedor = useRef(null);
  const mapa = useRef(null);
  const marcador = useRef(null);
  const alElegir = useRef(alElegirPunto);

  useEffect(() => {
    alElegir.current = alElegirPunto;
  }, [alElegirPunto]);

  useEffect(() => {
    const inicial = [ubicacion.latitud, ubicacion.longitud];

    const instancia = L.map(contenedor.current).setView(inicial, 13);

    L.tileLayer(URL_TESELAS, {
      attribution: ATRIBUCION,
      maxZoom: 19,
    }).addTo(instancia);

    instancia.on("click", (evento) => {
      alElegir.current?.({
        latitud: evento.latlng.lat,
        longitud: evento.latlng.lng,
      });
    });

    mapa.current = instancia;

    return () => {
      instancia.remove();
      mapa.current = null;
      marcador.current = null;
    };
    // El mapa se inicializa una sola vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const instancia = mapa.current;
    if (!instancia) return;

    const punto = [ubicacion.latitud, ubicacion.longitud];

    marcador.current?.remove();

    marcador.current = L.marker(punto, {
      icon: ICONO_UBICACION,
      title: "Ubicación del proveedor",
    }).addTo(instancia);

    instancia.setView(punto, 15);
  }, [ubicacion.latitud, ubicacion.longitud]);

  return (
    <div
      ref={contenedor}
      role="region"
      aria-label="Mapa para seleccionar la ubicación del proveedor"
      className="isolate z-0 h-72 w-full rounded-lg border border-marca-borde text-marca-primario"
    />
  );
}