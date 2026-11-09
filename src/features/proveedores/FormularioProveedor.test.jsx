
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ErrorApi } from "../../api/cliente";
import { FormularioProveedor } from "./FormularioProveedor";

vi.mock("./MapaUbicacionProveedor", () => ({
  MapaUbicacionProveedor: ({ ubicacion, alElegirPunto }) => (
    <button
      type="button"
      onClick={() =>
        alElegirPunto({ latitud: 4.65, longitud: -74.08 })
      }
    >
      Seleccionar ubicación
      <span>
        {ubicacion.latitud}, {ubicacion.longitud}
      </span>
    </button>
  ),
}));

const UBICACION = { latitud: 4.64317, longitud: -74.06203 };

function renderizar(props = {}) {
  const onGuardar = vi.fn().mockResolvedValue(undefined);
  const onCancelar = vi.fn();

  render(
    <FormularioProveedor
      ubicacionInicial={UBICACION}
      onGuardar={onGuardar}
      onCancelar={onCancelar}
      {...props}
    />,
  );

  return { onGuardar, onCancelar };
}

function completarFormulario() {
  fireEvent.change(screen.getByRole("textbox", { name: /Nombre del proveedor/ }), {
    target: { value: "Distribuidora Nueva" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: /NIT/ }), {
    target: { value: "900123456-7" },
  });
}



describe("FormularioProveedor · campos y validación", () => {
  it("muestra los campos y la ubicación inicial", () => {
    renderizar();

    expect(screen.getByRole("textbox", { name: /Nombre del proveedor/ })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /NIT/ })).toBeRequired();
    expect(screen.getByLabelText("Teléfono")).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByLabelText("Dirección")).toBeInTheDocument();

    expect(screen.getByText(/Latitud:.*4\.643170.*Longitud:.*-74\.062030/)).toBeInTheDocument();
  });

  it("muestra errores y enfoca el primer campo obligatorio", () => {
    const { onGuardar } = renderizar();

    fireEvent.click(screen.getByRole("button", { name: "Guardar proveedor" }));

    expect(screen.getByRole("textbox", { name: /Nombre del proveedor/ })).toHaveAccessibleDescription(
      "Ingresa el nombre del proveedor.",
    );
    expect(screen.getByRole("textbox", { name: /NIT/ })).toHaveAccessibleDescription(
    "Formato: 900123456-7. Ingresa el NIT.",
);
    expect(screen.getByRole("textbox", { name: /Nombre del proveedor/ })).toHaveFocus();
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it("limpia el error de un campo al escribir", () => {
    renderizar();

    fireEvent.click(screen.getByRole("button", { name: "Guardar proveedor" }));
    fireEvent.change(screen.getByRole("textbox", { name: /Nombre del proveedor/ }), {
      target: { value: "Distribuidora" },
    });

    expect(screen.getByRole("textbox", { name: /Nombre del proveedor/ })).not.toHaveAttribute(
      "aria-invalid",
    );
    expect(screen.getByRole("textbox", { name: /NIT/ })).toHaveAttribute("aria-invalid", "true");
  });

  it("permite seleccionar una ubicación en el mapa", () => {
    renderizar();

    fireEvent.click(screen.getByRole("button", { name: /Seleccionar ubicación/ }));

    expect(screen.getByText(/Latitud:.*4\.650000.*Longitud:.*-74\.080000/)).toBeInTheDocument();
  });
});

describe("FormularioProveedor · creación y edición", () => {
  it("envía los datos completos al crear un proveedor", async () => {
    const { onGuardar } = renderizar();

    completarFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Guardar proveedor" }));

    await waitFor(() => {
      expect(onGuardar).toHaveBeenCalledWith({
        nombre: "Distribuidora Nueva",
        nit: "900123456-7",
        telefono: null,
        correo: null,
        direccion: null,
        ubicacion: UBICACION,
      });
    });
  });

  it("edita un proveedor sin enviar ni permitir modificar el NIT", async () => {
    const proveedor = {
      id: "proveedor-1",
      nombre: "Distribuidora anterior",
      nit: "900123456-7",
      telefono: "3001234567",
      correo: "anterior@spa.co",
      direccion: "Calle 10",
      ubicacion: UBICACION,
    };

    const { onGuardar } = renderizar({ proveedor });

    const campoNit = screen.getByRole("textbox", { name: /NIT/ });

    expect(campoNit).toBeDisabled();
    expect(campoNit).toHaveValue("900123456-7");

    fireEvent.change(
      screen.getByRole("textbox", { name: /Nombre del proveedor/ }),
      { target: { value: "Distribuidora actualizada" } },
    );

    fireEvent.click(screen.getByRole("button", { name: "Guardar proveedor" }));

    await waitFor(() => {
      expect(onGuardar).toHaveBeenCalledWith({
        nombre: "Distribuidora actualizada",
        telefono: "3001234567",
        correo: "anterior@spa.co",
        direccion: "Calle 10",
        ubicacion: UBICACION,
      });
    });
  });
});

describe("FormularioProveedor · errores de API", () => {
  it("muestra un mensaje cuando el NIT ya está registrado", async () => {
    const error = new ErrorApi({
      status: 409,
      code: "CODIGO_DUPLICADO",
      title: "Conflicto",
    });

    const onGuardar = vi.fn().mockRejectedValue(error);

    render(
      <FormularioProveedor
        ubicacionInicial={UBICACION}
        onGuardar={onGuardar}
        onCancelar={vi.fn()}
      />,
    );

    completarFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Guardar proveedor" }));

    expect(
      await screen.findByText(
        "Ya existe un proveedor registrado con ese NIT.",
      ),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Guardar proveedor" })).toBeEnabled();
  });

  it("asocia los errores 422 del servidor a los campos correspondientes", async () => {
    const error = new ErrorApi({
      status: 422,
      code: "DATOS_INVALIDOS",
      errors: [
        {
          campo: "proveedor.nombre",
          mensaje: "El nombre ya está registrado.",
        },
      ],
    });

    const onGuardar = vi.fn().mockRejectedValue(error);

    render(
      <FormularioProveedor
        ubicacionInicial={UBICACION}
        onGuardar={onGuardar}
        onCancelar={vi.fn()}
      />,
    );

    completarFormulario();

    fireEvent.click(screen.getByRole("button", { name: "Guardar proveedor" }));

    expect(
      await screen.findByText("El nombre ya está registrado."),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", { name: /Nombre del proveedor/ }),
    ).toHaveAttribute("aria-invalid", "true");
  });
});
