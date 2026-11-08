import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../../App";
import { AuthProvider } from "../auth/AuthProvider";
import { rutaProducto } from "../../constants/routes";
import { PRODUCTOS } from "../../mocks/datos";
import { reiniciarSimulacion } from "../../mocks/adaptador";
import { formatoPesos } from "./formato";

const ACETONA = PRODUCTOS[1];

function renderEn(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function ingresarYAbrir(correo, ruta) {
  renderEn(ruta);
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: correo } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "spa12345" } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
}

describe("ProductoDetallePage (X7)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    reiniciarSimulacion();
  });

  it("muestra el producto y su kardex valorizado", async () => {
    sessionStorage.setItem("spa.token", "simulado.a0000000-0000-4000-8000-000000000001");
    renderEn(rutaProducto(ACETONA.id));
    expect(await screen.findByRole("heading", { name: `${ACETONA.nombre} · ${ACETONA.codigo}` })).toBeInTheDocument();
    expect(await screen.findByRole("table")).toBeInTheDocument();
    // Compra de 500 a 38 y salida de 150 valorada al promedio: valor final 350 × 38 = 13.300
    expect(screen.getAllByText(formatoPesos("13300.0000")).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "← Volver al inventario" })).toBeInTheDocument();
  });

  it("vuelve a consultar el kardex al filtrar por fechas", async () => {
    sessionStorage.setItem("spa.token", "simulado.a0000000-0000-4000-8000-000000000001");
    renderEn(rutaProducto(ACETONA.id));
    await screen.findByRole("table");
    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-12-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });

  it("informa cuando el producto no existe", async () => {
    sessionStorage.setItem("spa.token", "simulado.a0000000-0000-4000-8000-000000000001");
    renderEn(rutaProducto("no-existe"));
    expect(await screen.findByRole("alert")).toHaveTextContent("El producto no existe.");
  });

  it("la manicurista no tiene analitica.consultar y vuelve al inventario", async () => {
    await ingresarYAbrir("manicurista@spa.co", rutaProducto(ACETONA.id));
    expect(await screen.findByRole("heading", { name: "Inventario" })).toBeInTheDocument();
  });
});
