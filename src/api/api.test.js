/** Recorre los 31 endpoints contra el modo simulado: valida clientes, formas y errores problem+json. */
import { ErrorApi, TOKEN_KEY, normalizarError } from "./cliente";
import * as analitica from "./analitica";
import * as catalogo from "./catalogo";
import * as identidad from "./identidad";
import * as movimientos from "./movimientos";
import { reiniciarSimulacion } from "../mocks/adaptador";

const ACETONA = "p0000000-0000-4000-8000-000000000002";

async function entrarComo(correo) {
  const r = await identidad.login(correo, "spa12345");
  sessionStorage.setItem(TOKEN_KEY, r.access_token);
  return r;
}

beforeEach(() => {
  sessionStorage.clear();
  reiniciarSimulacion();
});

describe("cliente", () => {
  it("normaliza un error sin respuesta como SIN_CONEXION", () => {
    const e = normalizarError(new Error("red caída"));
    expect(e).toBeInstanceOf(ErrorApi);
    expect(e.code).toBe("SIN_CONEXION");
  });

  it("sin token responde 401 NO_AUTENTICADO", async () => {
    await expect(catalogo.listarCategorias()).rejects.toMatchObject({ status: 401, code: "NO_AUTENTICADO" });
  });
});

describe("S1 · Identidad", () => {
  it("login con credenciales inválidas → CREDENCIALES_INVALIDAS", async () => {
    await expect(identidad.login("admin@spa.co", "otra-clave")).rejects.toMatchObject({ code: "CREDENCIALES_INVALIDAS" });
  });

  it("administrador gestiona usuarios y roles", async () => {
    const { usuario } = await entrarComo("admin@spa.co");
    expect(usuario.permisos).toContain("usuario.gestionar");
    expect((await identidad.sesionActual()).rol).toBe("ADMINISTRADOR");
    expect((await identidad.listarUsuarios()).total).toBe(3);
    const nuevo = await identidad.crearUsuario({ correo: "n@spa.co", nombre_completo: "Nueva", rol: "MANICURISTA", contrasena_temporal: "Temporal123" });
    expect(nuevo.activo).toBe(true);
    expect((await identidad.obtenerUsuario(usuario.id)).correo).toBe("admin@spa.co");
    expect((await identidad.actualizarUsuario(usuario.id, { nombre_completo: "Laura G." })).nombre_completo).toBe("Laura G.");
    expect((await identidad.cambiarEstadoUsuario(usuario.id, false)).activo).toBe(false);
    expect(await identidad.listarRoles()).toHaveLength(3);
    await expect(identidad.obtenerUsuario("no-existe")).rejects.toMatchObject({ status: 404 });
  });

  it("manicurista no gestiona usuarios → 403 SIN_PERMISO", async () => {
    await entrarComo("manicurista@spa.co");
    await expect(identidad.listarUsuarios()).rejects.toMatchObject({ status: 403, code: "SIN_PERMISO" });
  });
});

describe("S2 · Catálogo", () => {
  beforeEach(() => entrarComo("admin@spa.co"));

  it("consulta catálogo con filtros", async () => {
    expect(await catalogo.listarCategorias()).toHaveLength(4);
    expect(await catalogo.listarUnidades()).toHaveLength(3);
    expect((await catalogo.listarProductos()).total).toBe(3);
    expect((await catalogo.listarProductos({ incluir_descontinuados: true })).total).toBe(4);
    expect((await catalogo.listarProductos({ estado: "BAJO_STOCK" })).items[0].codigo).toBe("REM-001");
    expect((await catalogo.listarProductos({ q: "guantes", categoria_id: 4 })).total).toBe(1);
    expect((await catalogo.obtenerProducto(ACETONA)).version).toBe(3);
  });

  it("crea, actualiza y descontinúa productos con sus reglas", async () => {
    expect((await catalogo.crearCategoria({ nombre: "Spa" })).activa).toBe(true);
    expect((await catalogo.actualizarCategoria(1, { activa: false })).activa).toBe(false);
    const p = await catalogo.crearProducto({ codigo: "NEW-1", nombre: "Nuevo", categoria_id: 1, unidad_medida_id: 1, cantidad_inicial: "5" });
    expect(p.estado).toBe("DISPONIBLE");
    await expect(catalogo.crearProducto({ codigo: "esm-001", nombre: "x" })).rejects.toMatchObject({ code: "CODIGO_DUPLICADO" });
    expect((await catalogo.actualizarProducto(ACETONA, { nombre: "Acetona" }, 3)).version).toBe(4);
    await expect(catalogo.actualizarProducto(ACETONA, { nombre: "x" }, 3)).rejects.toMatchObject({ status: 412, code: "VERSION_CONFLICTO" });
    expect((await catalogo.configurarStockMinimo(ACETONA, "100")).stock_minimo).toBe("100");
    expect((await catalogo.descontinuarProducto(ACETONA)).estado).toBe("DESCONTINUADO");
    expect((await catalogo.reactivarProducto(ACETONA)).descontinuado).toBe(false);
  });
});

