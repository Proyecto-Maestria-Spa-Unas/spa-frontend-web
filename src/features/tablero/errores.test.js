import { ErrorApi } from "../../api/cliente";
import { mensajeDeError } from "./errores";

const conCodigo = (code) => new ErrorApi({ status: 500, code, detail: "texto técnico del servidor" });

describe("mensajeDeError (alertas)", () => {
  it.each([
    ["SIN_CONEXION", "No hay conexión con el servidor. Revisa tu conexión e inténtalo de nuevo."],
    ["SIN_PERMISO", "No tienes permiso para consultar las alertas."],
    ["NO_AUTENTICADO", "Tu sesión venció. Vuelve a ingresar."],
    ["NO_IMPLEMENTADO", "Las alertas todavía no están disponibles en este servidor."],
  ])("traduce %s", (code, texto) => {
    expect(mensajeDeError(conCodigo(code))).toBe(texto);
  });

  it("usa el mensaje por defecto con un código desconocido y no muestra el texto técnico", () => {
    expect(mensajeDeError(conCodigo("ERROR_INTERNO"))).toBe("No fue posible cargar las alertas.");
  });

  it("acepta un mensaje por defecto propio y errores sin código", () => {
    expect(mensajeDeError(new Error("x"), "Otro")).toBe("Otro");
    expect(mensajeDeError(undefined)).toBe("No fue posible cargar las alertas.");
  });
});
