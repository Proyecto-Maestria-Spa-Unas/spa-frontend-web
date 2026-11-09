import {
  AGRUPACIONES,
  filasCobertura,
  filasConsumo,
  filasEstados,
  filasRotacion,
  formatoDias,
  formatoValor,
  mensajeIndicador,
  ordenarCobertura,
  porcentajeBarra,
  rangoUltimos30Dias,
  resumenFilas,
  totalProductos,
} from "./indicadores";

describe("rangoUltimos30Dias", () => {
  it("son los últimos 30 días, incluido hoy", () => {
    expect(rangoUltimos30Dias(new Date("2026-11-08T15:00:00Z"))).toEqual({ desde: "2026-10-10", hasta: "2026-11-08" });
  });

  it("usa el día de Bogotá aunque en UTC ya sea el siguiente", () => {
    expect(rangoUltimos30Dias(new Date("2026-11-09T03:00:00Z"))).toEqual({ desde: "2026-10-10", hasta: "2026-11-08" });
  });

  it("sin fecha usa la de hoy", () => {
    const { desde, hasta } = rangoUltimos30Dias();
    expect(desde).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(hasta >= desde).toBe(true);
  });
});

describe("porcentajeBarra", () => {
  it("calcula el ancho respecto del máximo", () => {
    expect(porcentajeBarra(50, 200)).toBe(25);
    expect(porcentajeBarra(10, 10)).toBe(100);
    expect(porcentajeBarra(1, 3)).toBe(33.3);
  });

  it("nunca pasa de 100 ni baja de 0, y tolera datos raros", () => {
    expect(porcentajeBarra(0, 10)).toBe(0);
    expect(porcentajeBarra(-5, 10)).toBe(0);
    expect(porcentajeBarra(5, 0)).toBe(0);
    expect(porcentajeBarra("x", 5)).toBe(0);
    expect(porcentajeBarra(20, 10)).toBe(100);
  });
});

describe("formatos", () => {
  it("el valor del inventario va en pesos; sin costos dice por qué no hay valor", () => {
    expect(formatoValor("4250000.0000")).toMatch(/4\.250\.000/);
    expect(formatoValor(null)).toBe("Sin costos registrados");
    expect(formatoValor(undefined)).toBe("Sin costos registrados");
    expect(formatoValor("abc")).toBe("abc");
  });

  it("los días de cobertura se leen como texto", () => {
    expect(formatoDias("70.0")).toBe("70 días");
    expect(formatoDias("27.7")).toBe("27,7 días");
    expect(formatoDias("1.0")).toBe("1 día");
    expect(formatoDias("0.0")).toBe("0 días");
    expect(formatoDias(null)).toBe("Sin consumo");
    expect(formatoDias("abc")).toBe("abc");
  });

  it("los errores se explican por su code", () => {
    expect(mensajeIndicador({ code: "SIN_CONEXION" })).toMatch("No hay conexión");
    expect(mensajeIndicador({ code: "SIN_PERMISO" })).toMatch("No tienes permiso");
    expect(mensajeIndicador({ code: "NO_AUTENTICADO" })).toMatch("sesión venció");
    expect(mensajeIndicador({ code: "NO_IMPLEMENTADO" })).toMatch("todavía no está disponible");
    expect(mensajeIndicador({ code: "OTRO" })).toBe("No fue posible cargar este indicador.");
    expect(mensajeIndicador(undefined)).toBe("No fue posible cargar este indicador.");
  });

  it("agrupaciones coinciden con el contrato", () => {
    expect(AGRUPACIONES.map((a) => a.value)).toEqual(["categoria", "producto"]);
  });
});

describe("filas de los gráficos", () => {
  it("productos por estado: orden fijo, con ícono y total", () => {
    const filas = filasEstados({ AGOTADO: 2, DISPONIBLE: 40, BAJO_STOCK: 5 });
    expect(filas.map((f) => f.nombre)).toEqual(["Disponible", "Bajo stock", "Agotado"]);
    expect(filas[0]).toMatchObject({ valor: 40, texto: "40", color: "bg-estado-disponible-texto", etiqueta: "● Disponible" });
    expect(totalProductos({ AGOTADO: 2, DISPONIBLE: 40, BAJO_STOCK: 5 })).toBe(47);
    expect(filasEstados()).toEqual([]);
    expect(totalProductos()).toBe(0);
  });

  it("consumo: de mayor a menor, con cantidades legibles", () => {
    const filas = filasConsumo([
      { clave: "Esmaltes", cantidad: "26.000" },
      { clave: "Removedores", cantidad: "150.500" },
    ]);
    expect(filas.map((f) => f.clave)).toEqual(["Removedores", "Esmaltes"]);
    expect(filas[0]).toMatchObject({ valor: 150.5, texto: "150,5" });
    expect(filasConsumo()).toEqual([]);
  });

  it("rotación: conserva el orden de la API y muestra el código", () => {
    const filas = filasRotacion([{ producto_id: "a", codigo: "REM-001", nombre: "Acetona pura", consumo: "150.000" }]);
    expect(filas).toEqual([
      { clave: "a", etiqueta: "Acetona pura", detalle: "REM-001", nombre: "Acetona pura", valor: 150, texto: "150" },
    ]);
    expect(filasRotacion()).toEqual([]);
  });

  const cobertura = (codigo, dias) => ({ producto_id: codigo, codigo, nombre: `P ${codigo}`, stock_actual: "1.000", consumo_diario_promedio: "1.000", dias_cobertura: dias });

  it("cobertura: de menos a más días y los sin consumo al final", () => {
    const orden = ordenarCobertura([cobertura("c", null), cobertura("a", "70.0"), cobertura("b", "5.0")]);
    expect(orden.map((c) => c.codigo)).toEqual(["b", "a", "c"]);
    expect(ordenarCobertura()).toEqual([]);
  });

  it("el gráfico de cobertura muestra solo 10 productos y deja fuera los sin consumo", () => {
    const muchos = Array.from({ length: 12 }, (_, i) => cobertura(`p${i}`, `${i + 1}.0`));
    const filas = filasCobertura([...muchos, cobertura("sin", null)]);
    expect(filas).toHaveLength(10);
    expect(filas[0].detalle).toBe("p0");
    expect(filas.map((f) => f.detalle)).not.toContain("sin");
    expect(filasCobertura()).toEqual([]);
  });

  it("resumen para lectores de pantalla", () => {
    expect(resumenFilas([{ nombre: "Disponible", texto: "40" }, { nombre: "Agotado", texto: "2" }])).toBe("Disponible 40, Agotado 2");
    expect(resumenFilas([{ nombre: "A", texto: "3" }], " días")).toBe("A 3 días");
  });
});
