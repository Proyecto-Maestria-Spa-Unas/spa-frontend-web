/** S1 · Identidad · contrato docs/openapi/identidad-v1.yaml (spa-backend-api). */
import { apiClient, datos } from "./cliente";

export const login = (correo, contrasena) => datos(apiClient.post("/auth/login", { correo, contrasena }));
/** Responde 202 aunque el correo no exista: no revela qué cuentas hay. */
export const recuperarContrasena = (correo) => datos(apiClient.post("/auth/recuperar", { correo }));
export const sesionActual = () => datos(apiClient.get("/auth/me"));

export const listarUsuarios = (params = {}) => datos(apiClient.get("/usuarios", { params }));
export const crearUsuario = (usuario) => datos(apiClient.post("/usuarios", usuario));
export const obtenerUsuario = (id) => datos(apiClient.get(`/usuarios/${id}`));
export const actualizarUsuario = (id, cambios) => datos(apiClient.patch(`/usuarios/${id}`, cambios));
export const cambiarEstadoUsuario = (id, activo) => datos(apiClient.patch(`/usuarios/${id}/estado`, { activo }));
export const listarRoles = () => datos(apiClient.get("/roles"));
