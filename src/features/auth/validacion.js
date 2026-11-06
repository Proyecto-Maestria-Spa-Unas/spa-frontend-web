/** Validación del formulario de login (F6): un mensaje por campo; vacío si todo está bien. */
const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LARGO_MINIMO_CONTRASENA = 8;

export function validarLogin({ correo, contrasena }) {
  const errores = {};
  const correoLimpio = correo.trim();
  if (!correoLimpio) errores.correo = "Ingresa tu correo.";
  else if (!FORMATO_CORREO.test(correoLimpio)) errores.correo = "Ingresa un correo válido, por ejemplo nombre@spa.co.";
  if (!contrasena) errores.contrasena = "Ingresa tu contraseña.";
  else if (contrasena.length < LARGO_MINIMO_CONTRASENA) {
    errores.contrasena = `La contraseña debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres.`;
  }
  return errores;
}
