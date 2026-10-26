# Feature · Autenticación (HU-01)

**Responsable:** Estefa44445 · **API:** `src/api/identidad.js` (`login`, `sesionActual`)

Ya funciona de punta a punta contra el contrato (o contra el modo simulado):

* `AuthProvider` guarda el JWT y los permisos; `useAuth().tiene("producto.crear")` oculta opciones.
* `RutaProtegida` redirige al login sin sesión y al inventario sin el permiso.
* `LoginPage` muestra el mensaje según el `code` del error.

Pendiente para Estefa44445: identidad visual del login, validación del formulario y cierre de sesión en el menú.
