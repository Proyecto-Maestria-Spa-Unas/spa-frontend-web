import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./features/auth/AuthProvider";
import { useAuth } from "./features/auth/AuthContext";
import { EstadoBadge } from "./design-system/componentes/EstadoBadge";
import { ESTADO_INVENTARIO } from "./design-system/estados";
import { reiniciarSimulacion } from "./mocks/adaptador";

function renderEn(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function ingresar(correo, contrasena = "spa12345") {
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: correo } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: contrasena } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
}

describe("App", () => {
  beforeEach(() => {
    sessionStorage.clear();
    reiniciarSimulacion();
  });

  it("redirige al login cuando no hay sesión (RNF-07)", () => {
    renderEn("/inventario");
    expect(screen.getByRole("heading", { name: "Ingresar" })).toBeInTheDocument();
  });

  it("inicia sesión y muestra solo el menú permitido (manicurista)", async () => {
    renderEn("/login");
    await ingresar("manicurista@spa.co");
    expect(await screen.findByRole("heading", { name: "Inventario" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Historial" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  });

  it("muestra el error según el code de la API", async () => {
    renderEn("/login");
    await ingresar("admin@spa.co", "equivocada");
    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
  });

  it("navega a una ruta permitida por el permiso del rol", async () => {
    renderEn("/login");
    await ingresar("manicurista@spa.co");
    await screen.findByRole("heading", { name: "Inventario" });
    fireEvent.click(screen.getByRole("link", { name: "Alertas y tablero" }));
    expect(await screen.findByRole("heading", { name: "Alertas y tablero" })).toBeInTheDocument();
  });

  it("recupera la sesión desde el token y permite salir", async () => {
    sessionStorage.setItem("spa.token", "simulado.a0000000-0000-4000-8000-000000000001");
    renderEn("/usuarios");
    expect(await screen.findByRole("heading", { name: "Usuarios" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    expect(await screen.findByRole("heading", { name: "Ingresar" })).toBeInTheDocument();
  });

  it("un token inválido cierra la sesión", async () => {
    sessionStorage.setItem("spa.token", "token-falso");
    renderEn("/inventario");
    expect(await screen.findByRole("heading", { name: "Ingresar" })).toBeInTheDocument();
  });

  it("useAuth fuera del proveedor lanza error", () => {
    function Sonda() {
      useAuth();
      return null;
    }
    expect(() => render(<Sonda />)).toThrow("useAuth");
  });
});

describe("design system", () => {
  it("define los 4 estados con texto e ícono (no solo color)", () => {
    expect(Object.keys(ESTADO_INVENTARIO)).toEqual(["DISPONIBLE", "BAJO_STOCK", "AGOTADO", "DESCONTINUADO"]);
    render(<EstadoBadge estado="AGOTADO" />);
    expect(screen.getByText("Agotado")).toBeInTheDocument();
  });

  it("EstadoBadge ignora estados desconocidos", () => {
    const { container } = render(<EstadoBadge estado="OTRO" />);
    expect(container).toBeEmptyDOMElement();
  });
});
