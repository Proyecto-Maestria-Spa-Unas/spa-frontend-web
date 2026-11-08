import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { proveedoresCercanos } from "../../api/analitica";
import { MapaProveedores } from "./MapaProveedores";

vi.mock("../../api/analitica", () => ({ proveedoresCercanos: vi.fn() }));
vi.mock("./MapaLeaflet", () => ({
  MapaLeaflet: ({ punto, radioKm, coleccion, alElegirPunto }) => (
    <div data-testid="mapa" data-radio={radioKm} data-punto={`${punto.latitud},${punto.longitud}`} data-n={coleccion.features.length}>
      <button onClick={() => alElegirPunto({ latitud: 4.7123456, longitud: -74.1 })}>clic en el mapa</button>
    </div>
  ),
}));
vi.mock("./proveedores", async (original) => ({ ...(await original()), descargarGeoJson: vi.fn() }));

import { descargarGeoJson } from "./proveedores";

const feature = (id, nombre, telefono, km) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [-74.08, 4.6] },
  properties: { proveedor_id: id, nombre, telefono, distancia_km: km },
});
const DOS = {
  type: "FeatureCollection",
  features: [feature("a", "San Andresito 18", "3000000002", "0.59"), feature("b", "Plaza España", null, "0.92")],
};
const UNO = { type: "FeatureCollection", features: [feature("a", "San Andresito 18", "3000000002", "0.59")] };
const VACIA = { type: "FeatureCollection", features: [] };

const mostrar = () => render(<MapaProveedores espera={0} />);

beforeEach(() => vi.mocked(proveedoresCercanos).mockReset());

describe("MapaProveedores", () => {
  it("consulta con el punto y el radio iniciales y lista los proveedores con su distancia", async () => {
    vi.mocked(proveedoresCercanos).mockResolvedValue(DOS);
    mostrar();
    expect(screen.getByText("Buscando proveedores…")).toBeInTheDocument();
    expect(await screen.findByText("2 proveedores en 10 km")).toBeInTheDocument();
    expect(proveedoresCercanos).toHaveBeenCalledWith(4.6097, -74.0817, 10);
    expect(screen.getByText("San Andresito 18")).toBeInTheDocument();
    expect(screen.getByText("0,59 km")).toBeInTheDocument();
    expect(screen.getByText("Sin teléfono registrado")).toBeInTheDocument();
    expect(screen.getByTestId("mapa")).toHaveAttribute("data-n", "2");
  });

  it("usa el singular con un solo proveedor", async () => {
    vi.mocked(proveedoresCercanos).mockResolvedValue(UNO);
    mostrar();
    expect(await screen.findByText("1 proveedor en 10 km")).toBeInTheDocument();
  });

  it("explica qué hacer cuando no hay proveedores y no ofrece descargar", async () => {
    vi.mocked(proveedoresCercanos).mockResolvedValue(VACIA);
    mostrar();
    expect(await screen.findByText(/No hay proveedores con ubicación en este radio/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descargar GeoJSON" })).not.toBeInTheDocument();
  });

  it("muestra el error del servidor y permite reintentar", async () => {
    vi.mocked(proveedoresCercanos).mockRejectedValueOnce(new Error("sin red")).mockResolvedValueOnce(UNO);
    mostrar();
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("1 proveedor en 10 km")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(proveedoresCercanos).toHaveBeenCalledTimes(2);
  });

  it("vuelve a consultar con el nuevo radio al moverlo", async () => {
    vi.mocked(proveedoresCercanos).mockResolvedValue(DOS);
    mostrar();
    await screen.findByText("2 proveedores en 10 km");
    fireEvent.change(screen.getByRole("slider"), { target: { value: "3" } });
    await waitFor(() => expect(proveedoresCercanos).toHaveBeenLastCalledWith(4.6097, -74.0817, 3));
    expect(await screen.findByText("2 proveedores en 3 km")).toBeInTheDocument();
    expect(screen.getByTestId("mapa")).toHaveAttribute("data-radio", "3");
  });

  it("consulta al escribir coordenadas válidas y no consulta si son inválidas", async () => {
    vi.mocked(proveedoresCercanos).mockResolvedValue(DOS);
    mostrar();
    await screen.findByText("2 proveedores en 10 km");
    vi.mocked(proveedoresCercanos).mockClear();

    fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "95" } });
    expect(await screen.findByText("La latitud va entre -90 y 90.")).toBeInTheDocument();
    await act(async () => {});
    expect(proveedoresCercanos).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "4.65" } });
    await waitFor(() => expect(proveedoresCercanos).toHaveBeenCalledWith(4.65, -74.0817, 10));
    expect(screen.queryByText("La latitud va entre -90 y 90.")).not.toBeInTheDocument();
  });

  it("al hacer clic en el mapa actualiza los campos y consulta ese punto", async () => {
    vi.mocked(proveedoresCercanos).mockResolvedValue(DOS);
    mostrar();
    await screen.findByText("2 proveedores en 10 km");
    fireEvent.click(screen.getByRole("button", { name: "clic en el mapa" }));
    await waitFor(() => expect(proveedoresCercanos).toHaveBeenLastCalledWith(4.71235, -74.1, 10));
    expect(screen.getByLabelText("Latitud")).toHaveValue(4.71235);
    expect(screen.getByLabelText("Longitud")).toHaveValue(-74.1);
  });

  it("descarga exactamente el GeoJSON que devolvió la API", async () => {
    vi.mocked(proveedoresCercanos).mockResolvedValue(DOS);
    mostrar();
    fireEvent.click(await screen.findByRole("button", { name: "Descargar GeoJSON" }));
    expect(descargarGeoJson).toHaveBeenCalledWith(DOS);
  });

  it("ignora la respuesta de una consulta ya reemplazada", async () => {
    let resolverPrimera;
    vi.mocked(proveedoresCercanos)
      .mockImplementationOnce(() => new Promise((r) => (resolverPrimera = r)))
      .mockResolvedValue(UNO);
    mostrar();
    await waitFor(() => expect(proveedoresCercanos).toHaveBeenCalledTimes(1));
    fireEvent.change(screen.getByRole("slider"), { target: { value: "5" } });
    expect(await screen.findByText("1 proveedor en 5 km")).toBeInTheDocument();
    await act(async () => resolverPrimera(DOS));
    expect(screen.getByText("1 proveedor en 5 km")).toBeInTheDocument();
  });
});
