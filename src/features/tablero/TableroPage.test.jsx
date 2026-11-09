import { render, screen } from "@testing-library/react";
import { AuthContext } from "../auth/AuthContext";
import { TableroPage } from "./TableroPage";

vi.mock("./ListaAlertas", () => ({
  ListaAlertas: () => <div>lista de alertas</div>,
}));
vi.mock("./ExportarDatos", () => ({ ExportarDatos: () => null }));
vi.mock("./TableroDecisiones", () => ({ TableroDecisiones: () => <div>tablero de decisiones</div> }));
vi.mock("./MapaProveedores", () => ({
  MapaProveedores: () => <div>mapa de proveedores</div>,
}));

function mostrar(permisos) {
  const sesion = { tiene: (permiso) => permisos.includes(permiso) };
  return render(
    <AuthContext.Provider value={sesion}>
      <TableroPage />
    </AuthContext.Provider>,
  );
}

describe("TableroPage · mapa y gráficos por rol", () => {
  it("la Manicurista ve las alertas pero no el mapa de proveedores ni los gráficos", () => {
    mostrar(["alerta.consultar", "movimiento.registrar_salida"]);
    expect(screen.getByText("lista de alertas")).toBeInTheDocument();
    expect(screen.queryByText("mapa de proveedores")).toBeNull();
    expect(screen.queryByText("tablero de decisiones")).toBeNull();
  });

  it("el Administrador y el Gerente ven el mapa de proveedores y el tablero de decisiones", () => {
    mostrar(["alerta.consultar", "analitica.consultar"]);
    expect(screen.getByText("mapa de proveedores")).toBeInTheDocument();
    expect(screen.getByText("tablero de decisiones")).toBeInTheDocument();
  });
});
