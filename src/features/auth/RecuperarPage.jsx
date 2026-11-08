import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cambiarContrasena } from "../../api/supabase";
import { recuperarContrasena } from "../../api/identidad";
import { ROUTES } from "../../constants/routes";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Card } from "../../design-system/componentes/Card";
import { Input } from "../../design-system/componentes/Input";
import {
  ENLACE_VENCIDO,
  leerEnlace,
  mensajeCambio,
  mensajeSolicitud,
  validarCorreo,
  validarNuevaContrasena,
} from "./recuperacion";

const ENLACE_A_LOGIN =
  "mt-4 block text-center text-sm text-marca-primario underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-primario";

/**
 * X3 · Recuperar contraseña (HU-01). Una sola pantalla con dos pasos:
 * 1. Solicitud: el correo va a POST /auth/recuperar (responde 202 exista o no la cuenta).
 * 2. Nueva contraseña: se llega desde el enlace del correo (/recuperar#access_token=...&type=recovery).
 */
export function RecuperarPage() {
  const { hash, pathname, search } = useLocation();
  const navegar = useNavigate();
  // Se lee una sola vez; después el token se borra de la dirección para que no quede en el historial.
  const [enlace, setEnlace] = useState(() => leerEnlace(hash));
  useEffect(() => {
    if (hash) navegar({ pathname, search }, { replace: true });
  }, [hash, pathname, search, navegar]);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          {/* Decorativo: el nombre de la marca ya está en el encabezado. */}
          <img src="/logo.png" alt="" className="mx-auto h-16 w-16" />
        </div>
        {enlace.modo === "nueva" ? (
          <NuevaContrasena token={enlace.token} pedirOtroEnlace={() => setEnlace({ modo: "solicitud", vencido: true })} />
        ) : (
          <SolicitarEnlace vencido={enlace.vencido} />
        )}
      </div>
    </main>
  );
}

function SolicitarEnlace({ vencido }) {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState();
  const [aviso, setAviso] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const campo = useRef(null);

  async function enviar(evento) {
    evento.preventDefault();
    const encontrado = validarCorreo(correo);
    setError(encontrado);
    setAviso(null);
    if (encontrado) return campo.current.focus();

    setEnviando(true);
    try {
      const respuesta = await recuperarContrasena(correo.trim());
      setMensaje(respuesta.mensaje);
    } catch (e) {
      setAviso(mensajeSolicitud(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card title="Recuperar contraseña">
      {mensaje ? (
        <Alert variant="success">{mensaje}</Alert>
      ) : (
        <form className="space-y-4" onSubmit={enviar} noValidate aria-busy={enviando}>
          <p className="text-sm">Escribe tu correo y te enviaremos un enlace para elegir una contraseña nueva.</p>
          {vencido && <Alert variant="warning">{ENLACE_VENCIDO}</Alert>}
          {aviso && <Alert variant="error">{aviso}</Alert>}
          <Input
            ref={campo}
            name="correo"
            type="email"
            label="Correo"
            autoComplete="email"
            aria-required="true"
            value={correo}
            onChange={(e) => {
              setCorreo(e.target.value);
              setError(undefined);
            }}
            error={error}
          />
          <Button type="submit" className="w-full" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar enlace"}
          </Button>
        </form>
      )}
      <Link to={ROUTES.LOGIN} className={ENLACE_A_LOGIN}>
        Volver a ingresar
      </Link>
    </Card>
  );
}

function NuevaContrasena({ token, pedirOtroEnlace }) {
  const [valores, setValores] = useState({ contrasena: "", confirmacion: "" });
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const campoContrasena = useRef(null);
  const campoConfirmacion = useRef(null);

  function cambiar(campo) {
    return (evento) => {
      setValores((anteriores) => ({ ...anteriores, [campo]: evento.target.value }));
      setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
    };
  }

  async function enviar(evento) {
    evento.preventDefault();
    const encontrados = validarNuevaContrasena(valores);
    setErrores(encontrados);
    setAviso(null);
    if (encontrados.contrasena) return campoContrasena.current.focus();
    if (encontrados.confirmacion) return campoConfirmacion.current.focus();

    setEnviando(true);
    try {
      await cambiarContrasena(token, valores.contrasena);
      setListo(true);
    } catch (e) {
      setAviso(mensajeCambio(e));
    } finally {
      setEnviando(false);
    }
  }

  if (listo) {
    return (
      <Card title="Contraseña actualizada">
        <Alert variant="success">Listo. Ya puedes ingresar con tu nueva contraseña.</Alert>
        <Link to={ROUTES.LOGIN} className={ENLACE_A_LOGIN}>
          Ir a ingresar
        </Link>
      </Card>
    );
  }

  return (
    <Card title="Nueva contraseña">
      <form className="space-y-4" onSubmit={enviar} noValidate aria-busy={enviando}>
        {aviso && (
          <Alert variant="error">
            {aviso.texto}
            {aviso.vencido && (
              <>
                {" "}
                <button type="button" onClick={pedirOtroEnlace} className="font-semibold underline">
                  Pedir otro enlace
                </button>
              </>
            )}
          </Alert>
        )}
        <Input
          ref={campoContrasena}
          name="contrasena"
          type="password"
          label="Nueva contraseña"
          autoComplete="new-password"
          aria-required="true"
          hint="Mínimo 8 caracteres."
          value={valores.contrasena}
          onChange={cambiar("contrasena")}
          error={errores.contrasena}
        />
        <Input
          ref={campoConfirmacion}
          name="confirmacion"
          type="password"
          label="Repite la contraseña"
          autoComplete="new-password"
          aria-required="true"
          value={valores.confirmacion}
          onChange={cambiar("confirmacion")}
          error={errores.confirmacion}
        />
        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar contraseña"}
        </Button>
      </form>
    </Card>
  );
}
