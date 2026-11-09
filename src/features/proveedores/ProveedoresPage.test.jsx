import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import {
  actualizarProveedor,
  crearProveedor,
  listarProveedores,
} from "../../api/catalogo";
import { AuthContext } from "../auth/AuthContext";
import { ProveedoresPage } from "./ProveedoresPage";

vi.mock("../../api/catalogo", () => ({
  listarProveedores: vi.fn(),
  crearProveedor: vi.fn(),
  actualizarProveedor: vi.fn(),
}));

vi.mock("./FormularioProveedor", () => ({
  FormularioProveedor: ({ proveedor, onGuardar, onCancelar }) => (
    <div>
      <p>{proveedor ? `Editando ${proveedor.nombre}` : "Creando proveedor"}</p>
      <button
        type="button"
        onClick={() =>
          onGuardar({
            nombre: "Distribuidora Nueva",
            nit: "900123456-7",
            ubicacion: { latitud: 4.65, longitud: -74.08 },
          })
        }
      >
        Simular guardado
      </button>
      <button type="button" onClick={onCancelar}>
        Cancelar formulario
      </button>
    </div>
  ),
}));

const PROVEEDOR = {
  id: "proveedor-1",
  nombre: "Distribuidora Central",
  nit: "900123456-7",
  telefono: "3001234567",
  correo: "central@spa.co",
  direccion: "Calle 10",
  ubicacion: { latitud: 4.64317, longitud: -74.06203 },
  activo: true,
};

function renderizar({ administrador = false } = {}) {
  return render(
    <AuthContext.Provider
      value={{
        tiene: (permiso) =>
          administrador && permiso === "catalogo.administrar",
      }}
    >
      <ProveedoresPage />
    </AuthContext.Provider>,
  );
}

describe("ProveedoresPage · consulta y permisos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarProveedores.mockResolvedValue([PROVEEDOR]);
  });

  it("muestra el estado de carga y después los proveedores", async () => {
    renderizar();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Cargando proveedores…",
    );

    expect(await screen.findByText("Distribuidora Central")).toBeInTheDocument();
    expect(screen.getByText("900123456-7")).toBeInTheDocument();
    expect(listarProveedores).toHaveBeenCalledWith(false);
  });

  it("muestra el mensaje cuando no hay proveedores", async () => {
    listarProveedores.mockResolvedValue([]);

    renderizar();

    expect(
      await screen.findByText("No hay proveedores registrados."),
    ).toBeInTheDocument();
  });

  it("muestra un error cuando falla la carga de proveedores", async () => {
    listarProveedores.mockRejectedValue(new Error("Error de conexión"));

    renderizar();

    expect(
        await screen.findByText("No fue posible cargar los proveedores."),
    ).toBeInTheDocument();

    expect(
        screen.getByRole("button", { name: "Reintentar" }),
    ).toBeInTheDocument();
    });

  it("vuelve a consultar los proveedores al reintentar", async () => {
    listarProveedores
        .mockRejectedValueOnce(new Error("Error de conexión"))
        .mockResolvedValueOnce([PROVEEDOR]);

    renderizar();

    expect(
        await screen.findByText("No fue posible cargar los proveedores."),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await screen.findByText("Distribuidora Central")).toBeInTheDocument();

    expect(listarProveedores).toHaveBeenCalledTimes(2);
    });

  it("permite consultar proveedores sin mostrar acciones administrativas", async () => {
    renderizar();

    expect(await screen.findByText("Distribuidora Central")).toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: "Nuevo proveedor" }),
    ).not.toBeInTheDocument();

    expect(screen.queryByRole("button", { name: "Editar" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Desactivar" }),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("checkbox", { name: "Mostrar proveedores inactivos" }),
    ).not.toBeInTheDocument();
  });

  it("muestra las acciones administrativas para un administrador", async () => {
    renderizar({ administrador: true });

    expect(await screen.findByText("Distribuidora Central")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Nuevo proveedor" }),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Desactivar" }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("checkbox", { name: "Mostrar proveedores inactivos" }),
    ).toBeInTheDocument();
  });
});


