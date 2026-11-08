/**
 * HU-06, HU-07, HU-11 · Registrar movimiento
 * Responsable: Gleidy725 · API: src/api/movimientos.js
 * Endpoints: GET /motivos-movimiento; POST /movimientos/entradas, /movimientos/salidas
 * Ver README.md de esta carpeta para el alcance y los criterios.
 */
import { useEffect, useRef, useState } from "react";

import { Button } from "../../design-system/componentes/Button";
import { useAuth } from "../auth/AuthContext";

import {
  listarProductos,
  listarProveedores,
} from "../../api/catalogo";

import {
  listarMotivos,
  registrarEntrada,
  registrarSalida,
} from "../../api/movimientos";

import { nuevaClaveIdempotencia } from "../../api/cliente";

export function MovimientosPage() {
  const { tiene } = useAuth();

  // Información para los selectores
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [motivos, setMotivos] = useState([]);

  // Estado del formulario
  const [tipo, setTipo] = useState("ENTRADA");
  const [productoId, setProductoId] = useState("");
  const [motivoCodigo, setMotivoCodigo] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [costoUnitario, setCostoUnitario] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [observacion, setObservacion] = useState("");
  const alertaErrorRef = useRef(null);

  // Estado de la pantalla
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [formularioAbierto, setFormularioAbierto] = useState(false);

  // Clave que se reutilizará si debemos reintentar el registro
  const [claveIdempotencia, setClaveIdempotencia] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        setError("");

        const [respuestaProductos, respuestaProveedores] =
          await Promise.all([
            listarProductos(),
            listarProveedores(),
          ]);

        setProductos(
          Array.isArray(respuestaProductos)
            ? respuestaProductos
            : respuestaProductos.items ?? [],
        );

        setProveedores(
          Array.isArray(respuestaProveedores)
            ? respuestaProveedores
            : respuestaProveedores.items ?? [],
        );
      } catch (error) {
        console.error("Error al cargar los datos:", error);
        setError("No fue posible cargar los productos y proveedores.");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    const cargarMotivos = async () => {
      try {
        setError("");
        setMotivos([]);
        setMotivoCodigo("");

        const respuesta = await listarMotivos(tipo);

        setMotivos(
          Array.isArray(respuesta)
            ? respuesta
            : respuesta.items ?? [],
        );
      } catch (error) {
        console.error("Error al cargar los motivos:", error);
        setError("No fue posible cargar los motivos del movimiento.");
      }
    };

    cargarMotivos();
  }, [tipo]);

  const iniciarMovimiento = (nuevoTipo) => {
    setTipo(nuevoTipo);
    setProductoId("");
    setMotivoCodigo("");
    setCantidad("");
    setCostoUnitario("");
    setProveedorId("");
    setObservacion("");

    setMensaje("");
    setError("");

    // Una clave nueva para este formulario
    setClaveIdempotencia(nuevaClaveIdempotencia());
    setFormularioAbierto(true);
  };

  const puedeRegistrarEntrada = tiene("movimiento.registrar_entrada");
  const puedeRegistrarSalida = tiene("movimiento.registrar_salida");

  const validarFormulario = () => {
    if (!productoId) {
      setError("Debes seleccionar un producto.");
      return false;
    }

    if (!motivoCodigo) {
      setError("Debes seleccionar un motivo.");
      return false;
    }

    if (!cantidad || !Number.isFinite(Number(cantidad)) || Number(cantidad) <= 0) {
      setError("La cantidad debe ser un número mayor que cero.");
      return false;
    }

    if (tipo === "ENTRADA" && motivoCodigo === "COMPRA") {
      if (!costoUnitario || !Number.isFinite(Number(costoUnitario)) || Number(costoUnitario) <= 0) {
        setError("Debes ingresar un costo unitario mayor que cero.");
        return false;
      }

      if (!proveedorId) {
        setError("Debes seleccionar un proveedor para la compra.");
        return false;
      }
    }

    setError("");
    return true;
  };

  const manejarRegistro = async () => {
    if (!validarFormulario()) return;

    try {
      setCargando(true);
      setError("");
      setMensaje("");

      const datosMovimiento = {
        producto_id: productoId,
        motivo_codigo: motivoCodigo,
        cantidad: Number(cantidad),
        observacion: observacion.trim() || null,
      };

      if (tipo === "ENTRADA" && motivoCodigo === "COMPRA") {
        datosMovimiento.costo_unitario = Number(costoUnitario);
        datosMovimiento.proveedor_id = Number(proveedorId);
      }

      const respuesta =
        tipo === "ENTRADA"
          ? await registrarEntrada(datosMovimiento, claveIdempotencia)
          : await registrarSalida(datosMovimiento, claveIdempotencia);

      try {
        const respuestaProductos = await listarProductos();

        setProductos(
          Array.isArray(respuestaProductos)
            ? respuestaProductos
            : respuestaProductos.items ?? [],
        );
      } catch (errorActualizacion) {
        console.error("No se pudo actualizar la lista de productos:", errorActualizacion);
      }

      const saldoResultante = Number(
        respuesta.saldo ?? respuesta.movimiento?.saldo_resultante,
      );

      if (saldoResultante <= 0) {
        setMensaje(
          "¡Movimiento registrado! Atención: el producto se quedó sin stock.",
        );
      } else if (respuesta.estado === "BAJO_STOCK") {
        setMensaje(
          "¡Movimiento registrado! Atención: el producto quedó con stock bajo.",
        );
      } else {
        setMensaje("¡Movimiento registrado correctamente!");
      }

      setProductoId("");
      setMotivoCodigo("");
      setCantidad("");
      setCostoUnitario("");
      setProveedorId("");
      setObservacion("");
      setClaveIdempotencia(nuevaClaveIdempotencia());
      setFormularioAbierto(false);
    } catch (error) {
      console.error("Error al registrar el movimiento:", error);

      if (error.code === "STOCK_INSUFICIENTE") {
        setError("No hay suficiente stock para realizar esta salida.");
      } else if (error.code === "PRODUCTO_DESCONTINUADO") {
        setError("No puedes registrar movimientos de un producto descontinuado.");
      } else {
        setError(error.detail || "No fue posible registrar el movimiento.");
      }
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (error && alertaErrorRef.current) {
      alertaErrorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [error]);

  const claseEtiqueta = "mb-2 block text-sm font-semibold text-marca-texto";
  const claseObligatorio = "ml-1 font-bold text-marca-primario";

  return (
    <section>
      {/* Encabezado de la sección */}
      <div className="flex items-center gap-4">
        {/* Ícono de movimientos */}
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
            <path d="m16 3 4 4-4 4" />
            <path d="M20 7H4" />
            <path d="m8 21-4-4 4-4" />
            <path d="M4 17h16" />
          </svg>
        </div>

        {/* Nombre y descripción */}
        <div className="flex flex-1 flex-col gap-2">
          <div>
            <p className="font-heading text-xs font-bold tracking-[0.25em] text-marca-primario">
              NAILSPA
            </p>

            <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-marca-primario-hover">
              Movimientos
            </h2>

            <p className="mt-1 text-sm text-marca-texto">
              Registra entradas y salidas de productos del inventario.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {puedeRegistrarEntrada && (
          <Button
            variant={
              formularioAbierto && tipo === "ENTRADA"
                ? "primary"
                : "secondary"
            }
            onClick={() => iniciarMovimiento("ENTRADA")}
          >
            Registrar entrada
          </Button>
        )}

        {puedeRegistrarSalida && (
          <Button
            variant={
              formularioAbierto && tipo === "SALIDA"
                ? "primary"
                : "secondary"
            }
            onClick={() => iniciarMovimiento("SALIDA")}
          >
            Registrar salida
          </Button>
        )}
      </div>

      {formularioAbierto && (
        <div className="mt-6 rounded-2xl border border-marca-acento bg-marca-superficie/80 p-6 shadow-lg">
          <h3 className="mb-6 border-b border-marca-borde pb-4 font-heading text-xl font-bold text-marca-primario-hover">
            Registrar {tipo === "ENTRADA" ? "entrada" : "salida"}
          </h3>

          <p className="mb-5 text-xs text-marca-texto">
            Los campos marcados con <span className="font-bold text-marca-primario">*</span> son obligatorios.
          </p>

          {cargando ? (
            <p className="text-marca-texto">Cargando información...</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="producto" className={claseEtiqueta}>
                  Producto
                  <span className={claseObligatorio} aria-hidden="true">*</span>
                </label>

                <select
                  id="producto"
                  value={productoId}
                  onChange={(e) => setProductoId(e.target.value)}
                  className="w-full rounded-lg border border-marca-acento bg-marca-superficie px-4 py-3 text-sm text-marca-texto shadow-sm outline-none transition-all duration-200 focus:border-marca-primario focus:ring-2 focus:ring-marca-primario/20"
                >
                  <option value="">Selecciona un producto</option>

                  {productos
                    .filter((producto) => producto.estado !== "DESCONTINUADO")
                    .map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.codigo} - {producto.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label htmlFor="motivo" className={claseEtiqueta}>
                  Motivo del movimiento
                  <span className={claseObligatorio} aria-hidden="true">*</span>
                </label>

                <select
                  id="motivo"
                  value={motivoCodigo}
                  onChange={(e) => setMotivoCodigo(e.target.value)}
                  className="w-full rounded-lg border border-marca-acento bg-marca-superficie px-4 py-3 text-sm text-marca-texto shadow-sm outline-none transition-all duration-200 focus:border-marca-primario focus:ring-2 focus:ring-marca-primario/20"
                >
                  <option value="">Selecciona un motivo</option>

                  {motivos.map((motivo) => (
                    <option key={motivo.codigo} value={motivo.codigo}>
                      {motivo.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="cantidad" className={claseEtiqueta}>
                  Cantidad
                  <span className={claseObligatorio} aria-hidden="true">*</span>
                </label>

                <input
                  id="cantidad"
                  type="number"
                  min="0.001"
                  step="0.001"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ej. 10"
                  className="w-full rounded-lg border border-marca-acento bg-marca-superficie px-4 py-3 text-sm text-marca-texto shadow-sm outline-none transition-all duration-200 focus:border-marca-primario focus:ring-2 focus:ring-marca-primario/20"
                />
              </div>

              {tipo === "ENTRADA" && motivoCodigo === "COMPRA" && (
                <div>
                  <label htmlFor="costo-unitario" className={claseEtiqueta}>
                    Costo unitario
                    <span className={claseObligatorio} aria-hidden="true">*</span>
                  </label>

                  <input
                    id="costo-unitario"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    value={costoUnitario}
                    onChange={(e) => setCostoUnitario(e.target.value)}
                    placeholder="Ej. 38000"
                    className="w-full rounded-lg border border-marca-acento bg-marca-superficie px-4 py-3 text-sm text-marca-texto shadow-sm outline-none transition-all duration-200 focus:border-marca-primario focus:ring-2 focus:ring-marca-primario/20"
                  />
                </div>
              )}

              {tipo === "ENTRADA" && motivoCodigo === "COMPRA" && (
                <div>
                  <label htmlFor="proveedor" className={claseEtiqueta}>
                    Proveedor
                    <span className={claseObligatorio} aria-hidden="true">*</span>
                  </label>

                  <select
                    id="proveedor"
                    value={proveedorId}
                    onChange={(e) => setProveedorId(e.target.value)}
                    className="w-full rounded-lg border border-marca-acento bg-marca-superficie px-4 py-3 text-sm text-marca-texto shadow-sm outline-none transition-all duration-200 focus:border-marca-primario focus:ring-2 focus:ring-marca-primario/20"
                  >
                    <option value="">Selecciona un proveedor</option>

                    {proveedores.map((proveedor) => (
                      <option key={proveedor.id} value={proveedor.id}>
                        {proveedor.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="md:col-span-2">
                <label
                  htmlFor="observacion"
                  className="mb-2 block text-sm font-medium text-marca-texto"
                >
                  Observaciones <span className="font-normal text-marca-texto">(opcional)</span>
                </label>

                <textarea
                  id="observacion"
                  rows="3"
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                  placeholder="Agrega información adicional sobre el movimiento..."
                  className="w-full rounded-lg border border-marca-acento bg-marca-superficie px-4 py-3 text-sm text-marca-texto shadow-sm outline-none transition-all duration-200 focus:border-marca-primario focus:ring-2 focus:ring-marca-primario/20"
                />
              </div>
            </div>
          )}

          {error && (
            <div
              ref={alertaErrorRef}
              role="alert"
              className="mt-4 rounded-lg border border-marca-error-borde bg-marca-error-fondo p-3 text-sm text-marca-error"
            >
              {error}
            </div>

          )}

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setFormularioAbierto(false);
                setError("");
                setMensaje("");
              }}
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              onClick={manejarRegistro}
              disabled={cargando}
            >
              {cargando ? "Registrando..." : "Registrar movimiento"}
            </Button>
          </div>
        </div>
      )
      }

      {
        mensaje && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-marca-exito-borde bg-marca-exito-fondo p-3 text-sm text-marca-exito"
          >
            {mensaje}
          </div>
        )
      }

    </section >
  );
}
