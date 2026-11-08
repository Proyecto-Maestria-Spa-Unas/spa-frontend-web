/** Nombre legible de un rol: usa el de la API y, si viene en MAYÚSCULAS, lo pasa a "Administrador". */
export function etiquetaRol(codigo, roles = []) {
  const nombre = roles.find((rol) => rol.codigo === codigo)?.nombre ?? codigo;
  return nombre === nombre.toUpperCase() ? nombre.charAt(0) + nombre.slice(1).toLowerCase() : nombre;
}
