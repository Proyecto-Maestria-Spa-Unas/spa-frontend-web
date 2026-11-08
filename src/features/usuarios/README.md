# Feature · Usuarios (HU-09)

**Responsable:** Estefa44445 · **API:** `src/api/identidad.js` · **Contrato:** `identidad-v1.yaml`

| Entrega | Sprint | Funciones de la API |
|---|---|---|
| Lista, alta y edición de usuarios; activar / desactivar | 2 | `listarUsuarios`, `crearUsuario`, `actualizarUsuario`, `cambiarEstadoUsuario`, `listarRoles` |

No existe borrado de usuarios: solo desactivación.

## Qué hace la pantalla (F8)

Sigue el manual de marca (5.8 Gestión de usuarios, 4.3 Tablas, 4.4 Modales, 4.5 Alertas) y el contrato `identidad-v1.yaml`.

* **Tabla** con Nombre, Usuario (correo), Rol, Estado y Acciones. Encabezados en Montserrat y estado con ícono, no solo con color.
* **Paginación** de 10, 25 o 50 registros por página, con anterior, siguiente y números de página.
* **Alta** en un modal: nombre completo (3 a 120 caracteres), correo, rol (de `GET /roles`) y contraseña temporal (8 a 128 caracteres).
* **Edición** de nombre y rol; el correo no se puede cambiar (el contrato no lo permite).
* **Activar / desactivar** con un botón deslizante (`role="switch"`) por fila, que actúa de inmediato. Un usuario no puede desactivar su propia cuenta (regla de la pantalla, pendiente de confirmar con el equipo).
* **Avisos:** los de éxito se cierran solos a los 4 s; los de error se quedan hasta cerrarlos a mano. Todos tienen botón de cierre.
* **Errores:** los `422` con `errors: [{ campo, mensaje }]` se muestran bajo cada campo; el resto, por `code` (`CODIGO_DUPLICADO`, `SIN_PERMISO`, `SIN_CONEXION`, `NO_IMPLEMENTADO`…), en un `Alert`.
* **Acceso:** la ruta y la opción del menú exigen `usuario.gestionar` (ver `acceso.test.jsx`).

## Archivos

| Archivo | Para qué |
|---|---|
| `UsuariosPage.jsx` | Tabla, paginación y avisos |
| `FormularioUsuario.jsx` | Formulario de alta y edición |
| `InterruptorEstado.jsx` | Botón deslizante para activar o desactivar |
| `paginacion.js` | Opciones de registros por página y números de página |
| `validacion.js` | Reglas del formulario (mismas del contrato) |
| `errores.js` | Mensajes por `code` y errores por campo del 422 |
| `formato.js` | Nombre legible del rol |

## Notas

* Tras crear o editar, la lista se actualiza con la respuesta de la API (sin volver a pedirla); así funciona igual en modo simulado, donde el simulador no guarda los cambios.
* El `code` del `409` al crear no está detallado en el contrato; se asume `CODIGO_DUPLICADO` (correo repetido) y cualquier otro cae en un mensaje genérico.
* El manual (5.8) habla de editar también el usuario (correo), pero el contrato solo permite cambiar nombre y rol; se sigue el contrato.
* La integración con la API real depende de B6 (`spa-backend-api#26`); hasta entonces se prueba en modo simulado.
