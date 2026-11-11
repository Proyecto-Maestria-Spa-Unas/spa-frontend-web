/**
 * HU-08, HU-13 · Historial de movimientos
 * Responsable: Gleidy725 · API: src/api/movimientos.js
 * Endpoints: GET /movimientos; POST /movimientos/{id}/anulaciones
 * Ver README.md de esta carpeta para el alcance y los criterios.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "../../design-system/componentes/Button";
import { Modal } from "../../design-system/componentes/Modal";
import { useAuth } from "../auth/AuthContext";

import { listarProductos } from "../../api/catalogo";

import {
  listarMovimientos,
  obtenerMovimiento,
  anularMovimiento,
} from "../../api/movimientos";

import { nuevaClaveIdempotencia } from "../../api/cliente";


export function HistorialPage() {
  const { tiene } = useAuth();

  // Referencia para desplazar la pantalla hasta el mensaje de éxito
  const referenciaMensaje = useRef(null);

  // Datos
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);

  // Filtros
  const [productoId, setProductoId] = useState("");
  const [tipo, setTipo] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [tamanoPagina] = useState(10);
  const [total, setTotal] = useState(0);

  // Estado de la pantalla
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Detalle y anulación
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [claveIdempotencia, setClaveIdempotencia] = useState(null);
  const [modalAnulacionAbierto, setModalAnulacionAbierto] = useState(false);


  // Desplazar hasta la alerta y ocultarla después de 5 segundos
  useEffect(() => {
    if (!mensaje) return;

    const temporizadorDesplazamiento = setTimeout(() => {
      referenciaMensaje.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);

    const temporizadorMensaje = setTimeout(() => {
      setMensaje("");
    }, 5000);

    return () => {
      clearTimeout(temporizadorDesplazamiento);
      clearTimeout(temporizadorMensaje);
    };
  }, [mensaje]);


  // Cargar productos para el filtro
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const respuesta = await listarProductos({ page: 1, size: 100, incluir_descontinuados: true });

        setProductos(
          Array.isArray(respuesta)
            ? respuesta
            : respuesta.items ?? [],
        );
      } catch (error) {
        console.error("Error al cargar productos:", error);
        setError("No fue posible cargar los productos.");
      }
    };

    cargarProductos();
  }, []);

  // Cargar historial de movimientos
  const cargarMovimientos = useCallback(async () => {
    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const respuesta = await listarMovimientos({
        producto_id: productoId || undefined,
        tipo: tipo || undefined,
        desde: desde ? `${desde}T00:00:00-05:00` : undefined,
        hasta: hasta ? `${hasta}T23:59:59-05:00` : undefined,
        page: pagina,
        size: tamanoPagina,
      });

      setMovimientos(
        Array.isArray(respuesta)
          ? respuesta
          : respuesta.items ?? [],
      );

      setTotal(
        Array.isArray(respuesta)
          ? respuesta.length
          : respuesta.total ?? 0,
      );
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
      setError("No fue posible cargar el historial de movimientos.");
      setMovimientos([]);
      setTotal(0);
    } finally {
      setCargando(false);
    }
  }, [productoId, tipo, desde, hasta, pagina, tamanoPagina]);

  useEffect(() => {
    Promise.resolve().then(() => cargarMovimientos());
  }, [cargarMovimientos]);

  // Limpiar filtros y volver a la primera página
  const limpiarFiltros = () => {
    setProductoId("");
    setTipo("");
    setDesde("");
    setHasta("");
    setPagina(1);
  };

  // Obtener el nombre de un producto por su identificador
  const obtenerNombreProducto = (productoId) => {
    const producto = productos.find((item) => item.id === productoId);

    return producto
      ? `${producto.codigo} - ${producto.nombre}`
      : "Producto no encontrado";
  };

  // Formatear fecha y hora del movimiento
  const formatearFecha = (fecha) => {
    if (!fecha) return "—";

    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(fecha));
  };

  // Formatear cantidades decimales
  const formatearCantidad = (cantidad) => {
    if (cantidad === null || cantidad === undefined) return "—";

    return new Intl.NumberFormat("es-CO", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(Number(cantidad));
  };

  // Obtener etiqueta y estilos según el tipo de movimiento
  const obtenerEstiloTipo = (tipoMovimiento) => {
    const estilos = {
      ENTRADA: {
        etiqueta: "Entrada",
        clases: "bg-estado-disponible-fondo text-estado-disponible-texto",
      },
      SALIDA: {
        etiqueta: "Salida",
        clases: "bg-estado-bajo-fondo text-estado-bajo-texto",
      },
      ANULACION: {
        etiqueta: "Anulación",
        clases: "bg-estado-agotado-fondo text-estado-agotado-texto",
      },
    };

    return estilos[tipoMovimiento] ?? {
      etiqueta: tipoMovimiento ?? "Desconocido",
      clases: "bg-marca-borde text-marca-texto",
    };
  };

  // Consultar detalle de un movimiento
  const consultarDetalle = async (id) => {
    try {
      setCargandoDetalle(true);
      setError("");

      const respuesta = await obtenerMovimiento(id);

      setMovimientoSeleccionado(respuesta);
    } catch (error) {
      console.error("Error al consultar el movimiento:", error);
      setError("No fue posible consultar el detalle del movimiento.");
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Anular un movimiento
  const confirmarAnulacion = async () => {
    if (!movimientoSeleccionado || motivoAnulacion.trim().length < 5) {
      setError("El motivo de la anulación debe tener al menos 5 caracteres.");
      return;
    }

    try {
      setAnulando(true);
      setError("");
      setMensaje("");

      const clave = claveIdempotencia ?? nuevaClaveIdempotencia();

      setClaveIdempotencia(clave);

      await anularMovimiento(
        movimientoSeleccionado.id,
        motivoAnulacion.trim(),
        clave,
      );

      setModalAnulacionAbierto(false);
      setMovimientoSeleccionado(null);
      setMotivoAnulacion("");
      setClaveIdempotencia(null);

      await cargarMovimientos();

      setMensaje("El movimiento fue anulado correctamente.");
    } catch (error) {
      console.error("Error al anular el movimiento:", error);

      if (error.code === "STOCK_INSUFICIENTE") {
        setError(
          "No se puede anular este movimiento porque el stock disponible es insuficiente. Verifica las existencias del producto.",
        );
      } else if (error.code === "PRODUCTO_DESCONTINUADO") {
        setError(
          "No se puede anular este movimiento porque el producto está descontinuado.",
        );
      } else {
        setError(
          "No fue posible anular el movimiento. Verifica e inténtalo nuevamente.",
        );
      }
    } finally {
      setAnulando(false);
    }
  };
  return (
    <section className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-marca-acento bg-marca-enfoque">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-marca-primario"
            aria-hidden="true"
          >
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
            <path d="M12 7v5l3 2" />
          </svg>
        </div>

        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-xs font-bold tracking-[0.25em] text-marca-primario-hover">
              NAILSSPA
            </p>
            <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-marca-primario-hover">
              Historial de movimientos
            </h2>
            <p className="mt-1 text-sm text-marca-texto">
              Consulta y administra los movimientos del inventario.
            </p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-xl border border-marca-borde bg-marca-superficie p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-marca-primario-hover">
            Filtrar movimientos
          </h3>

          <Button
            type="button"
            variant="secondary"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Filtro por producto */}
          <div>
            <label
              htmlFor="filtro-producto"
              className="mb-1 block text-sm font-medium text-marca-texto"
            >
              Producto
            </label>

            <select
              id="filtro-producto"
              value={productoId}
              onChange={(evento) => {
                setProductoId(evento.target.value);
                setPagina(1);
              }}
              className="w-full rounded-lg border border-marca-borde bg-marca-superficie px-3 py-2 text-sm text-marca-texto focus:outline-none focus:ring-2 focus:ring-marca-primario"
            >
              <option value="">Todos los productos</option>

              {productos.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.codigo} - {producto.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por tipo */}
          <div>
            <label
              htmlFor="filtro-tipo"
              className="mb-1 block text-sm font-medium text-marca-texto"
            >
              Tipo de movimiento
            </label>

            <select
              id="filtro-tipo"
              value={tipo}
              onChange={(evento) => {
                setTipo(evento.target.value);
                setPagina(1);
              }}
              className="w-full rounded-lg border border-marca-borde bg-marca-superficie px-3 py-2 text-sm text-marca-texto focus:outline-none focus:ring-2 focus:ring-marca-primario"
            >
              <option value="">Todos los tipos</option>
              <option value="ENTRADA">Entrada</option>
              <option value="SALIDA">Salida</option>
              <option value="ANULACION">Anulación</option>
            </select>
          </div>

          {/* Filtro desde */}
          <div>
            <label
              htmlFor="filtro-desde"
              className="mb-1 block text-sm font-medium text-marca-texto"
            >
              Desde
            </label>

            <input
              id="filtro-desde"
              type="date"
              value={desde}
              onChange={(evento) => {
                setDesde(evento.target.value);
                setPagina(1);
              }}
              className="w-full rounded-lg border border-marca-borde bg-marca-superficie px-3 py-2 text-sm text-marca-texto focus:outline-none focus:ring-2 focus:ring-marca-primario"
            />
          </div>

          {/* Filtro hasta */}
          <div>
            <label
              htmlFor="filtro-hasta"
              className="mb-1 block text-sm font-medium text-marca-texto"
            >
              Hasta
            </label>

            <input
              id="filtro-hasta"
              type="date"
              min={desde || undefined}
              value={hasta}
              onChange={(evento) => {
                setHasta(evento.target.value);
                setPagina(1);
              }}
              className="w-full rounded-lg border border-marca-borde bg-marca-superficie px-3 py-2 text-sm text-marca-texto focus:outline-none focus:ring-2 focus:ring-marca-primario"
            />
          </div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="overflow-hidden rounded-xl border border-marca-borde bg-marca-superficie">
        <div className="border-b border-marca-borde px-5 py-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold text-marca-texto">
              Movimientos registrados
            </h3>

            <p className="text-sm text-marca-texto">
              Total de registros:{" "}
              <span className="font-semibold text-marca-primario-hover">
                {total}
              </span>
            </p>
          </div>
        </div>

        {cargando ? (
          <p className="p-6 text-center text-sm text-marca-texto">
            Cargando movimientos...
          </p>
        ) : error && !modalAnulacionAbierto ? (
          <p className="p-6 text-center text-sm text-estado-agotado-texto" role="alert">
            {error}
          </p>
        ) : movimientos.length === 0 ? (
          <p className="p-6 text-center text-sm text-marca-texto">
            No se encontraron movimientos.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-marca-enfoque font-heading text-xs uppercase tracking-wider text-marca-primario-hover">
                <tr>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">Fecha</th>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">Producto</th>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">Tipo</th>
                  <th className="whitespace-nowrap px-5 py-4 font-semibold">Motivo</th>
                  <th className="whitespace-nowrap px-5 py-4 text-right font-semibold">Cantidad</th>
                  <th className="whitespace-nowrap px-5 py-4 text-right font-semibold">Saldo</th>
                  <th className="whitespace-nowrap px-5 py-4 text-center font-semibold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-marca-borde">
                {movimientos.map((movimiento) => {
                  const estilo = obtenerEstiloTipo(movimiento.tipo);

                  return (
                    <tr
                      key={movimiento.id}
                      className="transition-colors hover:bg-marca-enfoque/40"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatearFecha(movimiento.ocurrido_en)}
                      </td>

                      <td className="px-4 py-3">
                        {obtenerNombreProducto(movimiento.producto_id)}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${estilo.clases}`}>
                          {estilo.etiqueta}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {movimiento.motivo_codigo || "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {formatearCantidad(movimiento.cantidad)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-right">
                        {formatearCantidad(movimiento.saldo_resultante)}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-3 py-2"
                          onClick={() => consultarDetalle(movimiento.id)}
                        >
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mensaje de éxito */}
      {mensaje && (
        <div
          ref={referenciaMensaje}
          className="flex items-center gap-3 rounded-xl border border-estado-disponible-texto/40 bg-estado-disponible-fondo px-4 py-3 shadow-sm"
          role="status"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-lg font-bold text-estado-disponible-texto">
            ✓
          </div>

          <div>
            <p className="text-sm font-bold text-estado-disponible-texto">
              ¡Operación exitosa!
            </p>
            <p className="text-sm text-marca-texto">
              {mensaje}
            </p>
          </div>
        </div>
      )}

      {/* Paginación */}
      {total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-marca-borde bg-marca-superficie px-5 py-4">
          <p className="text-sm text-marca-texto">
            Página {pagina} de {Math.max(1, Math.ceil(total / tamanoPagina))}
          </p>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pagina === 1 || cargando}
              onClick={() => setPagina((anterior) => anterior - 1)}
            >
              Anterior
            </Button>

            <Button
              type="button"
              variant="secondary"
              disabled={
                pagina >= Math.ceil(total / tamanoPagina) || cargando
              }
              onClick={() => setPagina((anterior) => anterior + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Modal de detalle */}
      <Modal
        open={Boolean(movimientoSeleccionado) && !modalAnulacionAbierto}
        onClose={() => {
          setMovimientoSeleccionado(null);
          setError("");
        }}
        title="Detalle del movimiento"
      >
        {cargandoDetalle ? (
          <p className="py-6 text-center">Cargando detalle...</p>
        ) : movimientoSeleccionado ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-marca-texto">
                Producto
              </p>
              <p className="mt-1 font-medium">
                {obtenerNombreProducto(movimientoSeleccionado.producto_id)}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-marca-texto">
                  Tipo
                </p>
                <p className="mt-1">
                  {obtenerEstiloTipo(movimientoSeleccionado.tipo).etiqueta}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-marca-texto">
                  Fecha
                </p>
                <p className="mt-1">
                  {formatearFecha(movimientoSeleccionado.ocurrido_en)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-marca-texto">
                  Motivo
                </p>
                <p className="mt-1">
                  {movimientoSeleccionado.motivo_codigo || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-marca-texto">
                  Cantidad
                </p>
                <p className="mt-1">
                  {formatearCantidad(movimientoSeleccionado.cantidad)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-marca-texto">
                  Saldo resultante
                </p>
                <p className="mt-1">
                  {formatearCantidad(movimientoSeleccionado.saldo_resultante)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-marca-texto">
                  Costo unitario
                </p>
                <p className="mt-1">
                  {movimientoSeleccionado.costo_unitario
                    ? formatearCantidad(movimientoSeleccionado.costo_unitario)
                    : "No aplica"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-marca-texto">
                Observación
              </p>
              <p className="mt-1">
                {movimientoSeleccionado.observacion || "Sin observaciones"}
              </p>
            </div>

            {movimientoSeleccionado.movimiento_anulado_id && (
              <p className="rounded-lg bg-estado-agotado-fondo p-3 text-sm text-estado-agotado-texto">
                Este movimiento corresponde a una anulación.
              </p>
            )}

            {movimientoSeleccionado.anulado_por_id && (
              <p className="rounded-lg bg-estado-agotado-fondo p-3 text-sm text-estado-agotado-texto">
                Este movimiento fue anulado.
              </p>
            )}
          </div>
        ) : null}

        {tiene("movimiento.anular") &&
          movimientoSeleccionado &&
          !movimientoSeleccionado.anulado_por_id &&
          !movimientoSeleccionado.movimiento_anulado_id && (
            <div className="mt-6 flex w-full justify-center border-t border-marca-borde pt-4">
              <Button
                type="button"
                variant="primary"
                onClick={() => {
                  setError("");
                  setMotivoAnulacion("");
                  setClaveIdempotencia(nuevaClaveIdempotencia());
                  setModalAnulacionAbierto(true);
                }}
              >
                Anular movimiento
              </Button>
            </div>
          )}
      </Modal>

      {/* Modal de confirmación de anulación */}
      <Modal
        open={modalAnulacionAbierto}
        onClose={() => {
          if (!anulando) {
            setModalAnulacionAbierto(false);
            setMotivoAnulacion("");
            setClaveIdempotencia(null);
          }
        }}
        title="Confirmar anulación"
      >
        <div className="space-y-4">
          <p className="text-sm text-marca-texto">
            Vas a anular el movimiento seleccionado. Esta acción registrará
            un movimiento inverso para ajustar el inventario.
          </p>

          <div>
            <label
              htmlFor="motivo-anulacion"
              className="mb-1 block text-sm font-medium text-marca-texto"
            >
              Motivo de la anulación
            </label>

            <textarea
              id="motivo-anulacion"
              rows={4}
              value={motivoAnulacion}
              onChange={(evento) => {
                setMotivoAnulacion(evento.target.value);
                setError("");
              }}
              maxLength={500}
              placeholder="Explica por qué necesitas anular este movimiento..."
              className="w-full resize-y rounded-lg border border-marca-borde bg-marca-superficie px-3 py-2 text-sm text-marca-texto focus:outline-none focus:ring-2 focus:ring-marca-primario"
            />

            <p className="mt-1 text-right text-xs text-marca-texto">
              Mínimo 5 caracteres · {motivoAnulacion.length}/500
            </p>
          </div>

          {error && (
            <p className="text-sm text-estado-agotado-texto" role="alert">
              {error}
            </p>
          )}

          <div className="flex w-full flex-wrap justify-center gap-3 border-t border-marca-borde pt-4">
            <Button
              type="button"
              variant="secondary"
              disabled={anulando}
              onClick={() => {
                setModalAnulacionAbierto(false);
                setMotivoAnulacion("");
                setClaveIdempotencia(null);
              }}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              variant="primary"
              disabled={anulando || motivoAnulacion.trim().length < 5}
              onClick={confirmarAnulacion}
            >
              {anulando ? "Anulando..." : "Confirmar anulación"}
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
