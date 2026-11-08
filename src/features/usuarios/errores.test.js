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

describe("mensajeDeError · DATOS_INVALIDOS", () => {
  it("muestra el texto del servidor cuando un 422 no trae lista de campos", () => {
    const error = new ErrorApi({
      status: 422,
      code: "DATOS_INVALIDOS",
      detail: "La contraseña temporal no cumple la política de contraseñas",
    });
    expect(mensajeDeError(error, "Por defecto")).toBe("La contraseña temporal no cumple la política de contraseñas");
  });
});

describe("erroresPorCampo", () => {
  it("usa el último tramo de la ruta que envía el backend (body.correo) y el primer mensaje de cada campo", () => {
    const error = new ErrorApi({
      status: 422,
      code: "DATOS_INVALIDOS",
      errors: [
        { campo: "body.correo", mensaje: "Correo no válido" },
        { campo: "body.correo", mensaje: "Otro mensaje" },
        { campo: "body.rol", mensaje: "Rol no válido" },
        { campo: "contrasena_temporal", mensaje: "Sin prefijo también sirve" },
      ],
    });
    expect(erroresPorCampo(error)).toEqual({
      correo: "Correo no válido",
      rol: "Rol no válido",
      contrasena_temporal: "Sin prefijo también sirve",
    });
  });

  it("ignora los campos que el formulario no tiene y los errores sin campo", () => {
    const error = new ErrorApi({
      status: 422,
      code: "DATOS_INVALIDOS",
      errors: [{ campo: "body.otro", mensaje: "x" }, { mensaje: "sin campo" }],
    });
    expect(erroresPorCampo(error)).toEqual({});
  });

  it("devuelve vacío si no es un error de la API o no trae errores", () => {
    expect(erroresPorCampo(new Error("x"))).toEqual({});
    expect(erroresPorCampo(new ErrorApi({ code: "SIN_PERMISO" }))).toEqual({});
  });
});
