import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import * as analitica from "../../api/analitica";
import { ErrorApi } from "../../api/cliente";
import { AuthContext } from "../auth/AuthContext";
import { ExportarDatos } from "./ExportarDatos";
import { guardarArchivo } from "./exportacion";

vi.mock("../../api/analitica");
vi.mock("./exportacion", async (original) => ({ ...(await original()), guardarArchivo: vi.fn() }));

const ARCHIVO = new Blob(["codigo\nESM-001\n"], { type: "text/csv" });
const NOMBRE = /^(inventario|movimientos)-\d{8}\.(csv|parquet)$/;

function mostrar(permisos = ["analitica.consultar"]) {
  const sesion = { tiene: (permiso) => permisos.includes(permiso) };
  return render(
    <AuthContext.Provider value={sesion}>
      <ExportarDatos />
    </AuthContext.Provider>,
  );
}

const descargar = () => fireEvent.click(screen.getByRole("button", { name: /Descargar|Preparando/ }));

describe("ExportarDatos", () => {
  beforeEach(() => vi.resetAllMocks());

  it("se oculta sin el permiso analitica.consultar (la Manicurista no lo tiene)", () => {
    const { container } = mostrar(["alerta.consultar"]);
    expect(container).toBeEmptyDOMElement();
  });

  it("ofrece inventario en CSV por defecto, con las dos opciones de cada lista", () => {
    mostrar();
    expect(screen.getByRole("heading", { name: "Exportar datos" })).toBeInTheDocument();
    expect(screen.getByLabelText("Qué descargar")).toHaveValue("inventario");
    expect(screen.getByLabelText("Formato")).toHaveValue("csv");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      "Inventario",
      "Movimientos",
      "CSV (se abre en Excel)",
      "Parquet (análisis de datos)",
    ]);
  });

  it("descarga el inventario en CSV y avisa el nombre del archivo", async () => {
    analitica.exportar.mockResolvedValue(ARCHIVO);
    mostrar();
    descargar();
    expect(await screen.findByText(/^Descarga lista: inventario-\d{8}\.csv$/)).toBeInTheDocument();
    expect(analitica.exportar).toHaveBeenCalledWith("inventario", "csv");
    expect(guardarArchivo).toHaveBeenCalledWith(ARCHIVO, expect.stringMatching(NOMBRE));
  });

  it("descarga lo que el usuario eligió", async () => {
    analitica.exportar.mockResolvedValue(ARCHIVO);
    mostrar();
    fireEvent.change(screen.getByLabelText("Qué descargar"), { target: { value: "movimientos" } });
    fireEvent.change(screen.getByLabelText("Formato"), { target: { value: "parquet" } });
    descargar();
    expect(await screen.findByText(/^Descarga lista: movimientos-\d{8}\.parquet$/)).toBeInTheDocument();
    expect(analitica.exportar).toHaveBeenCalledWith("movimientos", "parquet");
    expect(guardarArchivo).toHaveBeenCalledWith(ARCHIVO, expect.stringMatching(/^movimientos-\d{8}\.parquet$/));
  });

  it("mientras prepara el archivo bloquea el botón para no pedir dos veces", async () => {
    let terminar;
    analitica.exportar.mockReturnValue(new Promise((r) => (terminar = r)));
    mostrar();
    descargar();
    expect(screen.getByRole("button", { name: "Preparando archivo…" })).toBeDisabled();
    descargar();
    expect(analitica.exportar).toHaveBeenCalledTimes(1);
    terminar(ARCHIVO);
    expect(await screen.findByRole("button", { name: "Descargar" })).toBeEnabled();
  });

  it.each([
    [new ErrorApi({ status: 0, code: "SIN_CONEXION" }), "No hay conexión con el servidor"],
    [new ErrorApi({ status: 403, code: "ERROR_HTTP" }), "No tienes permiso para exportar datos."],
    [new ErrorApi({ status: 500, code: "ERROR_HTTP" }), "No fue posible generar el archivo"],
  ])("explica el error y no descarga nada", async (error, mensaje) => {
    analitica.exportar.mockRejectedValue(error);
    mostrar();
    descargar();
    expect(await screen.findByRole("alert")).toHaveTextContent(mensaje);
    expect(guardarArchivo).not.toHaveBeenCalled();
  });

  it("después de un error se puede volver a intentar y el aviso desaparece", async () => {
    analitica.exportar.mockRejectedValueOnce(new ErrorApi({ status: 500, code: "ERROR_HTTP" })).mockResolvedValueOnce(ARCHIVO);
    mostrar();
    descargar();
    await screen.findByRole("alert");
    descargar();
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
    expect(await screen.findByText(/Descarga lista/)).toBeInTheDocument();
    expect(guardarArchivo).toHaveBeenCalledTimes(1);
  });
});
