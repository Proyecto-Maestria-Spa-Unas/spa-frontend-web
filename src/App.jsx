import { Navigate, Route, Routes } from "react-router-dom";
import { ROUTES } from "./constants/routes";
import { LoginPage } from "./features/auth/LoginPage";
import { RutaProtegida } from "./features/auth/RutaProtegida";
import { InventarioPage } from "./features/inventario/InventarioPage";
import { HistorialPage } from "./features/movimientos/HistorialPage";
import { MovimientosPage } from "./features/movimientos/MovimientosPage";
import { TableroPage } from "./features/tablero/TableroPage";
import { UsuariosPage } from "./features/usuarios/UsuariosPage";
import { MainLayout } from "./layout/MainLayout";

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.LOGIN} element={<LoginPage />} />
      <Route element={<RutaProtegida />}>
        <Route element={<MainLayout />}>
          <Route path={ROUTES.INVENTARIO} element={<InventarioPage />} />
          <Route element={<RutaProtegida permiso="movimiento.registrar_salida" />}>
            <Route path={ROUTES.MOVIMIENTOS} element={<MovimientosPage />} />
          </Route>
          <Route element={<RutaProtegida permiso="movimiento.consultar" />}>
            <Route path={ROUTES.HISTORIAL} element={<HistorialPage />} />
          </Route>
          <Route element={<RutaProtegida permiso="alerta.consultar" />}>
            <Route path={ROUTES.TABLERO} element={<TableroPage />} />
          </Route>
          <Route element={<RutaProtegida permiso="usuario.gestionar" />}>
            <Route path={ROUTES.USUARIOS} element={<UsuariosPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to={ROUTES.INVENTARIO} replace />} />
    </Routes>
  );
}
