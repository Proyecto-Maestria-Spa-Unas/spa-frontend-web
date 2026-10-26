import { NavLink, Outlet } from "react-router-dom";
import { MENU } from "../constants/routes";
import { useAuth } from "../features/auth/AuthContext";
import { Button } from "../design-system/componentes/Button";

/** Marco de la aplicación: menú filtrado por permisos de la sesión. */
export function MainLayout() {
  const { usuario, tiene, cerrarSesion } = useAuth();
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-marca-borde bg-marca-superficie px-6 py-4">
        <h1 className="text-lg font-semibold text-marca-primario">Spa de Uñas · Inventario</h1>
        <nav aria-label="Principal" className="flex gap-4 text-sm">
          {MENU.filter((m) => tiene(m.permiso)).map((m) => (
            <NavLink key={m.ruta} to={m.ruta} className={({ isActive }) => (isActive ? "font-semibold" : "")}>
              {m.etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>{usuario?.nombre_completo}</span>
          <Button variant="secondary" onClick={cerrarSesion}>Salir</Button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
