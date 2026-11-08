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

X3 (Estefa44445) completó la recuperación de contraseña, en `RecuperarPage` (`/recuperar`), con dos pasos en la misma pantalla:

* **Solicitud**: el correo va a `POST /auth/recuperar` (`recuperarContrasena`). La API responde 202 exista o no la cuenta, y la pantalla muestra siempre el mensaje que devuelve la API.
* **Nueva contraseña**: el correo de Supabase lleva a `/recuperar#access_token=...&type=recovery`. La pantalla lee ese token (`leerEnlace`), lo borra de la dirección y pide la contraseña dos veces (mínimo 8 caracteres, deben coincidir). El cambio se hace directo en Supabase Auth con `cambiarContrasena` (`src/api/supabase.js`, `PUT /auth/v1/user`), porque el contrato no tiene un endpoint para ese paso.
* Si el enlace venció o es inválido, la pantalla avisa y deja pedir otro.
* Configuración (en Vercel y en `.env`): `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` (la clave **pública** `sb_publishable_...`). Con `VITE_API_MOCK=true` no hacen falta: para ver el segundo paso abra `/recuperar#access_token=prueba&type=recovery`.
