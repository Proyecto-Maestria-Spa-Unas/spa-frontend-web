// X4 · criterio "lista de alertas y contador en el menú", de punta a punta con el simulador de la API.
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

describe("Alertas · contador del menú y lista", () => {
  beforeEach(() => {
    sessionStorage.clear();
    reiniciarSimulacion();
  });

  it("el menú muestra cuántos productos están en alerta (1 bajo stock + 1 agotado)", async () => {
    abrir("/inventario", TOKENS.gerente);
    expect(await screen.findByText("2 alertas de stock")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Alertas y tablero" })).toBeInTheDocument();
  });

  it("al abrir Alertas y tablero se ve la lista con los productos en alerta", async () => {
    abrir("/inventario", TOKENS.manicurista);
    fireEvent.click(await screen.findByRole("link", { name: "Alertas y tablero" }));
    const tabla = await screen.findByRole("table", { name: "Productos que requieren reposición" });
    expect(within(tabla).getByText("Acetona pura")).toBeInTheDocument();
    expect(within(tabla).getByText("Guantes de nitrilo talla M")).toBeInTheDocument();
    expect(within(tabla).queryByText("Esmalte rojo 15 ml")).not.toBeInTheDocument();
  });

  it("el filtro Agotado deja solo los agotados", async () => {
    abrir("/tablero", TOKENS.admin);
    await screen.findByRole("table", { name: "Productos que requieren reposición" });
    fireEvent.change(screen.getByLabelText("Estado"), { target: { value: "AGOTADO" } });
    expect(await screen.findByText("1 producto en alerta")).toBeInTheDocument();
    // El tablero de decisiones (gráficos) también nombra productos: se mira solo la tabla de alertas.
    const tabla = screen.getByRole("table", { name: "Productos que requieren reposición" });
    expect(within(tabla).queryByText("Acetona pura")).not.toBeInTheDocument();
    expect(within(tabla).getByText("Guantes de nitrilo talla M")).toBeInTheDocument();
  });

  it("al reponer un producto, el contador del menú baja al cambiar de pantalla", async () => {
    abrir("/inventario", TOKENS.admin);
    expect(await screen.findByText("2 alertas de stock")).toBeInTheDocument();
    const { adaptadorSimulado } = await import("../../mocks/adaptador");
    await adaptadorSimulado({
      method: "post",
      url: "/movimientos/entradas",
      headers: { Authorization: `Bearer ${TOKENS.admin}`, "Idempotency-Key": "x4-reposicion" },
      data: JSON.stringify({ producto_id: "p0000000-0000-4000-8000-000000000003", motivo_codigo: "COMPRA", cantidad: "30", costo_unitario: "1000" }),
    });
    fireEvent.click(screen.getByRole("link", { name: "Historial" }));
    expect(await screen.findByText("1 alerta de stock")).toBeInTheDocument();
  });
});
