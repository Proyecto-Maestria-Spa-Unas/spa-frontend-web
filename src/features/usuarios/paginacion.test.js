import { numerosDePagina, TAMANOS_PAGINA } from "./paginacion";

describe("paginacion", () => {
  it("ofrece 10, 25 y 50 registros por página", () => {
    expect(TAMANOS_PAGINA).toEqual([10, 25, 50]);
  });

  it("muestra todas las páginas cuando son pocas", () => {
    expect(numerosDePagina(1, 1)).toEqual([1]);
    expect(numerosDePagina(2, 3)).toEqual([1, 2, 3]);
  });

  it("centra la ventana en la página actual", () => {
    expect(numerosDePagina(5, 10)).toEqual([3, 4, 5, 6, 7]);
  });

  it("no se sale de los extremos", () => {
    expect(numerosDePagina(1, 10)).toEqual([1, 2, 3, 4, 5]);
    expect(numerosDePagina(10, 10)).toEqual([6, 7, 8, 9, 10]);
  });
});
