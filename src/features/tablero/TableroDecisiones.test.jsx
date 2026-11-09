import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import * as analitica from "../../api/analitica";
import { ErrorApi } from "../../api/cliente";
import { TableroDecisiones } from "./TableroDecisiones";

vi.mock("../../api/analitica");

const TABLERO = {
  productos_por_estado: { DISPONIBLE: 40, BAJO_STOCK: 5, AGOTADO: 2 },
  valor_inventario: "4250000.0000",
  consumo_30_dias: "1280.000",
  top_rotacion: [
    { producto_id: "p1", codigo: "REM-001", nombre: "Acetona pura", consumo: "150.000" },
    { producto_id: "p2", codigo: "ESM-001", nombre: "Esmalte rojo", consumo: "26.000" },
  ],
};
const CONSUMO = [
  { clave: "Esmaltes", cantidad: "26.000" },
  { clave: "Removedores", cantidad: "150.000" },
];
const cob = (codigo, dias) => ({
  producto_id: `id-${codigo}`,
  codigo,
  nombre: `Producto ${codigo}`,
  stock_actual: "10.000",
  consumo_diario_promedio: "1.000",
  dias_cobertura: dias,
});
const COBERTURA = [cob("A", "70.0"), cob("B", "5.0"), cob("C", null)];

function datosNormales() {
  analitica.tablero.mockResolvedValue(TABLERO);
  analitica.consumo.mockResolvedValue(CONSUMO);
  analitica.cobertura.mockResolvedValue(COBERTURA);
}
const tarjeta = (nombre) => screen.getByRole("region", { name: nombre });
const pestana = (nombre) => within(tarjeta(nombre));

