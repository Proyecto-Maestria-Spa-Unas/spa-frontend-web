import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ErrorApi } from "../../api/cliente";
import * as analitica from "../../api/analitica";
import { ListaAlertas } from "./ListaAlertas";

vi.mock("../../api/analitica");

const AGOTADO = {
  producto_id: "p3",
  codigo: "DES-004",
  nombre: "Guantes de nitrilo talla M",
  stock_actual: "0.000",
  stock_minimo: "20.000",
  estado: "AGOTADO",
  faltante: "20.000",
};
const BAJO = {
  producto_id: "p2",
  codigo: "REM-001",
  nombre: "Acetona pura",
  stock_actual: "350.000",
  stock_minimo: "500.000",
  estado: "BAJO_STOCK",
  faltante: "150.000",
};

const fila = (nombre) => screen.getByRole("row", { name: new RegExp(nombre) });

describe("ListaAlertas", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra cargando y luego la tabla con producto, estado, stock, mínimo y faltante", async () => {
    analitica.listarAlertas.mockResolvedValue([AGOTADO, BAJO]);
    render(<ListaAlertas />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando alertas");
    expect(await screen.findByRole("table", { name: "Productos que requieren reposición" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((c) => c.textContent)).toEqual([
      "Producto",
      "Estado",
      "Stock actual",
      "Stock mínimo",
      "Faltante",
    ]);
    const acetona = within(fila("Acetona pura"));
    expect(acetona.getByText("REM-001")).toBeInTheDocument();
    expect(acetona.getByText("Bajo stock")).toBeInTheDocument();
    expect(acetona.getAllByRole("cell").map((c) => c.textContent).slice(2)).toEqual(["350", "500", "150"]);
    expect(within(fila("Guantes")).getByText("Agotado")).toBeInTheDocument();
    expect(screen.getByText("2 productos en alerta")).toBeInTheDocument();
    expect(analitica.listarAlertas).toHaveBeenCalledWith(undefined);
  });

  it("respeta el orden que manda la API (agotados primero)", async () => {
    analitica.listarAlertas.mockResolvedValue([AGOTADO, BAJO]);
    render(<ListaAlertas />);
    await screen.findByRole("table");
    const nombres = screen.getAllByRole("row").slice(1).map((f) => within(f).getAllByRole("cell")[0].textContent);
    expect(nombres).toEqual(["Guantes de nitrilo talla MDES-004", "Acetona pura" + "REM-001"]);
  });

  it("usa singular cuando hay un solo producto", async () => {
    analitica.listarAlertas.mockResolvedValue([BAJO]);
    render(<ListaAlertas />);
    expect(await screen.findByText("1 producto en alerta")).toBeInTheDocument();
  });

  it("filtra por estado pidiéndolo a la API", async () => {
    analitica.listarAlertas.mockImplementation(async (estado) => (estado === "AGOTADO" ? [AGOTADO] : [AGOTADO, BAJO]));
    render(<ListaAlertas />);
    await screen.findByRole("table");
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "AGOTADO" } });
    await waitFor(() => expect(screen.queryByText("Acetona pura")).not.toBeInTheDocument());
    expect(screen.getByText("Guantes de nitrilo talla M")).toBeInTheDocument();
    expect(analitica.listarAlertas).toHaveBeenLastCalledWith("AGOTADO");
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "" } });
    expect(await screen.findByText("Acetona pura")).toBeInTheDocument();
    expect(analitica.listarAlertas).toHaveBeenLastCalledWith(undefined);
  });

  it("ofrece los tres filtros: Todas, Agotado y Bajo stock", async () => {
    analitica.listarAlertas.mockResolvedValue([]);
    render(<ListaAlertas />);
    await screen.findByText("No hay productos que requieran reposición.");
    const opciones = within(screen.getByLabelText("Estado")).getAllByRole("option");
    expect(opciones.map((o) => o.textContent)).toEqual(["Todas", "Agotado", "Bajo stock"]);
  });

  it("muestra un mensaje cuando no hay alertas, según el filtro", async () => {
    analitica.listarAlertas.mockResolvedValue([]);
    render(<ListaAlertas />);
    expect(await screen.findByText("No hay productos que requieran reposición.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "BAJO_STOCK" } });
    expect(await screen.findByText("No hay productos con bajo stock.")).toBeInTheDocument();
  });

  it("muestra el error por código y permite reintentar", async () => {
    analitica.listarAlertas
      .mockRejectedValueOnce(new ErrorApi({ status: 0, code: "SIN_CONEXION" }))
      .mockResolvedValueOnce([BAJO]);
    render(<ListaAlertas />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Acetona pura")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("un 403 se explica como falta de permiso", async () => {
    analitica.listarAlertas.mockRejectedValue(new ErrorApi({ status: 403, code: "SIN_PERMISO" }));
    render(<ListaAlertas />);
    expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso para consultar las alertas.");
  });
});
