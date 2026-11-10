import { fireEvent, render } from "@testing-library/react";
import { MapaUbicacionProveedor } from "./MapaUbicacionProveedor";

const TAMANO = { clientWidth: 800, clientHeight: 384 };
let originales;

beforeAll(() => {
  originales = Object.fromEntries(
    Object.keys(TAMANO).map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k)]),
  );

  for (const [k, v] of Object.entries(TAMANO)) {
    Object.defineProperty(HTMLElement.prototype, k, {
      configurable: true,
      get: () => v,
    });
  }
});

afterAll(() => {
  for (const [k, descriptor] of Object.entries(originales)) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, k, descriptor);
    else delete HTMLElement.prototype[k];
  }
});

const UBICACION = { latitud: 4.6486, longitud: -74.0628 };

const marcadores = (contenedor) =>
  contenedor.querySelectorAll(".leaflet-marker-icon");

describe("MapaUbicacionProveedor", () => {
  it("crea el mapa con OpenStreetMap y un nombre accesible", () => {
    const { getByRole, container } = render(
      <MapaUbicacionProveedor ubicacion={UBICACION} />,
    );

    expect(
      getByRole("region", {
        name: "Mapa para seleccionar la ubicación del proveedor",
      }),
    ).toHaveClass("leaflet-container");

    expect(container.querySelector(".leaflet-control-attribution")).toHaveTextContent(
      "OpenStreetMap",
    );
  });

  it("muestra un marcador en la ubicación recibida", () => {
    const { container } = render(
      <MapaUbicacionProveedor ubicacion={UBICACION} />,
    );

    expect(marcadores(container)).toHaveLength(1);
    expect(
      container.querySelector('[title="Ubicación del proveedor"]'),
    ).not.toBeNull();
  });

  it("avisa las coordenadas al hacer clic en el mapa", () => {
    const alElegirPunto = vi.fn();

    const { getByRole } = render(
      <MapaUbicacionProveedor
        ubicacion={UBICACION}
        alElegirPunto={alElegirPunto}
      />,
    );

    fireEvent.click(
      getByRole("region", {
        name: "Mapa para seleccionar la ubicación del proveedor",
      }),
      { clientX: 400, clientY: 192 },
    );

    expect(alElegirPunto).toHaveBeenCalledTimes(1);

    const { latitud, longitud } = alElegirPunto.mock.calls[0][0];

    expect(Number.isFinite(latitud) && Number.isFinite(longitud)).toBe(true);
  });

  it("actualiza el marcador cuando cambian las coordenadas", () => {
    const { container, rerender } = render(
      <MapaUbicacionProveedor ubicacion={UBICACION} />,
    );

    rerender(
      <MapaUbicacionProveedor
        ubicacion={{ latitud: 4.7, longitud: -74.1 }}
      />,
    );

    expect(marcadores(container)).toHaveLength(1);
  });

  it("libera el mapa al desmontar", () => {
    const { container, unmount } = render(
      <MapaUbicacionProveedor ubicacion={UBICACION} />,
    );

    expect(() => unmount()).not.toThrow();
    expect(container.querySelector(".leaflet-container")).toBeNull();
  });
});