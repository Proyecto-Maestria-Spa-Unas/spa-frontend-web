import { fireEvent, render, screen } from "@testing-library/react";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("muestra título y contenido", () => {
    render(
      <Alert variant="success" title="Guardado">
        El producto se registró.
      </Alert>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Guardado");
    expect(screen.getByRole("status")).toHaveTextContent("El producto se registró.");
  });

  it("usa role alert en errores y advertencias", () => {
    const { rerender } = render(<Alert variant="error">Falló</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    rerender(<Alert variant="warning">Atención</Alert>);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("usa role status en info y éxito", () => {
    const { rerender } = render(<Alert variant="info">Dato</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();
    rerender(<Alert variant="success">Listo</Alert>);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("aplica el color de cada variante", () => {
    const { rerender } = render(<Alert variant="error">x</Alert>);
    expect(screen.getByRole("alert").className).toContain("bg-estado-agotado-fondo");
    rerender(<Alert variant="success">x</Alert>);
    expect(screen.getByRole("status").className).toContain("bg-estado-disponible-fondo");
    rerender(<Alert variant="warning">x</Alert>);
    expect(screen.getByRole("alert").className).toContain("bg-estado-bajo-fondo");
  });

  it("una variante desconocida se muestra como info", () => {
    render(<Alert variant="otra">x</Alert>);
    expect(screen.getByRole("status").className).toContain("bg-estado-descontinuado-fondo");
  });

  it("por defecto es info", () => {
    render(<Alert>Mensaje</Alert>);
    expect(screen.getByRole("status").className).toContain("bg-estado-descontinuado-fondo");
  });

  it("no muestra el botón de cierre sin onClose", () => {
    render(<Alert>Mensaje</Alert>);
    expect(screen.queryByRole("button", { name: "Cerrar alerta" })).not.toBeInTheDocument();
  });

  it("llama a onClose al pulsar el botón de cierre", () => {
    const onClose = vi.fn();
    render(
      <Alert onClose={onClose} className="mb-4">
        Mensaje
      </Alert>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cerrar alerta" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveClass("mb-4");
  });

  it("funciona solo con título", () => {
    render(<Alert title="Solo título" />);
    expect(screen.getByRole("status")).toHaveTextContent("Solo título");
  });
});