describe("S3 · Movimientos", () => {
  beforeEach(() => entrarComo("admin@spa.co"));

  it("registra entradas y salidas con idempotencia y valida stock", async () => {
    expect(await movimientos.listarMotivos("SALIDA")).toHaveLength(3);
    const entrada = await movimientos.registrarEntrada({ producto_id: ACETONA, cantidad: "200", motivo_codigo: "COMPRA" }, "clave-1");
    expect(entrada.saldo).toBe("550.000");
    const repetida = await movimientos.registrarEntrada({ producto_id: ACETONA, cantidad: "200", motivo_codigo: "COMPRA" }, "clave-1");
    expect(repetida.movimiento.id).toBe(entrada.movimiento.id);
    await expect(movimientos.registrarSalida({ producto_id: ACETONA, cantidad: "9999", motivo_codigo: "MERMA" })).rejects.toMatchObject({ code: "STOCK_INSUFICIENTE" });
    const salida = await movimientos.registrarSalida({ producto_id: ACETONA, cantidad: "100", motivo_codigo: "CONSUMO_SERVICIO" });
    expect(salida.estado).toBe("BAJO_STOCK");
    await expect(movimientos.registrarSalida({ producto_id: "p0000000-0000-4000-8000-000000000004", cantidad: "1", motivo_codigo: "MERMA" })).rejects.toMatchObject({ code: "PRODUCTO_DESCONTINUADO" });
  });

  it("consulta historial y anula una sola vez", async () => {
    expect((await movimientos.listarMovimientos()).total).toBe(2);
    expect((await movimientos.obtenerMovimiento(2)).tipo).toBe("SALIDA");
    const anulacion = await movimientos.anularMovimiento(2, "Registro duplicado");
    expect(anulacion.movimiento.tipo).toBe("ANULACION");
    expect(anulacion.saldo).toBe("500.000");
    await expect(movimientos.anularMovimiento(2, "Otra vez")).rejects.toMatchObject({ code: "MOVIMIENTO_YA_ANULADO" });
    await expect(movimientos.obtenerMovimiento(99)).rejects.toMatchObject({ status: 404 });
  });

  it("la manicurista solo ve sus propios movimientos", async () => {
    await entrarComo("manicurista@spa.co");
    expect((await movimientos.listarMovimientos()).total).toBe(1);
  });
});

describe("S4 · Alertas y analítica", () => {
  beforeEach(() => entrarComo("gerente@spa.co"));

  it("expone alertas, tablero, consumo, cobertura y exportación", async () => {
    expect(await analitica.listarAlertas()).toHaveLength(2);
    expect(await analitica.listarAlertas("AGOTADO")).toHaveLength(1);
    expect(await analitica.resumenAlertas()).toEqual({ bajo_stock: 1, agotado: 1, total: 2 });
    expect((await analitica.tablero()).valor_inventario).toBeNull();
    expect(await analitica.consumo("2026-10-01", "2026-10-31")).toHaveLength(1);
    expect((await analitica.cobertura())[0].dias_cobertura).toBe("70.0");
    expect(await analitica.exportar("inventario")).toBeInstanceOf(Blob);
  });
});
