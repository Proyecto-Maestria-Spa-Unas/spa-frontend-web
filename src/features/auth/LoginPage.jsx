import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Card } from "../../design-system/componentes/Card";
import { Input } from "../../design-system/componentes/Input";
import { useAuth } from "./AuthContext";
import { validarLogin } from "./validacion";

// Mensaje y tipo de aviso según el `code` estable que devuelve la API.
const MENSAJES = {
  CREDENCIALES_INVALIDAS: { variante: "error", texto: "Correo o contraseña incorrectos." },
  USUARIO_INACTIVO: { variante: "warning", texto: "Tu cuenta está desactivada. Consulta con la administración." },
  SIN_CONEXION: { variante: "error", texto: "No hay conexión con el servidor. Revisa tu internet e intenta de nuevo." },
};
const MENSAJE_GENERICO = { variante: "error", texto: "No fue posible iniciar sesión." };

/** HU-01 · Iniciar sesión (F6): identidad visual, validación del formulario y mensajes por code de la API. */
export function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();
  const [valores, setValores] = useState({ correo: "", contrasena: "" });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const campoCorreo = useRef(null);
  const campoContrasena = useRef(null);

  function cambiar(campo) {
    return (evento) => {
      setValores((anteriores) => ({ ...anteriores, [campo]: evento.target.value }));
      setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
    };
  }

  async function enviar(evento) {
    evento.preventDefault();
    const encontrados = validarLogin(valores);
    setErrores(encontrados);
    setAviso(null);
    if (encontrados.correo) return campoCorreo.current.focus();
    if (encontrados.contrasena) return campoContrasena.current.focus();

    setEnviando(true);
    try {
      await iniciarSesion(valores.correo.trim(), valores.contrasena);
      navegar(ROUTES.INVENTARIO, { replace: true });
    } catch (e) {
      setAviso(MENSAJES[e.code] ?? MENSAJE_GENERICO);
      setEnviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* Decorativo: el nombre de la marca ya está en el encabezado. */}
          <img src="/logo.png" alt="" className="mx-auto mb-3 h-16 w-16" />
          <h1 className="font-heading text-2xl font-semibold text-marca-primario">Spa de Uñas</h1>
          <p className="text-sm text-marca-texto">Control de inventario</p>
        </div>
        <Card title="Ingresar">
          <form className="space-y-4" onSubmit={enviar} noValidate aria-busy={enviando}>
            {aviso && <Alert variant={aviso.variante}>{aviso.texto}</Alert>}
            <Input
              ref={campoCorreo}
              name="correo"
              type="email"
              label="Correo"
              autoComplete="email"
              aria-required="true"
              value={valores.correo}
              onChange={cambiar("correo")}
              error={errores.correo}
            />
            <Input
              ref={campoContrasena}
              name="contrasena"
              type="password"
              label="Contraseña"
              autoComplete="current-password"
              aria-required="true"
              value={valores.contrasena}
              onChange={cambiar("contrasena")}
              error={errores.contrasena}
            />
            <Button type="submit" className="w-full" disabled={enviando}>
              {enviando ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
          <Link
            to={ROUTES.RECUPERAR}
            className="mt-4 block text-center text-sm text-marca-primario underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-primario"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </Card>
      </div>
    </main>
  );
}
