import { fireEvent, render } from "@testing-library/react";
import { MapaLeaflet } from "./MapaLeaflet";

// Leaflet real, sin red: en jsdom no hay layout, así que se simula el tamaño del contenedor.
const TAMANO = { clientWidth: 800, clientHeight: 384 };
let originales;

beforeAll(() => {
  originales = Object.fromEntries(Object.keys(TAMANO).map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)]));
  for (const [k, v] of Object.entries(TAMANO)) Object.defineProperty(HTMLElement.prototype, k, { configurable: true, get: () => v });
});

afterAll(() => {
  for (const [k, d] of Object.entries(originales)) {
    if (d) Object.defineProperty(HTMLElement.prototype, k, d);
    else delete HTMLElement.prototype[k];
  }
});

const PUNTO = { latitud: 4.6097, longitud: -74.0817 };
const feature = (id, nombre, lon, lat) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [lon, lat] },
  properties: { proveedor_id: id, nombre, telefono: "300", distancia_km: "1.00" },
});
const COLECCION = {
  type: "FeatureCollection",
  features: [feature("a", "Uno", -74.0855, 4.606), feature("b", "Dos", -74.0875, 4.6038)],
};
const VACIA = { type: "FeatureCollection", features: [] };

const marcadores = (contenedor) => contenedor.querySelectorAll(".leaflet-marker-icon");

describe("MapaLeaflet", () => {
  it("crea el mapa con OpenStreetMap, su atribución y un nombre accesible", () => {
    const { getByRole, container } = render(<MapaLeaflet punto={PUNTO} radioKm={10} coleccion={VACIA} />);
    expect(getByRole("region", { name: "Mapa de proveedores cercanos" })).toHaveClass("leaflet-container");
    expect(container.querySelector(".leaflet-control-attribution")).toHaveTextContent("OpenStreetMap");
  });

  it("dibuja el punto de búsqueda, el círculo del radio y un marcador por proveedor", () => {
    const { container } = render(<MapaLeaflet punto={PUNTO} radioKm={10} coleccion={COLECCION} />);
    expect(marcadores(container)).toHaveLength(3); // punto + 2 proveedores
    expect(container.querySelectorAll("path.leaflet-interactive, .leaflet-overlay-pane path")).toHaveLength(1);
    expect(container.querySelector('[title="Punto de búsqueda"]')).not.toBeNull();
  });

  it("actualiza los marcadores cuando cambian los proveedores, sin duplicar", () => {
    const { container, rerender } = render(<MapaLeaflet punto={PUNTO} radioKm={10} coleccion={COLECCION} />);
    rerender(<MapaLeaflet punto={PUNTO} radioKm={10} coleccion={{ ...COLECCION, features: COLECCION.features.slice(0, 1) }} />);
    expect(marcadores(container)).toHaveLength(2);
    rerender(<MapaLeaflet punto={PUNTO} radioKm={10} coleccion={VACIA} />);
    expect(marcadores(container)).toHaveLength(1);
  });

  it("mueve el punto de búsqueda y redibuja el círculo cuando cambian el punto o el radio", () => {
    const { container, rerender } = render(<MapaLeaflet punto={PUNTO} radioKm={10} coleccion={VACIA} />);
    const antes = container.querySelector(".leaflet-overlay-pane path").getAttribute("d");
    rerender(<MapaLeaflet punto={PUNTO} radioKm={3} coleccion={VACIA} />);
    expect(container.querySelectorAll(".leaflet-overlay-pane path")).toHaveLength(1);
    expect(container.querySelector(".leaflet-overlay-pane path").getAttribute("d")).not.toBe(antes);
    rerender(<MapaLeaflet punto={{ latitud: 4.7, longitud: -74.1 }} radioKm={3} coleccion={VACIA} />);
    expect(marcadores(container)).toHaveLength(1);
  });

  it("avisa el punto elegido al hacer clic en el mapa", () => {
    const alElegirPunto = vi.fn();
    const { getByRole } = render(<MapaLeaflet punto={PUNTO} radioKm={10} coleccion={VACIA} alElegirPunto={alElegirPunto} />);
    fireEvent.click(getByRole("region", { name: "Mapa de proveedores cercanos" }), { clientX: 400, clientY: 192 });
    expect(alElegirPunto).toHaveBeenCalledTimes(1);
    const { latitud, longitud } = alElegirPunto.mock.calls[0][0];
    expect(Number.isFinite(latitud) && Number.isFinite(longitud)).toBe(true);
  });

  it("no falla si el contenedor no tiene tamaño (se ve igual cuando el navegador lo calcula)", () => {
    for (const k of Object.keys(TAMANO)) Object.defineProperty(HTMLElement.prototype, k, { configurable: true, get: () => 0 });
    try {
      const { container } = render(<MapaLeaflet punto={PUNTO} radioKm={10} coleccion={COLECCION} />);
      expect(marcadores(container)).toHaveLength(3);
    } finally {
      for (const [k, v] of Object.entries(TAMANO)) Object.defineProperty(HTMLElement.prototype, k, { configurable: true, get: () => v });
    }
  });

  it("libera el mapa al desmontar", () => {
    const { container, unmount } = render(<MapaLeaflet punto={PUNTO} radioKm={10} coleccion={COLECCION} />);
    expect(() => unmount()).not.toThrow();
    expect(container.querySelector(".leaflet-container")).toBeNull();
  });
});
