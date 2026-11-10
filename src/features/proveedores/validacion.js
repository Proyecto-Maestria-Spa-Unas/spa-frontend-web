
const FORMATO_NIT = /^[0-9]{6,10}-[0-9]$/;
const FORMATO_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Valida los datos del proveedor.
 * Al editar no valida el NIT porque el backend no permite modificarlo.
 */
export function validarProveedor(valores, { editando = false } = {}) {
    const errores = {};

    const nombre = valores.nombre.trim();
    if (!nombre) errores.nombre = "Ingresa el nombre del proveedor.";
    else if (nombre.length < 2) errores.nombre = "El nombre debe tener al menos 2 caracteres.";
    else if (nombre.length > 120) errores.nombre = "El nombre no puede superar 120 caracteres.";

    if (!editando) {
        const nit = valores.nit.trim();
        if (!nit) errores.nit = "Ingresa el NIT.";
        else if (!FORMATO_NIT.test(nit)) {
            errores.nit = "Usa el formato colombiano: 900123456-7.";
        }
    }

    const telefono = valores.telefono.trim();

    if (telefono.length > 20) {
        errores.telefono = "El teléfono no puede superar 20 caracteres.";
    } else if (telefono && !/^\+?\d{7,19}$/.test(telefono)) {
        errores.telefono = "Ingresa un teléfono válido, con al menos 7 dígitos.";
    }

    const correo = valores.correo.trim();
    if (correo && !FORMATO_CORREO.test(correo)) {
        errores.correo = "Ingresa un correo válido.";
    } else if (correo.length > 255) {
        errores.correo = "El correo no puede superar 255 caracteres.";
    }

    const direccion = valores.direccion.trim();
    if (direccion.length > 200) {
        errores.direccion = "La dirección no puede superar 200 caracteres.";
    }

    return errores;
}
