import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router-dom";
import * as analitica from "../../api/analitica";
import { ContadorAlertas } from "./ContadorAlertas";

vi.mock("../../api/analitica");

const resumen = (bajo, agotado) => ({ bajo_stock: bajo, agotado, total: bajo + agotado });

function renderizar(props) {
  render(
    <MemoryRouter initialEntries={["/inventario"]}>
      <Link to="/movimientos">Ir a movimientos</Link>
      <ContadorAlertas {...props} />
    </MemoryRouter>,
  );
}

describe("ContadorAlertas", () => {
  beforeEach(() => vi.resetAllMocks());
  afterEach(() => vi.useRealTimers());

  it("muestra el total de alertas con texto para lectores de pantalla", async () => {
    analitica.resumenAlertas.mockResolvedValue(resumen(3, 2));
    renderizar();
    expect(await screen.findByText("5 alertas de stock")).toBeInTheDocument();
    expect(screen.getByText("5", { selector: "[aria-hidden]" })).toBeInTheDocument();
  });

  it("usa singular con una sola alerta", async () => {
    analitica.resumenAlertas.mockResolvedValue(resumen(0, 1));
    renderizar();
    expect(await screen.findByText("1 alerta de stock")).toBeInTheDocument();
  });

  it("muestra 99+ cuando hay más de 99", async () => {
    analitica.resumenAlertas.mockResolvedValue(resumen(90, 20));
    renderizar();
    expect(await screen.findByText("99+")).toBeInTheDocument();
    expect(screen.getByText("110 alertas de stock")).toBeInTheDocument();
  });

  it("no muestra nada cuando no hay alertas", async () => {
    analitica.resumenAlertas.mockResolvedValue(resumen(0, 0));
    const { container } = render(
      <MemoryRouter>
        <ContadorAlertas />
      </MemoryRouter>,
    );
    await waitFor(() => expect(analitica.resumenAlertas).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("no muestra nada ni rompe la pantalla si la consulta falla", async () => {
    analitica.resumenAlertas.mockRejectedValue(new Error("sin conexión"));
    const { container } = render(
      <MemoryRouter>
        <ContadorAlertas />
      </MemoryRouter>,
    );
    await waitFor(() => expect(analitica.resumenAlertas).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
  });

  it("se actualiza al cambiar de pantalla", async () => {
    analitica.resumenAlertas.mockResolvedValueOnce(resumen(1, 0)).mockResolvedValueOnce(resumen(1, 1));
    renderizar();
    expect(await screen.findByText("1 alerta de stock")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Ir a movimientos" }));
    expect(await screen.findByText("2 alertas de stock")).toBeInTheDocument();
    expect(analitica.resumenAlertas).toHaveBeenCalledTimes(2);
  });

  it("se actualiza solo cada cierto tiempo y conserva el último valor si una consulta falla", async () => {
    analitica.resumenAlertas
      .mockResolvedValueOnce(resumen(2, 0))
      .mockRejectedValueOnce(new Error("falló"))
      .mockResolvedValueOnce(resumen(2, 3));
    renderizar({ intervaloMs: 20 });
    expect(await screen.findByText("2 alertas de stock")).toBeInTheDocument();
    expect(await screen.findByText("5 alertas de stock")).toBeInTheDocument();
    expect(analitica.resumenAlertas.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
