/**
 * Datos simulados con la MISMA forma que los esquemas de docs/openapi/*-v1.yaml.
 * Si el contrato cambia, actualice aquí. Cantidades y costos son texto decimal ("12.500").
 */

export const PERMISOS_POR_ROL = {
  ADMINISTRADOR: [
    "usuario.gestionar", "producto.consultar", "producto.crear", "producto.editar",
    "producto.configurar_minimo", "producto.descontinuar", "catalogo.administrar",
    "movimiento.registrar_entrada", "movimiento.registrar_salida", "movimiento.consultar",
    "movimiento.anular", "alerta.consultar", "analitica.consultar",
  ],
  MANICURISTA: ["producto.consultar", "movimiento.registrar_salida", "movimiento.consultar", "alerta.consultar"],
  GERENTE: ["usuario.gestionar", "producto.consultar", "movimiento.consultar", "alerta.consultar", "analitica.consultar"],
};

/** Usuarios de prueba del modo simulado. Contraseña de todos: "spa12345". */
export const USUARIOS = [
  { id: "a0000000-0000-4000-8000-000000000001", correo: "admin@spa.co", nombre_completo: "Laura Gómez", rol: "ADMINISTRADOR", activo: true, creado_en: "2026-10-01T08:00:00-05:00" },
  { id: "a0000000-0000-4000-8000-000000000002", correo: "manicurista@spa.co", nombre_completo: "Diana Pérez", rol: "MANICURISTA", activo: true, creado_en: "2026-10-01T08:05:00-05:00" },
  { id: "a0000000-0000-4000-8000-000000000003", correo: "gerente@spa.co", nombre_completo: "Carlos Rojas", rol: "GERENTE", activo: true, creado_en: "2026-10-01T08:10:00-05:00" },
];

export const CATEGORIAS = [
  { id: 1, nombre: "Esmaltes", descripcion: "Esmaltes tradicionales y semipermanentes", orden: 1, activa: true },
  { id: 2, nombre: "Removedores", descripcion: "Acetona y removedores sin acetona", orden: 2, activa: true },
  { id: 3, nombre: "Herramientas", descripcion: "Limas, pinzas y cortaúñas", orden: 3, activa: true },
  { id: 4, nombre: "Desechables", descripcion: "Guantes, algodón y toallas", orden: 4, activa: true },
];

export const UNIDADES = [
  { id: 1, codigo: "UND", nombre: "Unidad", magnitud: "CONTEO", admite_decimales: false },
  { id: 2, codigo: "ML", nombre: "Mililitro", magnitud: "VOLUMEN", admite_decimales: true },
  { id: 3, codigo: "PAR", nombre: "Par", magnitud: "CONTEO", admite_decimales: false },
];

const ahora = "2026-10-25T10:00:00-05:00";
export const PRODUCTOS = [
  { id: "p0000000-0000-4000-8000-000000000001", codigo: "ESM-001", nombre: "Esmalte rojo 15 ml", descripcion: null, categoria_id: 1, unidad_medida_id: 1, stock_actual: "24.000", stock_minimo: "6.000", estado: "DISPONIBLE", descontinuado: false, version: 1, creado_en: ahora, actualizado_en: ahora },
  { id: "p0000000-0000-4000-8000-000000000002", codigo: "REM-001", nombre: "Acetona pura", descripcion: "Galón", categoria_id: 2, unidad_medida_id: 2, stock_actual: "350.000", stock_minimo: "500.000", estado: "BAJO_STOCK", descontinuado: false, version: 3, creado_en: ahora, actualizado_en: ahora },
  { id: "p0000000-0000-4000-8000-000000000003", codigo: "DES-004", nombre: "Guantes de nitrilo talla M", descripcion: null, categoria_id: 4, unidad_medida_id: 3, stock_actual: "0.000", stock_minimo: "20.000", estado: "AGOTADO", descontinuado: false, version: 2, creado_en: ahora, actualizado_en: ahora },
  { id: "p0000000-0000-4000-8000-000000000004", codigo: "HER-010", nombre: "Lima de cartón 180/240", descripcion: null, categoria_id: 3, unidad_medida_id: 1, stock_actual: "12.000", stock_minimo: null, estado: "DESCONTINUADO", descontinuado: true, version: 5, creado_en: ahora, actualizado_en: ahora },
];

/** Coordenadas reales aproximadas de Bogotá (EPSG:4326). El spa simulado está en Chapinero. */
export const SPA_UBICACION = { latitud: 4.6486, longitud: -74.0628 };
export const PROVEEDORES = [
  { id: "f0000000-0000-4000-8000-000000000001", nombre: "Distribuidora Belleza Total", nit: "900123456-7", telefono: "6015550101", correo: "ventas@bellezatotal.co", direccion: "Cl. 63 #13-20, Chapinero", ubicacion: { latitud: 4.6484, longitud: -74.0645 }, activo: true },
  { id: "f0000000-0000-4000-8000-000000000002", nombre: "Insumos Nail Pro", nit: "901987654-3", telefono: "6015550202", correo: null, direccion: "Av. Suba #116-50", ubicacion: { latitud: 4.7029, longitud: -74.0702 }, activo: true },
  { id: "f0000000-0000-4000-8000-000000000003", nombre: "Químicos del Sur", nit: "800555444-1", telefono: null, correo: null, direccion: "Autopista Sur #66-78, Soacha", ubicacion: { latitud: 4.5794, longitud: -74.2168 }, activo: true },
];

export const MOTIVOS = [
  { id: 1, codigo: "COMPRA", nombre: "Compra a proveedor", aplica_a: "ENTRADA" },
  { id: 2, codigo: "AJUSTE_CONTEO", nombre: "Ajuste por conteo físico", aplica_a: "ENTRADA" },
  { id: 3, codigo: "CONSUMO_SERVICIO", nombre: "Consumo en servicio", aplica_a: "SALIDA" },
  { id: 4, codigo: "MERMA", nombre: "Merma o daño", aplica_a: "SALIDA" },
  { id: 5, codigo: "VENCIMIENTO", nombre: "Producto vencido", aplica_a: "SALIDA" },
];

export const MOVIMIENTOS = [
  { id: 1, producto_id: PRODUCTOS[1].id, tipo: "ENTRADA", motivo_codigo: "COMPRA", cantidad: "500.000", saldo_resultante: "500.000", costo_unitario: "38.0000", proveedor_id: "f0000000-0000-4000-8000-000000000001", observacion: null, registrado_por: USUARIOS[0].id, ocurrido_en: "2026-10-20T09:00:00-05:00", movimiento_anulado_id: null, anulado_por_id: null },
  { id: 2, producto_id: PRODUCTOS[1].id, tipo: "SALIDA", motivo_codigo: "CONSUMO_SERVICIO", cantidad: "150.000", saldo_resultante: "350.000", costo_unitario: null, observacion: "Servicio de retiro", registrado_por: USUARIOS[1].id, ocurrido_en: "2026-10-24T15:30:00-05:00", movimiento_anulado_id: null, anulado_por_id: null },
];
