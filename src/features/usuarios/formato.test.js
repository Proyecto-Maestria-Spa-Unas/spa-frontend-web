import { etiquetaRol } from "./formato";

const ROLES = [
  { codigo: "ADMINISTRADOR", nombre: "Administrador" },
  { codigo: "GERENTE", nombre: "GERENTE" },
];

describe("etiquetaRol", () => {
  it("usa el nombre que entrega la API", () => {
    expect(etiquetaRol("ADMINISTRADOR", ROLES)).toBe("Administrador");
  });

  it("pasa a minúsculas un nombre que viene en MAYÚSCULAS (simulador)", () => {
    expect(etiquetaRol("GERENTE", ROLES)).toBe("Gerente");
  });

  it("si el rol no está en la lista, usa el código", () => {
    expect(etiquetaRol("MANICURISTA", ROLES)).toBe("Manicurista");
    expect(etiquetaRol("MANICURISTA")).toBe("Manicurista");
  });
});
