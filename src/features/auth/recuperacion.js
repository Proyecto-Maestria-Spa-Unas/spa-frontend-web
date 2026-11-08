/** Recuperar contraseña (X3): lectura del enlace del correo, validaciones y mensajes. */
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const LARGO_MINIMO_CONTRASENA = 8;

/**
 * Interpreta lo que viene después del # en la dirección:
 * - enlace válido del correo → { modo: "nueva", token }
 * - enlace vencido o inválido (Supabase manda error=... en el #) → { modo: "solicitud", vencido: true }
 * - entrada normal a la pantalla → { modo: "solicitud", vencido: false }
 */
export function leerEnlace(hash) {
  const partes = new URLSearchParams((hash ?? "").replace(/^#/, ""));
  const token = partes.get("access_token");
  if (token && partes.get("type") === "recovery") return { modo: "nueva", token };
  if (partes.has("error") || partes.has("error_code")) return { modo: "solicitud", vencido: true };
  return { modo: "solicitud", vencido: false };
}

export function validarCorreo(correo) {
  const limpio = correo.trim();
  if (!limpio) return "Ingresa tu correo.";
  if (!FORMATO_CORREO.test(limpio)) return "Ingresa un correo válido, por ejemplo nombre@spa.co.";
  return undefined;
}

/** Un mensaje por campo; objeto vacío si todo está bien. */
export function validarNuevaContrasena({ contrasena, confirmacion }) {
  const errores = {};
  if (!contrasena) errores.contrasena = "Escribe la nueva contraseña.";
  else if (contrasena.length < LARGO_MINIMO_CONTRASENA) {
    errores.contrasena = `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`;
  }
  if (!confirmacion) errores.confirmacion = "Repite la nueva contraseña.";
  else if (contrasena && confirmacion !== contrasena) errores.confirmacion = "Las contraseñas no coinciden.";
  return errores;
}

export const ENLACE_VENCIDO = "El enlace no es válido o ya venció. Pide uno nuevo.";

const SIN_CONEXION = "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.";

/** Mensajes de la solicitud del correo (code de la API del spa). */
export function mensajeSolicitud(error) {
  if (error?.code === "SIN_CONEXION") return SIN_CONEXION;
  return "No fue posible enviar la solicitud. Intenta de nuevo en unos minutos.";
}

/** Mensajes del cambio de contraseña (code de Supabase Auth). `vencido` indica que hay que pedir otro enlace. */
export function mensajeCambio(error) {
  switch (error?.code) {
    case "SIN_CONEXION":
      return { texto: SIN_CONEXION, vencido: false };
    case "same_password":
      return { texto: "La nueva contraseña debe ser distinta de la actual.", vencido: false };
    case "weak_password":
      return { texto: "La contraseña es muy fácil de adivinar. Usa una más larga o con más variedad.", vencido: false };
    case "SIN_CONFIGURAR":
      return { texto: "El cambio de contraseña no está disponible en este momento. Avisa al equipo.", vencido: false };
    default:
      if ([401, 403].includes(error?.status)) return { texto: ENLACE_VENCIDO, vencido: true };
      return { texto: "No fue posible cambiar la contraseña. Intenta de nuevo.", vencido: false };
  }
}
