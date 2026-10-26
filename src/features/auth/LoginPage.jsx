import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { Button } from "../../design-system/componentes/Button";
import { useAuth } from "./AuthContext";

const MENSAJES = {
  CREDENCIALES_INVALIDAS: "Correo o contraseña incorrectos.",
  USUARIO_INACTIVO: "Tu cuenta está desactivada. Consulta con la administración.",
  SIN_CONEXION: "No hay conexión con el servidor.",
};

/** HU-01 · Iniciar sesión. Estefa44445: aplicar la identidad visual y la validación del formulario. */
export function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    const formulario = new FormData(evento.currentTarget);
    setEnviando(true);
    setError(null);
    try {
      await iniciarSesion(formulario.get("correo"), formulario.get("contrasena"));
      navegar(ROUTES.INVENTARIO, { replace: true });
    } catch (e) {
      setError(MENSAJES[e.code] ?? "No fue posible iniciar sesión.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="mx-auto mt-24 max-w-sm rounded-xl bg-marca-superficie p-8 shadow">
      <h2 className="mb-6 text-xl font-semibold">Ingresar</h2>
      <form className="space-y-4" onSubmit={enviar}>
        <input name="correo" type="email" aria-label="Correo" required className="w-full rounded border border-marca-borde p-2" placeholder="Correo" />
        <input name="contrasena" type="password" aria-label="Contraseña" required minLength={8} className="w-full rounded border border-marca-borde p-2" placeholder="Contraseña" />
        {error && <p role="alert" className="text-sm text-estado-agotado-texto">{error}</p>}
        <Button type="submit" className="w-full" disabled={enviando}>Ingresar</Button>
      </form>
    </section>
  );
}
