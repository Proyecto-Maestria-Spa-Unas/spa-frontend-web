// F8 · criterio "visible solo con usuario.gestionar": menú y ruta, con la sesión simulada.
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

function abrir(ruta, token) {
  sessionStorage.setItem("spa.token", token);
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("Usuarios · acceso por permiso", () => {
  beforeEach(() => {
    sessionStorage.clear();
    reiniciarSimulacion();
  });

  it("la manicurista no ve la opción Usuarios y, si entra por la dirección, vuelve al inventario", async () => {
    abrir("/usuarios", TOKENS.manicurista);
    expect(await screen.findByRole("heading", { name: "Inventario" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Usuarios" })).not.toBeInTheDocument();
  });

  it("el administrador ve la opción, entra a la pantalla y ve la lista del simulador", async () => {
    abrir("/inventario", TOKENS.admin);
    fireEvent.click(await screen.findByRole("link", { name: "Usuarios" }));
    expect(await screen.findByRole("heading", { name: "Usuarios" })).toBeInTheDocument();
    expect(await screen.findByText("Diana Pérez")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nuevo usuario" })).toBeInTheDocument();
  });

  it("el gerente también tiene el permiso", async () => {
    abrir("/usuarios", TOKENS.gerente);
    expect(await screen.findByRole("heading", { name: "Usuarios" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Usuarios" })).toBeInTheDocument();
  });
});
