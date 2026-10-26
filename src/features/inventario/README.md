# Feature · Inventario (HU-02, HU-03, HU-04, HU-05, HU-12)

**Responsable:** Gleidy725 · **API:** `src/api/catalogo.js` · **Contrato:** `catalogo-v1.yaml`

| Entrega | Sprint | Funciones de la API |
|---|---|---|
| **F5 · Vista de categorías (esqueleto andante)** | 1 | `listarCategorias()` |
| Tabla de inventario con filtros por categoría, estado y búsqueda | 2 | `listarProductos({ categoria_id, estado, q })` |
| Detalle y formulario de producto (crear y editar con `version`) | 2 | `crearProducto`, `actualizarProducto(id, cambios, version)` |
| Stock mínimo y descontinuar / reactivar | 2 | `configurarStockMinimo`, `descontinuarProducto`, `reactivarProducto` |

Errores que la pantalla debe mostrar por `code`: `CODIGO_DUPLICADO`, `VERSION_CONFLICTO` (recargar y reintentar), `DATOS_INVALIDOS` (marcar campos con `error.errors`).

Use `EstadoBadge` del design system para el estado de cada producto. Botones visibles solo si `useAuth().tiene(permiso)`.
