import { useCallback, useEffect, useMemo, useState } from "react";
import { TOKEN_KEY } from "../../api/cliente";
import * as identidad from "../../api/identidad";
import { AuthContext } from "./AuthContext";

/**
 * Sesión del usuario (HU-01). Guarda el JWT en sessionStorage y los permisos que devuelve la API.
 * El frontend usa `tiene(permiso)` solo para OCULTAR opciones; la barrera real es el backend (RNF-07).
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [usuario, setUsuario] = useState(null);

  const cerrarSesion = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUsuario(null);
  }, []);

  useEffect(() => {
    if (!token || usuario) return;
    identidad.sesionActual().then(setUsuario).catch(cerrarSesion);
  }, [token, usuario, cerrarSesion]);

  const valor = useMemo(
    () => ({
      token,
      usuario,
      autenticado: Boolean(token),
      async iniciarSesion(correo, contrasena) {
        const r = await identidad.login(correo, contrasena);
        sessionStorage.setItem(TOKEN_KEY, r.access_token);
        setToken(r.access_token);
        setUsuario(r.usuario);
        return r.usuario;
      },
      cerrarSesion,
      tiene: (permiso) => Boolean(usuario?.permisos?.includes(permiso)),
    }),
    [token, usuario, cerrarSesion],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}
