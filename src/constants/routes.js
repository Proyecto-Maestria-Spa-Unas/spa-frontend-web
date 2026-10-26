/** Rutas de la interfaz y el permiso que exige cada una (sección 6 del documento de arquitectura). */
export const ROUTES = Object.freeze({
  LOGIN: "/login",
  RECUPERAR: "/recuperar",
  INVENTARIO: "/inventario",
  MOVIMIENTOS: "/movimientos",
  HISTORIAL: "/historial",
  TABLERO: "/tablero",
  PROVEEDORES: "/proveedores",
  USUARIOS: "/usuarios",
});

export const MENU = Object.freeze([
  { ruta: ROUTES.INVENTARIO, etiqueta: "Inventario", permiso: "producto.consultar" },
  { ruta: ROUTES.MOVIMIENTOS, etiqueta: "Registrar movimiento", permiso: "movimiento.registrar_salida" },
  { ruta: ROUTES.HISTORIAL, etiqueta: "Historial", permiso: "movimiento.consultar" },
  { ruta: ROUTES.TABLERO, etiqueta: "Alertas y tablero", permiso: "alerta.consultar" },
  { ruta: ROUTES.PROVEEDORES, etiqueta: "Proveedores", permiso: "producto.consultar" },
  { ruta: ROUTES.USUARIOS, etiqueta: "Usuarios", permiso: "usuario.gestionar" },
]);
