import { Navigate, Outlet } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import { useAuth } from "./AuthContext";

/** Protege rutas por sesión y, opcionalmente, por permiso (RF-01, RNF-07). */
export function RutaProtegida({ permiso }) {
  const { autenticado, usuario, tiene } = useAuth();
  if (!autenticado) return <Navigate to={ROUTES.LOGIN} replace />;
  if (permiso && usuario && !tiene(permiso)) return <Navigate to={ROUTES.INVENTARIO} replace />;
  return <Outlet />;
}
