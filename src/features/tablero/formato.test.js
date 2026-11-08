import { formatoCantidad, textoContador } from "./formato";

describe("formatoCantidad", () => {
  it("quita los ceros de relleno de las cantidades enteras", () => {
    expect(formatoCantidad("350.000")).toBe("350");
    expect(formatoCantidad("0.000")).toBe("0");
  });

  it("conserva los decimales con coma", () => {
    expect(formatoCantidad("2.500")).toBe("2,5");
    expect(formatoCantidad("0.125")).toBe("0,125");
  });

  it("separa los miles con punto", () => {
    expect(formatoCantidad("12500.000")).toBe("12.500");
  });

  it("devuelve el texto original si no es un número", () => {
    expect(formatoCantidad("abc")).toBe("abc");
    expect(formatoCantidad(undefined)).toBe("");
  });
});

describe("textoContador", () => {
  it("muestra el número tal cual hasta 99", () => {
    expect(textoContador(1)).toBe("1");
    expect(textoContador(99)).toBe("99");
  });

  it("muestra 99+ desde 100", () => {
    expect(textoContador(100)).toBe("99+");
  });
});
