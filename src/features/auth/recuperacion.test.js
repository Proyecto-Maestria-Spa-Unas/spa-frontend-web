import {
  ENLACE_VENCIDO,
  leerEnlace,
  mensajeCambio,
  mensajeSolicitud,
  validarCorreo,
  validarNuevaContrasena,
} from "./recuperacion";

describe("leerEnlace", () => {
  it("reconoce el enlace válido del correo y saca el token", () => {
    expect(leerEnlace("#access_token=abc.def&expires_in=3600&refresh_token=r&token_type=bearer&type=recovery")).toEqual({
      modo: "nueva",
      token: "abc.def",
    });
  });

  it("no acepta un token que no sea de recuperación", () => {
    expect(leerEnlace("#access_token=abc&type=signup")).toEqual({ modo: "solicitud", vencido: false });
    expect(leerEnlace("#type=recovery")).toEqual({ modo: "solicitud", vencido: false });
  });

  it("detecta el enlace vencido que Supabase marca con error", () => {
    expect(leerEnlace("#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid")).toEqual({
      modo: "solicitud",
      vencido: true,
    });
  });

  it("sin hash es la entrada normal a la pantalla", () => {
    expect(leerEnlace("")).toEqual({ modo: "solicitud", vencido: false });
    expect(leerEnlace(undefined)).toEqual({ modo: "solicitud", vencido: false });
  });
});

describe("validarCorreo", () => {
  it("valida vacío, formato y correo correcto", () => {
    expect(validarCorreo("  ")).toBe("Ingresa tu correo.");
    expect(validarCorreo("ana@")).toMatch("correo válido");
    expect(validarCorreo(" ana@spa.co ")).toBeUndefined();
  });
});

describe("validarNuevaContrasena", () => {
  it("acepta dos contraseñas iguales de 8 o más caracteres", () => {
    expect(validarNuevaContrasena({ contrasena: "Clave-2026", confirmacion: "Clave-2026" })).toEqual({});
  });

  it("pide los dos campos cuando están vacíos", () => {
    expect(validarNuevaContrasena({ contrasena: "", confirmacion: "" })).toEqual({
      contrasena: "Escribe la nueva contraseña.",
      confirmacion: "Repite la nueva contraseña.",
    });
  });

  it("rechaza una contraseña corta y no repite el error de coincidencia", () => {
    expect(validarNuevaContrasena({ contrasena: "corta", confirmacion: "corta" })).toEqual({
      contrasena: "La contraseña debe tener al menos 8 caracteres.",
    });
  });

  it("rechaza si no coinciden", () => {
    expect(validarNuevaContrasena({ contrasena: "Clave-2026", confirmacion: "Clave-2027" })).toEqual({
      confirmacion: "Las contraseñas no coinciden.",
    });
  });
});

describe("mensajes", () => {
  it("explican la solicitud según el code", () => {
    expect(mensajeSolicitud({ code: "SIN_CONEXION" })).toMatch("No hay conexión");
    expect(mensajeSolicitud({ code: "DATOS_INVALIDOS" })).toMatch("No fue posible enviar");
    expect(mensajeSolicitud(undefined)).toMatch("No fue posible enviar");
  });

  it("explican el cambio según el code de Supabase", () => {
    expect(mensajeCambio({ code: "SIN_CONEXION" })).toEqual({ texto: expect.stringMatching("No hay conexión"), vencido: false });
    expect(mensajeCambio({ code: "same_password" }).texto).toMatch("distinta de la actual");
    expect(mensajeCambio({ code: "weak_password" }).texto).toMatch("fácil de adivinar");
    expect(mensajeCambio({ code: "SIN_CONFIGURAR" }).texto).toMatch("no está disponible");
    expect(mensajeCambio({ code: "ERROR_HTTP", status: 500 })).toEqual({
      texto: "No fue posible cambiar la contraseña. Intenta de nuevo.",
      vencido: false,
    });
  });

  it("un token vencido o inválido (401 o 403) pide otro enlace", () => {
    expect(mensajeCambio({ code: "bad_jwt", status: 401 })).toEqual({ texto: ENLACE_VENCIDO, vencido: true });
    expect(mensajeCambio({ code: "session_not_found", status: 403 })).toEqual({ texto: ENLACE_VENCIDO, vencido: true });
  });
});