describe("TableroDecisiones", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    datosNormales();
  });

  it("muestra las cifras principales: valor, consumo de 30 días y total de productos", async () => {
    render(<TableroDecisiones />);
    expect(await screen.findByText(/4\.250\.000/)).toBeInTheDocument();
    expect(screen.getByText("1.280")).toBeInTheDocument();
    expect(screen.getByText("47")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Tablero de decisiones" })).toBeInTheDocument();
  });

  it("sin costos registrados explica por qué no hay valor", async () => {
    analitica.tablero.mockResolvedValue({ ...TABLERO, valor_inventario: null });
    render(<TableroDecisiones />);
    expect(await screen.findByText("Sin costos registrados")).toBeInTheDocument();
  });

  it("grafica productos por estado y rotación, con resumen para lectores de pantalla", async () => {
    render(<TableroDecisiones />);
    expect(await screen.findByRole("img", { name: "Productos por estado: Disponible 40, Bajo stock 5, Agotado 2" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Top de rotación: Acetona pura 150, Esmalte rojo 26" })).toBeInTheDocument();
  });

  it("consulta el consumo de los últimos 30 días agrupado por categoría y lo ordena", async () => {
    render(<TableroDecisiones />);
    const grafico = await screen.findByRole("img", { name: /^Consumo por categoría/ });
    expect(grafico).toHaveAccessibleName("Consumo por categoría: Removedores 150, Esmaltes 26");
    const [desde, hasta, agrupar] = analitica.consumo.mock.calls[0];
    expect(desde).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(hasta >= desde).toBe(true);
    expect(agrupar).toBe("categoria");
  });

  it("al agrupar por producto vuelve a consultar con esa agrupación", async () => {
    render(<TableroDecisiones />);
    await screen.findByRole("img", { name: /^Consumo por categoría/ });
    analitica.consumo.mockResolvedValue([{ clave: "REM-001", cantidad: "150.000" }]);
    fireEvent.change(screen.getByLabelText("Agrupar el consumo por"), { target: { value: "producto" } });
    expect(await screen.findByRole("img", { name: "Consumo por código de producto: REM-001 150" })).toBeInTheDocument();
    expect(analitica.consumo.mock.calls.at(-1)[2]).toBe("producto");
    expect(screen.getByRole("region", { name: "Consumo de 30 días por producto" })).toBeInTheDocument();
  });

  it("cobertura: grafica solo los productos con consumo y la tabla trae todos", async () => {
    render(<TableroDecisiones />);
    const grafico = await screen.findByRole("img", { name: /^Cobertura en días/ });
    expect(grafico).toHaveAccessibleName("Cobertura en días: Producto B 5 días, Producto A 70 días");
    fireEvent.click(within(tarjeta("Cobertura estimada (días)")).getByRole("button", { name: "Ver como tabla" }));
    const tabla = within(tarjeta("Cobertura estimada (días)")).getByRole("table", { name: /Días de cobertura/ });
    expect(within(tabla).getAllByRole("row")).toHaveLength(4);
    expect(within(tabla).getByText("Producto C (C)")).toBeInTheDocument();
    expect(within(tabla).getByText("Sin consumo")).toBeInTheDocument();
    expect(within(tarjeta("Cobertura estimada (días)")).getByText(/La tabla incluye los 3; 1 sin consumo/)).toBeInTheDocument();
  });

  it("cobertura con más de 10 productos avisa que el gráfico muestra solo 10", async () => {
    analitica.cobertura.mockResolvedValue(Array.from({ length: 12 }, (_, i) => cob(`P${i}`, `${i + 1}.0`)));
    render(<TableroDecisiones />);
    expect(await screen.findByText("El gráfico muestra los 10 productos con menos cobertura. La tabla incluye los 12.")).toBeInTheDocument();
  });

  it("si ningún producto tuvo consumo, lo dice en vez de dibujar un gráfico vacío", async () => {
    analitica.cobertura.mockResolvedValue([cob("A", null)]);
    render(<TableroDecisiones />);
    expect(await screen.findByText(/Ningún producto tuvo consumo/)).toBeInTheDocument();
  });

  it("cada gráfico tiene su tabla con los mismos datos (criterio de accesibilidad)", async () => {
    render(<TableroDecisiones />);
    await screen.findByRole("img", { name: /^Productos por estado/ });
    await screen.findByRole("img", { name: /^Consumo por categoría/ });
    await screen.findByRole("img", { name: /^Cobertura/ });
    const botones = screen.getAllByRole("button", { name: "Ver como tabla" });
    expect(botones).toHaveLength(4);
    botones.forEach((b) => fireEvent.click(b));
    const tablas = screen.getAllByRole("table");
    expect(tablas.map((t) => t.querySelector("caption").textContent)).toEqual([
      "Productos por estado",
      "Productos con más salidas en los últimos 30 días",
      "Consumo de los últimos 30 días por categoría",
      "Días de cobertura por producto, de menor a mayor",
    ]);
    expect(within(pestana("Productos por estado").getByRole("table")).getByText("Disponible").closest("tr")).toHaveTextContent("40");
    expect(within(pestana("Top de rotación (30 días)").getByRole("table")).getByText("REM-001")).toBeInTheDocument();
  });

  it("sin datos, cada indicador lo dice", async () => {
    analitica.tablero.mockResolvedValue({ productos_por_estado: {}, valor_inventario: null, consumo_30_dias: "0.000", top_rotacion: [] });
    analitica.consumo.mockResolvedValue([]);
    analitica.cobertura.mockResolvedValue([]);
    render(<TableroDecisiones />);
    expect(await screen.findByText("Todavía no hay productos.")).toBeInTheDocument();
    expect(screen.getByText("No hubo salidas de productos en los últimos 30 días.")).toBeInTheDocument();
    expect(screen.getByText("No hubo consumo en los últimos 30 días.")).toBeInTheDocument();
    expect(screen.getByText("Todavía no hay productos para calcular la cobertura.")).toBeInTheDocument();
  });

  it("si falla el tablero, el consumo y la cobertura se siguen viendo y se puede reintentar", async () => {
    analitica.tablero.mockRejectedValueOnce(new ErrorApi({ status: 0, code: "SIN_CONEXION" })).mockResolvedValueOnce(TABLERO);
    render(<TableroDecisiones />);
    const alertas = await screen.findAllByRole("alert");
    expect(alertas[0]).toHaveTextContent("No hay conexión con el servidor");
    expect(await screen.findByRole("img", { name: /^Cobertura/ })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Reintentar" })[0]);
    expect(await screen.findByRole("img", { name: /^Productos por estado/ })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(analitica.tablero).toHaveBeenCalledTimes(2);
  });

  it("si falla el consumo o la cobertura, solo esa tarjeta muestra el error", async () => {
    analitica.consumo.mockRejectedValue(new ErrorApi({ status: 403, code: "SIN_PERMISO" }));
    analitica.cobertura.mockRejectedValue(new ErrorApi({ status: 500, code: "ERROR_HTTP" }));
    render(<TableroDecisiones />);
    await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(2));
    expect(pestana("Consumo de 30 días por categoría").getByRole("alert")).toHaveTextContent("No tienes permiso");
    expect(pestana("Cobertura estimada (días)").getByRole("alert")).toHaveTextContent("No fue posible cargar este indicador.");
    expect(screen.getByRole("img", { name: /^Productos por estado/ })).toBeInTheDocument();
  });
});
