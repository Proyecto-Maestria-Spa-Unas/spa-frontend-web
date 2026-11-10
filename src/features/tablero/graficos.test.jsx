import { fireEvent, render, screen, within } from "@testing-library/react";
import { GraficoBarras } from "./GraficoBarras";
import { TablaDatos } from "./TablaDatos";
import { TarjetaGrafico } from "./TarjetaGrafico";

describe("GraficoBarras", () => {
  const filas = [
    { clave: "a", etiqueta: "Acetona pura", detalle: "REM-001", valor: 150, texto: "150" },
    { clave: "b", etiqueta: "Esmalte", valor: 75, texto: "75", color: "bg-estado-agotado-texto" },
  ];

  it("se anuncia como imagen con su resumen y escribe el valor de cada barra", () => {
    render(<GraficoBarras descripcion="Consumo: Acetona 150, Esmalte 75" filas={filas} />);
    const grafico = screen.getByRole("img", { name: "Consumo: Acetona 150, Esmalte 75" });
    expect(within(grafico).getByText("150")).toBeInTheDocument();
    expect(within(grafico).getByText("75")).toBeInTheDocument();
    expect(within(grafico).getByText("Acetona pura")).toHaveAttribute("title", "Acetona pura (REM-001)");
    expect(within(grafico).getByText("Esmalte")).toHaveAttribute("title", "Esmalte");
  });

  it("el ancho de la barra es proporcional al máximo", () => {
    const { container } = render(<GraficoBarras descripcion="x" filas={filas} />);
    const barras = [...container.querySelectorAll("span.block")];
    expect(barras.map((b) => b.style.width)).toEqual(["100%", "50%"]);
    expect(barras[1].className).toContain("bg-estado-agotado-texto");
    expect(barras[0].className).toContain("bg-marca-primario");
  });
});

describe("TablaDatos", () => {
  it("muestra encabezados, descripción y celdas alineadas", () => {
    render(
      <TablaDatos
        descripcion="Consumo por categoría"
        columnas={[{ titulo: "Categoría" }, { titulo: "Consumo", numerica: true }]}
        filas={[["Removedores", "150"], ["Esmaltes", "26"]]}
      />,
    );
    const tabla = screen.getByRole("table", { name: "Consumo por categoría" });
    expect(within(tabla).getAllByRole("columnheader").map((c) => c.textContent)).toEqual(["Categoría", "Consumo"]);
    expect(within(tabla).getByText("150")).toHaveClass("text-right");
    expect(within(tabla).getByText("Removedores")).not.toHaveClass("text-right");
    expect(within(tabla).getAllByRole("row")).toHaveLength(3);
  });
});

describe("TarjetaGrafico", () => {
  const base = { titulo: "Mi indicador", grafico: <p>el gráfico</p>, tabla: <p>la tabla</p> };

  it("mientras carga avisa y queda ocupada", () => {
    render(<TarjetaGrafico {...base} estado="cargando" />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");
    expect(screen.getByRole("region", { name: "Mi indicador" })).toHaveAttribute("aria-busy", "true");
  });

  it("si falla, explica y deja reintentar", () => {
    const reintentar = vi.fn();
    render(<TarjetaGrafico {...base} estado="error" error="No hay conexión" onReintentar={reintentar} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No hay conexión");
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(reintentar).toHaveBeenCalledTimes(1);
  });

  it("sin datos muestra el texto y no ofrece la tabla", () => {
    render(<TarjetaGrafico {...base} estado="listo" vacio="No hay datos." />);
    expect(screen.getByText("No hay datos.")).toBeInTheDocument();
    expect(screen.queryByText("el gráfico")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("muestra el gráfico y alterna con la tabla", () => {
    render(<TarjetaGrafico {...base} estado="listo" nota="Una nota" />);
    expect(screen.getByText("el gráfico")).toBeInTheDocument();
    expect(screen.getByText("Una nota")).toBeInTheDocument();
    const boton = screen.getByRole("button", { name: "Ver como tabla" });
    expect(boton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(boton);
    expect(screen.getByText("la tabla")).toBeInTheDocument();
    expect(screen.queryByText("el gráfico")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver gráfico" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Ver gráfico" }));
    expect(screen.getByText("el gráfico")).toBeInTheDocument();
  });
});
