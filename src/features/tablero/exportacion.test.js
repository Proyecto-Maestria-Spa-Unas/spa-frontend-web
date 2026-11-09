import { CONJUNTOS, FORMATOS, guardarArchivo, mensajeExportar, nombreArchivo } from "./exportacion";

describe("opciones", () => {
  it("coinciden con los valores que acepta el contrato", () => {
    expect(CONJUNTOS.map((c) => c.value)).toEqual(["inventario", "movimientos"]);
    expect(FORMATOS.map((f) => f.value)).toEqual(["csv", "parquet"]);
  });
});

describe("nombreArchivo", () => {
  it("lleva conjunto, día y formato", () => {
    expect(nombreArchivo("inventario", "csv", new Date("2026-11-08T15:00:00Z"))).toBe("inventario-20261108.csv");
    expect(nombreArchivo("movimientos", "parquet", new Date("2026-01-05T15:00:00Z"))).toBe("movimientos-20260105.parquet");
  });

  it("usa el día de Bogotá aunque en UTC ya sea el siguiente", () => {
    // 03:00 UTC del 9 es las 22:00 del 8 en Bogotá (UTC-5).
    expect(nombreArchivo("inventario", "csv", new Date("2026-11-09T03:00:00Z"))).toBe("inventario-20261108.csv");
    // 05:00 UTC del 9 ya es el 9 en Bogotá (00:00).
    expect(nombreArchivo("inventario", "csv", new Date("2026-11-09T05:00:00Z"))).toBe("inventario-20261109.csv");
  });

  it("sin fecha usa la de hoy", () => {
    expect(nombreArchivo("inventario", "csv")).toMatch(/^inventario-\d{8}\.csv$/);
  });
});

describe("guardarArchivo", () => {
  afterEach(() => vi.restoreAllMocks());

  it("descarga el blob con el nombre dado y libera la URL", () => {
    const blob = new Blob(["a,b\n1,2\n"], { type: "text/csv" });
    URL.createObjectURL = vi.fn(() => "blob:prueba");
    URL.revokeObjectURL = vi.fn();
    const descargas = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      descargas.push({ archivo: this.download, destino: this.href });
    });

    guardarArchivo(blob, "inventario-20261108.csv");

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob);
    expect(descargas).toEqual([{ archivo: "inventario-20261108.csv", destino: "blob:prueba" }]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:prueba");
    expect(document.querySelector("a[download]")).toBeNull();
  });
});

describe("mensajeExportar", () => {
  it("explica cada caso según el code o el estado HTTP", () => {
    expect(mensajeExportar({ code: "SIN_CONEXION" })).toMatch("No hay conexión");
    expect(mensajeExportar({ code: "NO_AUTENTICADO" })).toMatch("sesión venció");
    expect(mensajeExportar({ status: 401 })).toMatch("sesión venció");
    expect(mensajeExportar({ code: "SIN_PERMISO" })).toMatch("No tienes permiso");
    expect(mensajeExportar({ status: 403, code: "ERROR_HTTP" })).toMatch("No tienes permiso");
    expect(mensajeExportar({ code: "NO_IMPLEMENTADO" })).toMatch("todavía no está disponible");
    expect(mensajeExportar({ status: 501 })).toMatch("todavía no está disponible");
  });

  it("ante cualquier otro error, un mensaje genérico", () => {
    expect(mensajeExportar({ status: 500, code: "ERROR_HTTP" })).toBe("No fue posible generar el archivo. Inténtalo de nuevo.");
    expect(mensajeExportar(undefined)).toBe("No fue posible generar el archivo. Inténtalo de nuevo.");
  });
});
