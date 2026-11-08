import { ErrorApi } from "../../api/cliente";
import { erroresPorCampo, mensajeDeError } from "./errores";

describe("mensajeDeError", () => {
  it.each([
    ["CODIGO_DUPLICADO", "Ya existe un usuario con ese correo."],
    ["SIN_PERMISO", "No tienes permiso"],
    ["NO_AUTENTICADO", "Tu sesión venció"],
    ["SIN_CONEXION", "No hay conexión"],
    ["NO_IMPLEMENTADO", "aún no está disponible"],
    ["RECURSO_NO_EXISTE", "ya no existe"],
  ])("traduce el code %s", (code, texto) => {
    expect(mensajeDeError(new ErrorApi({ code }), "x")).toContain(texto);
  });

  it("usa el mensaje por defecto para un code desconocido o sin error", () => {
    expect(mensajeDeError(new ErrorApi({ code: "OTRO" }), "Por defecto")).toBe("Por defecto");
    expect(mensajeDeError(undefined, "Por defecto")).toBe("Por defecto");
  });
});

describe("erroresPorCampo", () => {
  it("convierte los errores del 422 en un mensaje por campo (el primero de cada campo)", () => {
    const error = new ErrorApi({
      status: 422,
      code: "DATOS_INVALIDOS",
      errors: [
        { campo: "correo", mensaje: "Correo no válido" },
        { campo: "correo", mensaje: "Otro mensaje" },
        { campo: "rol", mensaje: "Rol no válido" },
        { mensaje: "sin campo" },
      ],
    });
    expect(erroresPorCampo(error)).toEqual({ correo: "Correo no válido", rol: "Rol no válido" });
  });

  it("devuelve vacío si no es un error de la API o no trae errores", () => {
    expect(erroresPorCampo(new Error("x"))).toEqual({});
    expect(erroresPorCampo(new ErrorApi({ code: "SIN_PERMISO" }))).toEqual({});
  });
});
