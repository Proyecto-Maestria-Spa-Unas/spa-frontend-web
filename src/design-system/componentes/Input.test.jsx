import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("asocia la etiqueta con el campo", () => {
    render(<Input label="Usuario" />);
    expect(screen.getByRole("textbox", { name: "Usuario" })).toBeInTheDocument();
  });

  it("enlaza la ayuda con aria-describedby", () => {
    render(<Input label="Correo" hint="Usa tu correo institucional" />);
    expect(screen.getByRole("textbox", { name: "Correo" })).toHaveAccessibleDescription("Usa tu correo institucional");
  });

  it("marca el error con aria-invalid y lo enlaza al campo", () => {
    render(<Input label="Correo" error="Correo no válido" />);
    const campo = screen.getByRole("textbox", { name: "Correo" });
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Correo no válido");
    expect(campo.className).toContain("border-estado-agotado-texto");
  });

  it("combina ayuda y error en la descripción", () => {
    render(<Input label="Correo" hint="Ayuda" error="Error" />);
    expect(screen.getByRole("textbox", { name: "Correo" })).toHaveAccessibleDescription("Ayuda Error");
  });

  it("sin error no declara aria-invalid", () => {
    render(<Input label="Nombre" />);
    const campo = screen.getByRole("textbox", { name: "Nombre" });
    expect(campo).not.toHaveAttribute("aria-invalid");
    expect(campo.className).toContain("border-marca-borde");
  });

  it("indica visualmente y de forma nativa que es obligatorio", () => {
    render(<Input label="Nombre" required />);
    const campo = screen.getByRole("textbox", { name: "Nombre" });
    expect(campo).toBeRequired();
  });

  it("usa el id recibido", () => {
    render(<Input label="Nombre" id="nombre" />);
    expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveAttribute("id", "nombre");
  });

  it("pasa el resto de props al campo", () => {
    render(<Input label="Nombre" placeholder="Escribe aquí" disabled />);
    const campo = screen.getByPlaceholderText("Escribe aquí");
    expect(campo).toBeDisabled();
  });

  it("notifica el cambio cuando está habilitado", () => {
    const onChange = vi.fn();
    render(<Input label="Nombre" onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), { target: { value: "Ana" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("aplica className al contenedor y expone la ref del input", () => {
    const ref = createRef();
    const { container } = render(<Input label="Nombre" className="mb-4" ref={ref} />);
    expect(container.firstChild).toHaveClass("mb-4");
    expect(ref.current.tagName).toBe("INPUT");
  });

  it("funciona sin etiqueta", () => {
    render(<Input aria-label="Buscar" />);
    expect(screen.getByRole("textbox", { name: "Buscar" })).toBeInTheDocument();
  });
});
