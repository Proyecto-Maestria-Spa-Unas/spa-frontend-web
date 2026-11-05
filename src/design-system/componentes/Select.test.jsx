import { createRef } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Select } from "./Select";

const OPCIONES = [
  { value: "esmaltes", label: "Esmaltes" },
  { value: "limas", label: "Limas" },
];

describe("Select", () => {
  it("asocia la etiqueta y muestra las opciones", () => {
    render(<Select label="Categoría" options={OPCIONES} />);
    expect(screen.getByRole("combobox", { name: "Categoría" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("agrega una primera opción vacía con placeholder", () => {
    render(<Select label="Categoría" options={OPCIONES} placeholder="Selecciona una categoría" />);
    const opciones = screen.getAllByRole("option");
    expect(opciones).toHaveLength(3);
    expect(opciones[0]).toHaveValue("");
  });

  it("notifica el cambio de selección", () => {
    const onChange = vi.fn();
    render(<Select label="Categoría" options={OPCIONES} onChange={onChange} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Categoría" }), { target: { value: "limas" } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("marca el error y enlaza ayuda y error", () => {
    render(<Select label="Categoría" options={OPCIONES} hint="Obligatoria" error="Elige una opción" />);
    const campo = screen.getByRole("combobox", { name: "Categoría" });
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Obligatoria Elige una opción");
    expect(campo.className).toContain("border-estado-agotado-texto");
  });

  it("sin error usa el borde normal y no declara aria-invalid", () => {
    render(<Select label="Categoría" options={OPCIONES} />);
    const campo = screen.getByRole("combobox", { name: "Categoría" });
    expect(campo).not.toHaveAttribute("aria-invalid");
    expect(campo.className).toContain("border-marca-borde");
  });

  it("indica que es obligatorio", () => {
    render(<Select label="Categoría" options={OPCIONES} required />);
    expect(screen.getByRole("combobox", { name: "Categoría" })).toBeRequired();
  });

  it("usa el id recibido, aplica className al contenedor y expone la ref", () => {
    const ref = createRef();
    const { container } = render(<Select label="Categoría" id="categoria" className="mb-4" ref={ref} />);
    expect(container.firstChild).toHaveClass("mb-4");
    expect(ref.current).toHaveAttribute("id", "categoria");
  });

  it("funciona sin etiqueta y sin opciones", () => {
    render(<Select aria-label="Filtrar" />);
    expect(screen.getByRole("combobox", { name: "Filtrar" })).toBeInTheDocument();
    expect(screen.queryAllByRole("option")).toHaveLength(0);
  });
});
