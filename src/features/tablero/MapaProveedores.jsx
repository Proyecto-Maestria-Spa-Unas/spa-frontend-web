/**
 * HU-10, RF-17 · Mapa de proveedores cercanos para reponer productos en alerta (X6)
 * API: GET /analitica/proveedores-cercanos  (src/api/analitica.js → proveedoresCercanos)
 */
import { useEffect, useState } from "react";
import { proveedoresCercanos } from "../../api/analitica";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Card } from "../../design-system/componentes/Card";
import { Input } from "../../design-system/componentes/Input";
import { mensajeDeError } from "./errores";
import { MapaLeaflet } from "./MapaLeaflet";
import {
  PUNTO_INICIAL,
  RADIO_INICIAL_KM,
  RADIO_MAX_KM,
  RADIO_MIN_KM,
  SEDE,
  descargarGeoJson,
  formatoDistancia,
  redondearCoordenada,
  validarPunto,
} from "./proveedores";

const COLECCION_VACIA = Object.freeze({ type: "FeatureCollection", features: [] });
const ESPERA_MS = 300; // al mover el control del radio, la consulta se hace cuando el usuario se detiene

/** `espera` solo se cambia en las pruebas. */
export function MapaProveedores({ espera = ESPERA_MS }) {
  const [punto, setPunto] = useState(PUNTO_INICIAL);
  const [campos, setCampos] = useState({
    latitud: redondearCoordenada(PUNTO_INICIAL.latitud),
    longitud: redondearCoordenada(PUNTO_INICIAL.longitud),
  });
  const [radioKm, setRadioKm] = useState(RADIO_INICIAL_KM);
  const [coleccion, setColeccion] = useState(COLECCION_VACIA);
  const [estado, setEstado] = useState("cargando");
  const [errorCarga, setErrorCarga] = useState("");
  const [intento, setIntento] = useState(0);

  const erroresCampos = validarPunto(campos);

  useEffect(() => {
    let vigente = true;
    const temporizador = setTimeout(() => {
      proveedoresCercanos(punto.latitud, punto.longitud, radioKm)
        .then((respuesta) => {
          if (!vigente) return;
          setColeccion(respuesta);
          setEstado("listo");
        })
        .catch((error) => {
          if (!vigente) return;
          setErrorCarga(mensajeDeError(error, "No fue posible cargar los proveedores."));
          setEstado("error");
        });
    }, espera);
    return () => {
      vigente = false;
      clearTimeout(temporizador);
    };
  }, [punto, radioKm, intento, espera]);

  function cambiarCampo(nombre, valor) {
    const siguientes = { ...campos, [nombre]: valor };
    setCampos(siguientes);
    if (Object.keys(validarPunto(siguientes)).length === 0) {
      setEstado("cargando");
      setPunto({ latitud: Number(siguientes.latitud), longitud: Number(siguientes.longitud) });
    }
  }

  function elegirEnElMapa({ latitud, longitud }) {
    setCampos({ latitud: redondearCoordenada(latitud), longitud: redondearCoordenada(longitud) });
    setEstado("cargando");
    setPunto({ latitud: Number(redondearCoordenada(latitud)), longitud: Number(redondearCoordenada(longitud)) });
  }

  function cambiarRadio(evento) {
    setEstado("cargando");
    setRadioKm(Number(evento.target.value));
  }

  function reintentar() {
    setEstado("cargando");
    setIntento((n) => n + 1);
  }

  const proveedores = coleccion.features;

  return (
    <Card title="Proveedores cercanos" className="mt-4">
      <p className="mb-4 text-sm">
        Para reponer los productos en alerta: haz clic en el mapa o escribe las coordenadas del punto de búsqueda y ajusta
        el radio.
      </p>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Input
          label="Latitud"
          type="number"
          step="any"
          inputMode="decimal"
          value={campos.latitud}
          error={erroresCampos.latitud}
          onChange={(e) => cambiarCampo("latitud", e.target.value)}
        />
        <Input
          label="Longitud"
          type="number"
          step="any"
          inputMode="decimal"
          value={campos.longitud}
          error={erroresCampos.longitud}
          onChange={(e) => cambiarCampo("longitud", e.target.value)}
        />
        <div>
          <label htmlFor="radio-km" className="mb-1 block text-sm font-medium">
            Radio: <output htmlFor="radio-km">{radioKm} km</output>
          </label>
          <input
            id="radio-km"
            type="range"
            min={RADIO_MIN_KM}
            max={RADIO_MAX_KM}
            step={1}
            value={radioKm}
            onChange={cambiarRadio}
            className="w-full accent-marca-primario"
          />
        </div>
      </div>

      <MapaLeaflet punto={punto} radioKm={radioKm} coleccion={coleccion} alElegirPunto={elegirEnElMapa} sede={SEDE} />

      <div className="mt-4">
        {estado === "cargando" && <p role="status">Buscando proveedores…</p>}

        {estado === "error" && (
          <div className="space-y-3">
            <Alert variant="error">{errorCarga}</Alert>
            <Button variant="secondary" onClick={reintentar}>
              Reintentar
            </Button>
          </div>
        )}

        {estado === "listo" && proveedores.length === 0 && (
          <p>No hay proveedores con ubicación en este radio. Aumenta el radio o cambia el punto de búsqueda.</p>
        )}

        {estado === "listo" && proveedores.length > 0 && (
          <>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p>
                {proveedores.length} {proveedores.length === 1 ? "proveedor" : "proveedores"} en {radioKm} km
              </p>
              <Button variant="secondary" onClick={() => descargarGeoJson(coleccion)}>
                Descargar GeoJSON
              </Button>
            </div>
            <ul className="divide-y divide-marca-borde rounded-lg border border-marca-borde">
              {proveedores.map(({ properties: p }) => (
                <li key={p.proveedor_id} className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm">
                  <span>
                    <span className="block font-medium">{p.nombre}</span>
                    <span className="block text-xs">{p.telefono ?? "Sin teléfono registrado"}</span>
                  </span>
                  <span className="font-semibold">{formatoDistancia(p.distancia_km)}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Card>
  );
}
