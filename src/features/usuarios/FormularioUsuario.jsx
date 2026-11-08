import { useRef, useState } from "react";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Input } from "../../design-system/componentes/Input";
import { Select } from "../../design-system/componentes/Select";
import { erroresPorCampo, mensajeDeError } from "./errores";
import { etiquetaRol } from "./formato";
import { validarUsuario } from "./validacion";

const ORDEN_CAMPOS = ["nombre_completo", "correo", "rol", "contrasena_temporal"];

/**
 * Formulario de alta y edición de usuarios (HU-09).
 * Sin `usuario` crea; con `usuario` edita solo nombre y rol (el correo no cambia).
 * `onGuardar(datos)` debe lanzar el error de la API si falla.
 */
export function FormularioUsuario({ usuario, roles, onGuardar, onCancelar }) {
  const editando = Boolean(usuario);
  const [valores, setValores] = useState({
    nombre_completo: usuario?.nombre_completo ?? "",
    correo: usuario?.correo ?? "",
    rol: usuario?.rol ?? "",
    contrasena_temporal: "",
  });
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState("");
  const [enviando, setEnviando] = useState(false);
  const campos = useRef({});

  function cambiar(campo) {
    return (evento) => {
      setValores((anteriores) => ({ ...anteriores, [campo]: evento.target.value }));
      setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }));
    };
  }

  function enfocarPrimerError(encontrados) {
    const primero = ORDEN_CAMPOS.find((campo) => encontrados[campo] && campos.current[campo]);
    if (primero) campos.current[primero].focus();
  }

  async function enviar(evento) {
    evento.preventDefault();
    setErrorGeneral("");
    const encontrados = validarUsuario(valores, { editando });
    setErrores(encontrados);
    if (Object.keys(encontrados).length > 0) return enfocarPrimerError(encontrados);

    const datos = editando
      ? { nombre_completo: valores.nombre_completo.trim(), rol: valores.rol }
      : {
          correo: valores.correo.trim(),
          nombre_completo: valores.nombre_completo.trim(),
          rol: valores.rol,
          contrasena_temporal: valores.contrasena_temporal,
        };

    setEnviando(true);
    try {
      await onGuardar(datos);
    } catch (error) {
      const delServidor = erroresPorCampo(error);
      if (Object.keys(delServidor).length > 0) {
        setErrores(delServidor);
        enfocarPrimerError(delServidor);
      } else {
        setErrorGeneral(mensajeDeError(error, "No fue posible guardar el usuario."));
      }
      setEnviando(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={enviar} noValidate aria-busy={enviando}>
      {errorGeneral && <Alert variant="error">{errorGeneral}</Alert>}
      <Input
        ref={(elemento) => (campos.current.nombre_completo = elemento)}
        label="Nombre completo"
        autoComplete="off"
        aria-required="true"
        value={valores.nombre_completo}
        onChange={cambiar("nombre_completo")}
        error={errores.nombre_completo}
      />
      <Input
        ref={(elemento) => (campos.current.correo = elemento)}
        type="email"
        label="Correo"
        autoComplete="off"
        aria-required="true"
        disabled={editando}
        hint={editando ? "El correo no se puede cambiar." : undefined}
        value={valores.correo}
        onChange={cambiar("correo")}
        error={errores.correo}
      />
      <Select
        ref={(elemento) => (campos.current.rol = elemento)}
        label="Rol"
        placeholder="Selecciona un rol"
        aria-required="true"
        options={roles.map((rol) => ({ value: rol.codigo, label: etiquetaRol(rol.codigo, roles) }))}
        value={valores.rol}
        onChange={cambiar("rol")}
        error={errores.rol}
      />
      {!editando && (
        <Input
          ref={(elemento) => (campos.current.contrasena_temporal = elemento)}
          type="password"
          label="Contraseña temporal"
          autoComplete="new-password"
          aria-required="true"
          hint="Mínimo 8 caracteres."
          value={valores.contrasena_temporal}
          onChange={cambiar("contrasena_temporal")}
          error={errores.contrasena_temporal}
        />
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
