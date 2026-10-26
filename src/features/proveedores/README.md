# Feature · Proveedores (full-stack · X2)

**Responsable:** Gleidy725 · construye el endpoint **y** la pantalla.

| Capa | Dónde | Qué hacer |
|---|---|---|
| Backend | `spa-backend-api/app/modulos/catalogo/` (archivos `application/proveedores.py`, `infrastructure/proveedores_sql.py`, rutas ya declaradas en `api/router.py`) | GET, POST y PATCH `/proveedores`; NIT único (409 `CODIGO_DUPLICADO`); ubicación en `geography(Point, 4326)` |
| Frontend | esta carpeta | Lista, alta y edición; captura de la ubicación con un mapa (Leaflet) o latitud/longitud |
| API cliente | `src/api/catalogo.js` | Ya existen `listarProveedores`, `crearProveedor`, `actualizarProveedor` |

Datos simulados con coordenadas reales de Bogotá en `src/mocks/datos.js`.
