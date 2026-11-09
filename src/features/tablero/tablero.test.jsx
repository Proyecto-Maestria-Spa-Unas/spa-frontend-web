// F15 · criterio "gráficos con datos también en tabla", de punta a punta con el simulador de la API.
import { fireEvent, render, screen, within } from "@testing-library/react";
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

describe("Tablero de decisiones en Alertas y tablero", () => {
  beforeEach(() => {
    sessionStorage.clear();
    reiniciarSimulacion();
  });

  it("el gerente ve los cinco indicadores y puede pasar cada gráfico a tabla", async () => {
    abrir(TOKENS.gerente);
    expect(await screen.findByRole("heading", { name: "Tablero de decisiones" })).toBeInTheDocument();
    expect(await screen.findByText(/13\.300/)).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: /^Productos por estado: Disponible 1, Bajo stock 1, Agotado 1, Descontinuado 1/ })).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "Top de rotación: Acetona pura 150, Esmalte rojo 15 ml 26, Guantes de nitrilo talla M 6" })).toBeInTheDocument();
    expect(await screen.findByRole("img", { name: "Consumo por categoría: Removedores 150, Esmaltes 26, Desechables 6" })).toBeInTheDocument();
    const cobertura = await screen.findByRole("img", { name: /^Cobertura en días: Guantes de nitrilo talla M 0 días, Esmalte rojo 15 ml 27,7 días/ });
    expect(cobertura).toBeInTheDocument();

    const tarjeta = screen.getByRole("region", { name: "Cobertura estimada (días)" });
    fireEvent.click(within(tarjeta).getByRole("button", { name: "Ver como tabla" }));
    expect(within(tarjeta).getByText("Lima de cartón 180/240 (HER-010)")).toBeInTheDocument();
    expect(within(tarjeta).getByText("Sin consumo")).toBeInTheDocument();
  });

  it("la manicurista ve las alertas pero no el tablero de decisiones", async () => {
    abrir(TOKENS.manicurista);
    await screen.findByRole("table", { name: "Productos que requieren reposición" });
    expect(screen.queryByRole("heading", { name: "Tablero de decisiones" })).not.toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /^Productos por estado/ })).not.toBeInTheDocument();
  });
});
