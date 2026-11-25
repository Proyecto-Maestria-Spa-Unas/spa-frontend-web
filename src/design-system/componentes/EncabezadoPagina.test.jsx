import { render, screen } from "@testing-library/react";
import { EncabezadoPagina } from "./EncabezadoPagina";

describe("EncabezadoPagina", () => {
  it("muestra la marca, el título y la descripción, y oculta el ícono a los lectores de pantalla", () => {
    const { container } = render(
      <EncabezadoPagina icono={<circle cx="12" cy="12" r="5" />} titulo="Usuarios" descripcion="Gestiona los usuarios." />,
    );
    expect(screen.getByText("NAILSSPA")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Usuarios" })).toBeInTheDocument();
    expect(screen.getByText("Gestiona los usuarios.")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("muestra las acciones cuando se envían", () => {
    render(<EncabezadoPagina icono={<circle cx="12" cy="12" r="5" />} titulo="Usuarios" acciones={<button>Nuevo usuario</button>} />);
    expect(screen.getByRole("button", { name: "Nuevo usuario" })).toBeInTheDocument();
  });
});
