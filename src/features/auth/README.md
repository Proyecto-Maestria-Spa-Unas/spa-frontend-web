# Feature · Autenticación (HU-01)

**Responsable:** Estefa44445 · **API:** `src/api/identidad.js` (`login`, `sesionActual`)

Ya funciona de punta a punta contra el contrato (o contra el modo simulado):

* `AuthProvider` guarda el JWT y los permisos; `useAuth().tiene("producto.crear")` oculta opciones.
* `RutaProtegida` redirige al login sin sesión y al inventario sin el permiso.
* `LoginPage` muestra el mensaje según el `code` del error.

F6 (Estefa44445) completó el login:

* `LoginPage` usa los componentes del design system (`Card`, `Input`, `Alert`, `Button`) y solo tokens.
* Validación en el navegador con `validarLogin` (correo con formato válido, contraseña de al menos 8 caracteres): mensaje por campo, foco en el primer error y sin llamar a la API mientras haya errores.
* Los errores de la API se muestran con `Alert` según el `code` (`CREDENCIALES_INVALIDAS`, `USUARIO_INACTIVO`, `SIN_CONEXION`).
* Cierre de sesión: botón **Salir** del menú (`MainLayout`), que limpia el token y devuelve al login (cubierto por `App.test.jsx`).

* El encabezado muestra el logo (`public/logo.png`, tomado de la rama `feature/inventario-catalogo`) y usa `font-heading`, que se aplica cuando `tokens.css` defina la tipografía de la marca (F3).