describe("ProveedoresPage · creación y edición", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarProveedores.mockResolvedValue([PROVEEDOR]);
  });

  it("abre el formulario y crea un proveedor", async () => {
    const nuevo = {
      ...PROVEEDOR,
      id: "proveedor-2",
      nombre: "Distribuidora Nueva",
    };

    crearProveedor.mockResolvedValue(nuevo);

    renderizar({ administrador: true });

    await screen.findByText("Distribuidora Central");

    fireEvent.click(screen.getByRole("button", { name: "Nuevo proveedor" }));

    expect(screen.getByText("Creando proveedor")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Simular guardado" }));

    expect(crearProveedor).toHaveBeenCalledWith({
      nombre: "Distribuidora Nueva",
      nit: "900123456-7",
      ubicacion: { latitud: 4.65, longitud: -74.08 },
    });

    expect(await screen.findByText("Proveedor creado.")).toBeInTheDocument();
    expect(screen.getByText("Distribuidora Nueva")).toBeInTheDocument();
  });

  it("abre el formulario con los datos del proveedor para editarlo", async () => {
    actualizarProveedor.mockResolvedValue({
      ...PROVEEDOR,
      nombre: "Distribuidora Nueva",
    });

    renderizar({ administrador: true });

    await screen.findByText("Distribuidora Central");

    fireEvent.click(screen.getByRole("button", { name: "Editar" }));

    expect(
      screen.getByText("Editando Distribuidora Central"),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Simular guardado" }));

    await waitFor(() => {
      expect(actualizarProveedor).toHaveBeenCalledWith(
        "proveedor-1",
        {
          nombre: "Distribuidora Nueva",
          nit: "900123456-7",
          ubicacion: { latitud: 4.65, longitud: -74.08 },
        },
      );
    });

    expect(await screen.findByText("Proveedor actualizado.")).toBeInTheDocument();
  });
});


describe("ProveedoresPage · estado de proveedores", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listarProveedores.mockResolvedValue([PROVEEDOR]);
  });

  it("desactiva un proveedor", async () => {
    actualizarProveedor.mockResolvedValue({
      ...PROVEEDOR,
      activo: false,
    });

    renderizar({ administrador: true });

    await screen.findByText("Distribuidora Central");

    fireEvent.click(screen.getByRole("button", { name: "Desactivar" }));

    await waitFor(() => {
      expect(actualizarProveedor).toHaveBeenCalledWith("proveedor-1", {
        activo: false,
      });
    });

    expect(await screen.findByText("Proveedor desactivado.")).toBeInTheDocument();
    expect(screen.queryByText("Distribuidora Central")).not.toBeInTheDocument();
  });

  it("activa un proveedor inactivo", async () => {
    listarProveedores.mockResolvedValue([
      { ...PROVEEDOR, activo: false },
    ]);

    actualizarProveedor.mockResolvedValue({
      ...PROVEEDOR,
      activo: true,
    });

    renderizar({ administrador: true });

    await screen.findByText("Distribuidora Central");

    fireEvent.click(screen.getByRole("button", { name: "Activar" }));

    await waitFor(() => {
      expect(actualizarProveedor).toHaveBeenCalledWith("proveedor-1", {
        activo: true,
      });
    });

    expect(await screen.findByText("Proveedor activado.")).toBeInTheDocument();
    expect(await screen.findByText("● Activo")).toBeInTheDocument();
  });

  it("solicita los proveedores inactivos al activar el filtro", async () => {
    renderizar({ administrador: true });

    await screen.findByText("Distribuidora Central");

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "Mostrar proveedores inactivos",
      }),
    );

    await waitFor(() => {
      expect(listarProveedores).toHaveBeenLastCalledWith(true);
    });
  });
});