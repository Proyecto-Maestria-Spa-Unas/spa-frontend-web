/** S2 · Catálogo · contrato docs/openapi/catalogo-v1.yaml (spa-backend-api). */
import { apiClient, datos } from "./cliente";

export const listarCategorias = () => datos(apiClient.get("/categorias"));
export const crearCategoria = (categoria) => datos(apiClient.post("/categorias", categoria));
export const actualizarCategoria = (id, cambios) => datos(apiClient.patch(`/categorias/${id}`, cambios));
export const listarUnidades = () => datos(apiClient.get("/unidades-medida"));

/** params: { categoria_id, estado, q, incluir_descontinuados, page, size } */
export const listarProductos = (params = {}) => datos(apiClient.get("/productos", { params }));
export const obtenerProducto = (id) => datos(apiClient.get(`/productos/${id}`));
export const crearProducto = (producto) => datos(apiClient.post("/productos", producto));
/** `version` viene del producto leído: si otro usuario lo cambió antes, la API responde 412 VERSION_CONFLICTO. */
export const actualizarProducto = (id, cambios, version) =>
  datos(apiClient.patch(`/productos/${id}`, cambios, { headers: { "If-Match": String(version) } }));
export const configurarStockMinimo = (id, stockMinimo) =>
  datos(apiClient.put(`/productos/${id}/stock-minimo`, { stock_minimo: stockMinimo }));
export const descontinuarProducto = (id) => datos(apiClient.post(`/productos/${id}/descontinuar`));
export const reactivarProducto = (id) => datos(apiClient.post(`/productos/${id}/reactivar`));

/** Proveedores con ubicación { latitud, longitud } (PostGIS en la base). */
export const listarProveedores = (incluirInactivos = false) =>
  datos(apiClient.get("/proveedores", { params: { incluir_inactivos: incluirInactivos } }));
export const crearProveedor = (proveedor) => datos(apiClient.post("/proveedores", proveedor));
export const actualizarProveedor = (id, cambios) => datos(apiClient.patch(`/proveedores/${id}`, cambios));
