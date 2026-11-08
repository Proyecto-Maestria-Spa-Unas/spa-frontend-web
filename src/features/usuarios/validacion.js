/** Validación del formulario de usuarios (F8). Reglas del contrato identidad-v1.yaml. */
const FORMATO_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Devuelve un mensaje por campo (objeto vacío si todo está bien). Al editar solo se validan nombre y rol. */
export function validarUsuario(valores, { editando = false } = {}) {
  const errores = {};

  const nombre = valores.nombre_completo.trim();
  if (!nombre) errores.nombre_completo = "Ingresa el nombre completo.";
  else if (nombre.length < 3) errores.nombre_completo = "El nombre debe tener al menos 3 caracteres.";
  else if (nombre.length > 120) errores.nombre_completo = "El nombre no puede superar 120 caracteres.";

  if (!valores.rol) errores.rol = "Selecciona un rol.";

  if (!editando) {
    const correo = valores.correo.trim();
    if (!correo) errores.correo = "Ingresa el correo.";
    else if (!FORMATO_CORREO.test(correo)) errores.correo = "Ingresa un correo válido, por ejemplo nombre@spa.co.";
    else if (correo.length > 255) errores.correo = "El correo no puede superar 255 caracteres.";

    const contrasena = valores.contrasena_temporal;
    if (!contrasena) errores.contrasena_temporal = "Ingresa una contraseña temporal.";
    else if (contrasena.length < 8) errores.contrasena_temporal = "La contraseña debe tener al menos 8 caracteres.";
    else if (contrasena.length > 128) errores.contrasena_temporal = "La contraseña no puede superar 128 caracteres.";
  }

  return errores;
}
