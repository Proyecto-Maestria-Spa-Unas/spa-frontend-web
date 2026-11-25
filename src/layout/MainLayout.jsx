import { NavLink, Outlet } from "react-router-dom";
import { MENU, ROUTES } from "../constants/routes";
import { useAuth } from "../features/auth/AuthContext";
import { Button } from "../design-system/componentes/Button";
import { ContadorAlertas } from "../features/tablero/ContadorAlertas";

/** Marco de la aplicación: menú filtrado por permisos de la sesión. */
export function MainLayout() {
  const { usuario, tiene, cerrarSesion } = useAuth();
  return (
    <div className="min-h-screen bg-marca-fondo">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-b border-marca-borde bg-marca-superficie px-6 py-4">
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
        <nav aria-label="Principal" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {MENU.filter((m) => tiene(m.permiso)).map((m) => (
            <span key={m.ruta} className="inline-flex items-center gap-1">
              <NavLink
                to={m.ruta}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm transition-colors ${isActive
                    ? "bg-marca-enfoque font-semibold text-marca-primario-hover"
                    : "text-marca-texto hover:bg-marca-superficie-hover hover:text-marca-primario-hover"
                  }`
                }
              >
                {m.etiqueta}
              </NavLink>
              {m.ruta === ROUTES.TABLERO && <ContadorAlertas />}
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>{usuario?.nombre_completo}</span>
          <Button
            variant="secondary"
            onClick={cerrarSesion}
            className="border-marca-acento bg-marca-enfoque text-marca-primario-hover hover:bg-marca-acento/30"
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
