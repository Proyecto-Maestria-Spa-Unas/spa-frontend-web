import { NavLink, Outlet } from "react-router-dom";
import { MENU } from "../constants/routes";
import { useAuth } from "../features/auth/AuthContext";
import { Button } from "../design-system/componentes/Button";

/** Marco de la aplicación: menú filtrado por permisos de la sesión. */
export function MainLayout() {
  const { usuario, tiene, cerrarSesion } = useAuth();
  return (
    <div className="min-h-screen bg-marca-fondo">
      <header className="flex items-center justify-between border-b border-marca-borde bg-marca-superficie px-6 py-4">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Logo de NailsSpa"
            className="h-11 w-11 object-contain"
          />

          <div>
            <h1 className="font-heading text-lg font-bold tracking-wide text-[#75445B]">
              NailsSpa
            </h1>
            <p className="text-xs text-marca-texto">
              Sistema de inventario
            </p>
          </div>
        </div>
        <nav aria-label="Principal" className="flex gap-4 text-sm">
          {MENU.filter((m) => tiene(m.permiso)).map((m) => (
            <NavLink
              key={m.ruta}
              to={m.ruta}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm transition-colors ${isActive
                  ? "bg-[#FCEAF1] font-semibold text-[#A85F82]"
                  : "text-marca-texto hover:bg-[#FFF5F8] hover:text-[#A85F82]"
                }`
              }
            >
              {m.etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          <span>{usuario?.nombre_completo}</span>
          <Button
            variant="secondary"
            onClick={cerrarSesion}
            className="border-[#E8C5D5] bg-[#FCEAF1] text-[#A85F82] hover:bg-[#F8DCE8]"
          >
            Salir
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
