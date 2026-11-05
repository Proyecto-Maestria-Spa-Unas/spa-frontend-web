import { render, screen } from "@testing-library/react";
import { Card } from "./Card";

describe("Card", () => {
  it("muestra el título y queda como región nombrada", () => {
    render(<Card title="Resumen">Contenido</Card>);
    expect(screen.getByRole("region", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Resumen" })).toBeInTheDocument();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
  });

  it("sin título no crea región ni encabezado", () => {
    render(<Card>Solo contenido</Card>);
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("muestra el pie cuando se envía", () => {
    render(<Card footer={<button type="button">Guardar</button>}>Contenido</Card>);
    expect(screen.getByRole("button", { name: "Guardar" })).toBeInTheDocument();
  });

  it("permite cambiar la etiqueta, agregar clases y pasar atributos", () => {
    render(
      <Card as="article" className="w-64" data-testid="tarjeta">
        Contenido
      </Card>,
    );
    const tarjeta = screen.getByTestId("tarjeta");
    expect(tarjeta.tagName).toBe("ARTICLE");
    expect(tarjeta).toHaveClass("w-64");
    expect(tarjeta.className).toContain("bg-marca-superficie");
  });
});
