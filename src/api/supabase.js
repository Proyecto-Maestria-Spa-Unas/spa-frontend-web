/**
 * Supabase Auth desde el navegador (X3): solo el paso de "nueva contraseña".
 *
 * El correo de recuperación lleva a /recuperar#access_token=...&type=recovery. Con ese token temporal
 * Supabase deja cambiar la contraseña: PUT {VITE_SUPABASE_URL}/auth/v1/user. La API del spa no participa
 * en este paso (el contrato solo tiene POST /auth/recuperar).
 *
 * VITE_SUPABASE_PUBLISHABLE_KEY es la clave pública (sb_publishable_...): nunca ponga aquí la clave secreta.
 */
import axios from "axios";
import { ErrorApi, MODO_SIMULADO } from "./cliente";

/** Cambia la contraseña de quien abrió el enlace del correo. Falla con ErrorApi (`code` de Supabase). */
export async function cambiarContrasena(tokenRecuperacion, contrasena, { simulado = MODO_SIMULADO } = {}) {
  if (simulado) {
    if (!tokenRecuperacion) throw new ErrorApi({ status: 401, code: "bad_jwt" });
    return {};
  }

  const url = import.meta.env.VITE_SUPABASE_URL;
  const clave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !clave) throw new ErrorApi({ status: 0, code: "SIN_CONFIGURAR", detail: "Falta configurar Supabase" });

  try {
    const respuesta = await axios.put(
      `${url.replace(/\/$/, "")}/auth/v1/user`,
      { password: contrasena },
      { timeout: 15000, headers: { apikey: clave, Authorization: `Bearer ${tokenRecuperacion}` } },
    );
    return respuesta.data;
  } catch (error) {
    const respuesta = error?.response;
    if (!respuesta) throw new ErrorApi({ status: 0, code: "SIN_CONEXION", detail: "No hay conexión con el servidor" });
    const cuerpo = respuesta.data ?? {};
    throw new ErrorApi({
      status: respuesta.status,
      code: cuerpo.error_code ?? cuerpo.code ?? "ERROR_HTTP",
      detail: cuerpo.msg ?? cuerpo.message,
    });
  }
}
