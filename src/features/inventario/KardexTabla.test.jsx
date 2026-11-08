import { render, screen, within } from "@testing-library/react";
import { KardexTabla } from "./KardexTabla";
import { formatoPesos, nombreMotivo } from "./formato";

/** Ejemplo de la política de costo de A3 (spa-docs, docs/05-contabilidad, sección 4). */
const linea = (tipo, motivo, cantidad, unitario, total, saldo, promedio, valor) => ({
  ocurrido_en: "2026-11-07T15:00:00Z",
  tipo,
  motivo_codigo: motivo,
  cantidad,
  costo_unitario: unitario,
  costo_total: total,
  saldo,
  costo_promedio: promedio,
  valor_saldo: valor,
});

const KARDEX_A3 = {
  producto_id: "p1",
  codigo: "REM-001",
  nombre: "Acetona pura",
  metodo: "PROMEDIO_PONDERADO",
  lineas: [
    linea("ENTRADA", "SALDO_INICIAL", "350.000", "38.0000", "13300.0000", "350.000", "38.0000", "13300.0000"),
    linea("ENTRADA", "COMPRA", "150.000", "42.0000", "6300.0000", "500.000", "39.2000", "19600.0000"),
    linea("SALIDA", "CONSUMO_SERVICIO", "15.000", "39.2000", "588.0000", "485.000", "39.2000", "19012.0000"),
    linea("ENTRADA", "COMPRA", "100.000", "45.0000", "4500.0000", "585.000", "40.1915", "23512.0275"),
    linea("SALIDA", "MERMA", "85.000", "40.1915", "3416.2775", "500.000", "40.1915", "20095.7500"),
  ],
  saldo_final: "500.000",
  valor_final: "20095.7500",
};

describe("KardexTabla", () => {
  it("muestra el kardex de A3 con promedio, saldo y valor por línea", () => {
    render(<KardexTabla kardex={KARDEX_A3} />);
    const filas = screen.getAllByRole("row");
    expect(filas).toHaveLength(1 + 5 + 1); // encabezado, 5 movimientos y totales
    const compra = within(filas[2]);
    expect(compra.getByText("Compra")).toBeInTheDocument();
    expect(compra.getByText(formatoPesos("39.2000"))).toBeInTheDocument();
    expect(compra.getByText(formatoPesos("19600.0000"))).toBeInTheDocument();
    const consumo = within(filas[3]);
    expect(consumo.getByText("Consumo en servicio")).toBeInTheDocument();
    expect(consumo.getByText("−15")).toBeInTheDocument();
    expect(consumo.getByText(formatoPesos("588.0000"))).toBeInTheDocument();
    expect(within(filas[6]).getByText(formatoPesos("20095.7500"))).toBeInTheDocument();
    expect(screen.getByText("Valor final")).toBeInTheDocument();
  });

  it("avisa cuando no hay movimientos en el rango", () => {
    render(<KardexTabla kardex={{ ...KARDEX_A3, lineas: [] }} />);
    expect(screen.getByText("No hay movimientos en el rango seleccionado.")).toBeInTheDocument();
  });

  it("formatea pesos, vacíos y motivos desconocidos", () => {
    expect(formatoPesos(null)).toBe("—");
    expect(nombreMotivo("OTRO")).toBe("OTRO");
    expect(nombreMotivo("ANULACION")).toBe("Anulación");
  });
});
