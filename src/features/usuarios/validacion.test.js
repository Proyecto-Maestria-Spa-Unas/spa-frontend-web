import { validarUsuario } from "./validacion";

const VALIDO = { nombre_completo: "Camila Rojas", correo: "camila@spa.co", rol: "MANICURISTA", contrasena_temporal: "Temporal-2026" };

describe("validarUsuario", () => {
  it("acepta datos correctos al crear", () => {
    expect(validarUsuario(VALIDO)).toEqual({});
  });

  it("pide todos los campos cuando están vacíos", () => {
    expect(validarUsuario({ nombre_completo: " ", correo: "", rol: "", contrasena_temporal: "" })).toEqual({
      nombre_completo: "Ingresa el nombre completo.",
      correo: "Ingresa el correo.",
      rol: "Selecciona un rol.",
      contrasena_temporal: "Ingresa una contraseña temporal.",
    });
  });

  it("valida el largo del nombre (3 a 120 caracteres)", () => {
    expect(validarUsuario({ ...VALIDO, nombre_completo: "Ana" })).toEqual({});
    expect(validarUsuario({ ...VALIDO, nombre_completo: "Al" }).nombre_completo).toMatch("al menos 3");
    expect(validarUsuario({ ...VALIDO, nombre_completo: "a".repeat(121) }).nombre_completo).toMatch("120");
  });

  it("valida el formato y el largo del correo", () => {
    expect(validarUsuario({ ...VALIDO, correo: "camila@" }).correo).toMatch("correo válido");
    expect(validarUsuario({ ...VALIDO, correo: `${"a".repeat(250)}@spa.co` }).correo).toMatch("255");
  });

  it("valida el largo de la contraseña temporal (8 a 128 caracteres)", () => {
    expect(validarUsuario({ ...VALIDO, contrasena_temporal: "corta" }).contrasena_temporal).toMatch("al menos 8");
    expect(validarUsuario({ ...VALIDO, contrasena_temporal: "a".repeat(129) }).contrasena_temporal).toMatch("128");
  });

  it("al editar solo valida nombre y rol", () => {
    expect(validarUsuario({ nombre_completo: "Camila", correo: "", rol: "GERENTE", contrasena_temporal: "" }, { editando: true })).toEqual({});
    expect(validarUsuario({ nombre_completo: "", correo: "", rol: "", contrasena_temporal: "" }, { editando: true })).toEqual({
      nombre_completo: "Ingresa el nombre completo.",
      rol: "Selecciona un rol.",
    });
  });
});
