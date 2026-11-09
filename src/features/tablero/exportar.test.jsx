// X5 · criterio "botón de descarga en el tablero", de punta a punta con el simulador de la API.
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../App";
import { reiniciarSimulacion } from "../../mocks/adaptador";
import { AuthProvider } from "../auth/AuthProvider";

const TOKENS = {
  admin: "simulado.a0000000-0000-4000-8000-000000000001",
  manicurista: "simulado.a0000000-0000-4000-8000-000000000002",
  gerente: "simulado.a0000000-0000-4000-8000-000000000003",
};

function abrir(token) {
  sessionStorage.setItem("spa.token", token);
  return render(
    <MemoryRouter initialEntries={["/tablero"]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Exportar datos en Alertas y tablero", () => {
  beforeEach(() => {
    sessionStorage.clear();
    reiniciarSimulacion();
    URL.createObjectURL = vi.fn(() => "blob:simulado");
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => vi.restoreAllMocks());

  it("el gerente descarga un archivo desde el tablero", async () => {
    const descargas = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      descargas.push(this.download);
    });
    abrir(TOKENS.gerente);
    fireEvent.click(await screen.findByRole("button", { name: "Descargar" }));
    expect(await screen.findByText(/^Descarga lista: inventario-\d{8}\.csv$/)).toBeInTheDocument();
    expect(descargas).toHaveLength(1);
    expect(descargas[0]).toMatch(/^inventario-\d{8}\.csv$/);
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
  });

  it("la manicurista ve las alertas pero no el botón de exportar", async () => {
    abrir(TOKENS.manicurista);
    await screen.findByRole("table", { name: "Productos que requieren reposición" });
    expect(screen.queryByRole("heading", { name: "Exportar datos" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Descargar" })).not.toBeInTheDocument();
  });
});
