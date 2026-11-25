/**
 * HU-03, HU-04, HU-02, HU-05, HU-12 · Inventario
 * Responsable: Gleidy725 · API: src/api/catalogo.js
 * Endpoints: GET /productos, /categorias, /unidades-medida; POST /productos; PATCH /productos/{id}
 * Ver README.md de esta carpeta para el alcance y los criterios.
 */

import { useCallback, useEffect, useState } from "react";
import { Button } from "../../design-system/componentes/Button";
import { Modal } from "../../design-system/componentes/Modal";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import { EstadoBadge } from "../../design-system/componentes/EstadoBadge";
import {
  listarCategorias,
  listarProductos,
  listarUnidades,
  crearProducto,
  actualizarProducto,
  obtenerProducto,
  configurarStockMinimo,
  descontinuarProducto,
  reactivarProducto,
} from "../../api/catalogo";

const formatearCantidad = (valor) => {
  if (valor === null || valor === undefined) {
    return "No definido";
  }

  return Number(valor).toLocaleString("es-CO", {
    maximumFractionDigits: 3,
  });
};
export function InventarioPage() {
  const { tiene } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados de las unidades de medida
  const [unidades, setUnidades] = useState([]);
  const [cargandoUnidades, setCargandoUnidades] = useState(true);
  const [errorUnidades, setErrorUnidades] = useState(null);

  // Estados del formulario de creación y edición
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [erroresFormulario, setErroresFormulario] = useState({});
  const [errorFormulario, setErrorFormulario] = useState("");
  const [hayConflictoVersion, setHayConflictoVersion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [productoEnEdicion, setProductoEnEdicion] = useState(null);

  const [formulario, setFormulario] = useState({
    codigo: "",
    nombre: "",
    descripcion: "",
    categoria_id: "",
    unidad_medida_id: "",
    cantidad_inicial: "",
    stock_minimo: "",
  });

  // Actualizar los valores del formulario
  const manejarCambioFormulario = (evento) => {
    const { name, value } = evento.target;

    setFormulario((formularioAnterior) => ({
      ...formularioAnterior,
      [name]: value,
    }));

    // Limpiar el error del campo cuando el usuario lo modifica
    setErroresFormulario((erroresAnteriores) => ({
      ...erroresAnteriores,
      [name]: "",
    }));
  };

  // Limpiar y cerrar el formulario
  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setProductoEnEdicion(null);
    setHayConflictoVersion(false);

    setFormulario({
      codigo: "",
      nombre: "",
      descripcion: "",
      categoria_id: "",
      unidad_medida_id: "",
      cantidad_inicial: "",
      stock_minimo: "",
    });

    setErroresFormulario({});
  };

  const iniciarEdicion = async (producto) => {
    setErrorFormulario("");
    setErroresFormulario({});
    setMensajeExito("");
    setHayConflictoVersion(false);

    try {
      const productoCompleto = await obtenerProducto(producto.id);

      setProductoEnEdicion(productoCompleto);

      setFormulario({
        codigo: productoCompleto.codigo ?? "",
        nombre: productoCompleto.nombre ?? "",
        descripcion: productoCompleto.descripcion ?? "",
        categoria_id: String(productoCompleto.categoria_id ?? ""),
        unidad_medida_id: String(productoCompleto.unidad_medida_id ?? ""),
        cantidad_inicial: "",
        stock_minimo: productoCompleto.stock_minimo == null
          ? ""
          : String(Number(productoCompleto.stock_minimo)),
      });

      setMostrarFormulario(true);
    } catch (error) {
      setError(error.message || "No fue posible cargar el producto.");
    }
  };

  const recargarProductoEnEdicion = async () => {
    try {
      const productoActualizado = await obtenerProducto(
        productoEnEdicion.id
      );

      setProductoEnEdicion(productoActualizado);

      setFormulario({
        codigo: productoActualizado.codigo ?? "",
        nombre: productoActualizado.nombre ?? "",
        descripcion: productoActualizado.descripcion ?? "",
        categoria_id: String(productoActualizado.categoria_id ?? ""),
        unidad_medida_id: String(productoActualizado.unidad_medida_id ?? ""),
        cantidad_inicial: "",
        stock_minimo: productoActualizado.stock_minimo == null
          ? ""
          : String(Number(productoActualizado.stock_minimo)),
      });

      setErroresFormulario({});
      setErrorFormulario("");
      setHayConflictoVersion(false);
    } catch (error) {
      setErrorFormulario(
        error.message || "No fue posible recargar el producto."
      );
    }
  };

  const manejarCambioEstado = async (producto, accion) => {
    const esDescontinuar = accion === "descontinuar";

    const confirmar = window.confirm(
      esDescontinuar
        ? `¿Deseas descontinuar el producto "${producto.nombre}"?`
        : `¿Deseas reactivar el producto "${producto.nombre}"?`
    );

    if (!confirmar) return;

    try {
      if (esDescontinuar) {
        await descontinuarProducto(producto.id);
      } else {
        await reactivarProducto(producto.id);
      }

      const respuesta = await cargarProductos();

      setProductos(respuesta.items);
      setTotalProductos(respuesta.total);
      setErrorProductos(null);

      setMensajeExito(
        esDescontinuar
          ? "Producto descontinuado correctamente."
          : "Producto reactivado correctamente."
      );
    } catch (error) {
      setErrorProductos(
        error.message || "No fue posible actualizar el estado del producto."
      );
    }
  };

  // Evitar que el formulario recargue la página
  const manejarEnvioFormulario = async (evento) => {
    evento.preventDefault();

    const nuevosErrores = {};

    if (!formulario.codigo.trim()) {
      nuevosErrores.codigo = "El código es obligatorio";
    }

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = "El nombre es obligatorio";
    }

    if (!formulario.categoria_id) {
      nuevosErrores.categoria_id = "Selecciona una categoría";
    }

    if (!formulario.unidad_medida_id) {
      nuevosErrores.unidad_medida_id = "Selecciona una unidad de medida";
    }

    setErroresFormulario(nuevosErrores);
    setErrorFormulario("");

    if (Object.keys(nuevosErrores).length > 0) {
      setErrorFormulario(
        "Revisa los campos del formulario e intenta nuevamente."
      );
      return;
    }

    const producto = {
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() || null,
      categoria_id: Number(formulario.categoria_id),
      unidad_medida_id: Number(formulario.unidad_medida_id),
    };

    if (!productoEnEdicion) {
      producto.codigo = formulario.codigo.trim();
    }
    if (!productoEnEdicion) {
      producto.cantidad_inicial = formulario.cantidad_inicial
        ? Number(formulario.cantidad_inicial)
        : null;

      producto.stock_minimo = formulario.stock_minimo
        ? Number(formulario.stock_minimo)
        : null;
    }

    setGuardando(true);

    try {
      if (productoEnEdicion) {
        await actualizarProducto(
          productoEnEdicion.id,
          producto,
          productoEnEdicion.version
        );

        const stockMinimoAnterior = productoEnEdicion.stock_minimo;
        const stockMinimoNuevo = formulario.stock_minimo === ""
          ? null
          : Number(formulario.stock_minimo);

        if (
          tiene("producto.configurar_minimo") &&
          stockMinimoNuevo !== stockMinimoAnterior
        ) {
          await configurarStockMinimo(productoEnEdicion.id, stockMinimoNuevo);
        }
      } else {
        await crearProducto(producto);
      }

      const respuesta = await cargarProductos();

      setErrorProductos(null);
      setProductos(respuesta.items);
      setTotalProductos(respuesta.total);

      setMensajeExito(
        productoEnEdicion
          ? "¡Producto actualizado correctamente!"
          : "¡Producto registrado correctamente! El producto se ha agregado al inventario."
      );

      cerrarFormulario();
    } catch (error) {
      if (error.code === "CODIGO_DUPLICADO") {
        setErrorFormulario(
          "Este código ya está registrado. Ingresa uno diferente."
        );
      } else if (error.code === "DATOS_INVALIDOS") {
        const erroresCampos = {};

        error.errors?.forEach(({ campo, mensaje }) => {
          erroresCampos[campo] = mensaje;
        });

        setErroresFormulario(erroresCampos);
        setErrorFormulario(
          "Revisa los campos del formulario e intenta nuevamente."
        );
      } else if (error.code === "VERSION_CONFLICTO") {
        setHayConflictoVersion(true);
        setErrorFormulario(
          "Este producto fue modificado por otra persona. Recarga la información para continuar."
        );
      } else {
        setErrorFormulario(
          error.message || "No fue posible guardar el producto."
        );
      }

    } finally {
      setGuardando(false);
    }
  };
  // Estados de los productos
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState(null);

  // Estados de los filtros
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const [incluirDescontinuados, setIncluirDescontinuados] = useState(false);

  // Paginación
  const [pagina, setPagina] = useState(1);
  const [totalProductos, setTotalProductos] = useState(0);
  const tamanoPagina = 10;
  const totalPaginas = Math.ceil(totalProductos / tamanoPagina);
  const categoriasActivas = [...categorias]
    .filter((categoria) => categoria.activa)
    .sort((a, b) => a.orden - b.orden);
  // Obtener el nombre de la categoría de cada producto
  const obtenerNombreCategoria = (categoriaId) => {
    return categorias.find((categoria) => categoria.id === categoriaId)?.nombre ?? "Sin categoría";
  };

  useEffect(() => {
    async function cargarCategorias() {
      try {
        setCargando(true);
        setError(null);

        const respuesta = await listarCategorias();

        setCategorias(respuesta);
      } catch (err) {
        setError(err.message || "No fue posible cargar las categorías.");
      } finally {
        setCargando(false);
      }
    }

    cargarCategorias();
  }, []);

  // Cargar unidades de medida
  useEffect(() => {
    const cargarUnidades = async () => {
      try {
        setCargandoUnidades(true);
        setErrorUnidades(null);

        const respuesta = await listarUnidades();
        setUnidades(respuesta);
      } catch (err) {
        setErrorUnidades(err.message || "No fue posible cargar las unidades.");
      } finally {
        setCargandoUnidades(false);
      }
    };

    cargarUnidades();
  }, []);

  const cargarProductos = useCallback(async () => {
    const respuesta = await listarProductos({
      q: busqueda,
      categoria_id: categoriaSeleccionada || undefined,
      estado: estadoSeleccionado || undefined,
      incluir_descontinuados: incluirDescontinuados,
      page: pagina,
      size: tamanoPagina,
    });

    return respuesta;
  }, [
    busqueda,
    categoriaSeleccionada,
    estadoSeleccionado,
    incluirDescontinuados,
    pagina,
    tamanoPagina,
  ]);

  useEffect(() => {
    let activo = true;

    async function obtenerProductos() {
      try {
        const respuesta = await cargarProductos();
        if (!activo) return;
        setErrorProductos(null);
        setProductos(respuesta.items);
        setTotalProductos(respuesta.total);
      } catch (err) {
        if (!activo) return;

        setErrorProductos(
          err.message || "No fue posible cargar los productos."
        );
      } finally {
        if (activo) {
          setCargandoProductos(false);
        }
      }
    }

    obtenerProductos();

    return () => {
      activo = false;
    };
  }, [cargarProductos]);

  useEffect(() => {
    if (!mensajeExito) return;

    const temporizador = setTimeout(() => {
      setMensajeExito("");
    }, 3000);

    return () => clearTimeout(temporizador);
  }, [mensajeExito]);

  return (
    <section className="space-y-6">
      {mensajeExito && (
        <div
          role="status"
          aria-live="polite"
          className="mb-5 flex items-center gap-3 rounded-lg border border-estado-disponible-texto bg-estado-disponible-fondo p-4 text-sm text-estado-disponible-texto"
        >
          <span className="font-semibold">{mensajeExito}</span>
        </div>
      )}
      {/* Encabezado de la sección */}
      <div className="flex items-center gap-4">
        {/* Espacio reservado para el logo */}
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
            <path d="M6 7h12l1 14H5L6 7Z" />
            <path d="M9 7V5a3 3 0 0 1 6 0v2" />
            <path d="M9 12h6" />
          </svg>
        </div>

        {/* Nombre y descripción */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-xs font-bold tracking-[0.25em] text-marca-primario-hover">
              NAILSSPA
            </p>

            <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-marca-primario-hover">
              Inventario
            </h2>

            <p className="mt-1 text-sm text-marca-texto">
              Consulta y administra los productos registrados en tu inventario.
            </p>
          </div>

          {tiene("producto.crear") && (
            <Button onClick={() => setMostrarFormulario(true)}>
              + Crear producto
            </Button>
          )}
        </div>
      </div>


      <Modal
        open={mostrarFormulario}
        onClose={cerrarFormulario}
        title={productoEnEdicion ? "Editar producto" : "Crear producto"}
        className="flex max-h-[90vh] max-w-3xl flex-col overflow-hidden"
        footer={
          <div className="w-full">
            {errorFormulario && (
              <div
                role="alert"
                className="mb-4 flex items-start gap-2 rounded-lg border border-estado-agotado-texto bg-estado-agotado-fondo p-3 text-sm text-estado-agotado-texto"
              >
                <strong>Error:</strong>
                <span>{errorFormulario}</span>
                {hayConflictoVersion && productoEnEdicion && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={recargarProductoEnEdicion}
                  >
                    Recargar producto
                  </Button>
                )}
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={cerrarFormulario}
                disabled={guardando}
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                form="formulario-producto"
                disabled={guardando}
              >
                {guardando ? "Guardando..." : "Guardar producto"}
              </Button>
            </div>
          </div>
        }
      >
        <form
          id="formulario-producto"
          onSubmit={manejarEnvioFormulario}
          className="space-y-7"
        >

          <p className="mb-6 text-sm text-marca-texto">
            {productoEnEdicion
              ? "Actualiza la información del producto seleccionado."
              : "Registra un nuevo producto en el inventario."}
          </p>

          <div className="space-y-7">

            {/* Información general */}
            <div>
              <h4 className="mb-4 text-base font-semibold text-marca-texto-principal">
                Información general
              </h4>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label htmlFor="codigo" className="mb-1 block text-sm font-medium text-marca-texto-etiqueta">
                    Código *
                  </label>
                  <input
                    id="codigo"
                    name="codigo"
                    type="text"
                    maxLength={40}
                    value={formulario.codigo}
                    onChange={manejarCambioFormulario}
                    readOnly={Boolean(productoEnEdicion)}
                    placeholder="Ej. ESM-001"
                    className={`w-full rounded-lg border border-marca-borde-fuerte ${productoEnEdicion ? "bg-marca-superficie-deshabilitada cursor-not-allowed text-marca-texto-secundario" : "bg-white text-marca-texto-principal"} px-3 py-2 text-sm placeholder:text-marca-texto-placeholder focus:border-marca-primario-hover focus:outline-none focus:ring-2 focus:ring-marca-enfoque`}
                  />
                  {erroresFormulario.codigo && (
                    <p className="mt-1 text-sm text-estado-agotado-texto">
                      {erroresFormulario.codigo}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-marca-texto-etiqueta">
                    Nombre *
                  </label>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    maxLength={120}
                    value={formulario.nombre}
                    onChange={manejarCambioFormulario}
                    placeholder="Ej. Esmalte rojo"
                    className="w-full rounded-lg border border-marca-borde-fuerte bg-white px-3 py-2 text-sm text-marca-texto-principal placeholder:text-marca-texto-placeholder focus:border-marca-primario-hover focus:outline-none focus:ring-2 focus:ring-marca-enfoque"
                  />

                  {erroresFormulario.nombre && (
                    <p className="mt-1 text-sm text-estado-agotado-texto">
                      {erroresFormulario.nombre}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-marca-texto-etiqueta">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    name="descripcion"
                    rows={3}
                    value={formulario.descripcion}
                    onChange={manejarCambioFormulario}
                    placeholder="Describe brevemente el producto..."
                    className="w-full rounded-lg border border-marca-borde px-4 py-2 text-sm outline-none focus:border-marca-primario"
                  />
                  {erroresFormulario.descripcion && (
                    <p className="mt-1 text-sm text-estado-agotado-texto">
                      {erroresFormulario.descripcion}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Clasificación */}
            <div>
              <h4 className="mb-4 text-base font-semibold text-marca-texto-principal">
                Clasificación del producto
              </h4>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                <div>
                  <label htmlFor="categoria_id" className="mb-1 block text-sm font-medium text-marca-texto-etiqueta">
                    Categoría *
                  </label>
                  <select
                    id="categoria_id"
                    name="categoria_id"
                    value={formulario.categoria_id}
                    onChange={manejarCambioFormulario}
                    disabled={cargando || Boolean(error)}
                    className="w-full rounded-lg border border-marca-borde bg-white px-4 py-2 text-sm outline-none focus:border-marca-primario disabled:opacity-50"
                  >
                    <option value="">Selecciona una categoría</option>
                    {categoriasActivas.map((categoria) => (
                      <option key={categoria.id} value={categoria.id}>
                        {categoria.nombre}
                      </option>
                    ))}
                  </select>
                  {erroresFormulario.categoria_id && (
                    <p className="mt-1 text-sm text-estado-agotado-texto">
                      {erroresFormulario.categoria_id}
                    </p>
                  )}

                  {cargando && (
                    <p className="mt-1 text-xs text-marca-texto">
                      Cargando categorías...
                    </p>
                  )}
                  {error && (
                    <p className="mt-1 text-xs text-marca-error">
                      No fue posible cargar las categorías.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="unidad_medida_id" className="mb-1 block text-sm font-medium text-marca-texto-etiqueta">
                    Unidad de medida *
                  </label>
                  <select
                    id="unidad_medida_id"
                    name="unidad_medida_id"
                    value={formulario.unidad_medida_id}
                    onChange={manejarCambioFormulario}
                    disabled={cargandoUnidades || Boolean(errorUnidades)}
                    className="w-full rounded-lg border border-marca-borde bg-white px-4 py-2 text-sm outline-none focus:border-marca-primario disabled:opacity-50"
                  >
                    <option value="">Selecciona una unidad</option>
                    {unidades.map((unidad) => (
                      <option key={unidad.id} value={unidad.id}>
                        {unidad.nombre} ({unidad.codigo})
                      </option>
                    ))}
                  </select>
                  {erroresFormulario.unidad_medida_id && (
                    <p className="mt-1 text-sm text-estado-agotado-texto">
                      {erroresFormulario.unidad_medida_id}
                    </p>
                  )}

                  {cargandoUnidades && (
                    <p className="mt-1 text-xs text-marca-texto">
                      Cargando unidades...
                    </p>
                  )}
                  {errorUnidades && (
                    <p className="mt-1 text-xs text-marca-error">
                      No fue posible cargar las unidades.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Configuración del inventario */}
            <div>
              <h4 className="mb-4 text-base font-semibold text-marca-texto-principal">
                Configuración del inventario
              </h4>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {!productoEnEdicion && (
                  <div>
                    <label htmlFor="cantidad_inicial" className="mb-1 block text-sm font-medium text-marca-texto-etiqueta">
                      Cantidad inicial
                    </label>
                    <input
                      id="cantidad_inicial"
                      name="cantidad_inicial"
                      type="number"
                      min="0"
                      step="any"
                      value={formulario.cantidad_inicial}
                      onChange={manejarCambioFormulario}
                      placeholder="Ej. 24"
                      className="w-full rounded-lg border border-marca-borde-fuerte bg-white px-3 py-2 text-sm text-marca-texto-principal placeholder:text-marca-texto-placeholder focus:border-marca-primario-hover focus:outline-none focus:ring-2 focus:ring-marca-enfoque"
                    />

                    {erroresFormulario.cantidad_inicial && (
                      <p className="mt-1 text-sm text-estado-agotado-texto">
                        {erroresFormulario.cantidad_inicial}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-marca-texto">
                      Se registrará como saldo inicial.
                    </p>
                  </div>
                )}

                {(!productoEnEdicion || tiene("producto.configurar_minimo")) && (
                  <div>
                    <label htmlFor="stock_minimo" className="mb-1 block text-sm font-medium text-marca-texto-etiqueta">
                      Stock mínimo
                    </label>
                    <input
                      id="stock_minimo"
                      name="stock_minimo"
                      type="number"
                      min="0"
                      step="any"
                      value={formulario.stock_minimo}
                      onChange={manejarCambioFormulario}
                      placeholder="Ej. 5"
                      className="w-full rounded-lg border border-marca-borde-fuerte bg-white px-3 py-2 text-sm text-marca-texto-principal placeholder:text-marca-texto-placeholder focus:border-marca-primario-hover focus:outline-none focus:ring-2 focus:ring-marca-enfoque"
                    />

                    {erroresFormulario.stock_minimo && (
                      <p className="mt-1 text-sm text-estado-agotado-texto">
                        {erroresFormulario.stock_minimo}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-marca-texto">
                      Cantidad mínima antes de generar una alerta.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </form>
      </Modal>

      {/* Filtros del inventario */}
      <section className="mb-6 rounded-xl border border-marca-borde bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-lg font-semibold text-marca-primario-hover">
          Filtros del inventario
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="busqueda-productos"
              className="mb-1 block text-sm font-medium text-marca-texto-etiqueta"
            >
              Buscar
            </label>

            <input
              id="busqueda-productos"
              type="search"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                setPagina(1);
              }}
              placeholder="Nombre o código..."
              className="w-full rounded-lg border border-marca-borde-fuerte bg-white px-3 py-2 text-sm text-marca-texto-principal placeholder:text-marca-texto-placeholder focus:border-marca-primario-hover focus:outline-none focus:ring-2 focus:ring-marca-enfoque"
            />
          </div>

          <div>
            <label
              htmlFor="filtro-categoria"
              className="mb-1 block text-sm font-medium text-marca-texto-etiqueta"
            >
              Categoría
            </label>

            <select
              id="filtro-categoria"
              value={categoriaSeleccionada}
              onChange={(e) => {
                setCategoriaSeleccionada(e.target.value);
                setPagina(1);
              }}
              className="w-full rounded-lg border border-marca-borde bg-white px-4 py-2 text-sm outline-none focus:border-marca-primario focus:ring-2 focus:ring-marca-enfoque"
            >
              <option value="">Todas las categorías</option>

              {cargando ? (
                <option value="" disabled>
                  Cargando categorías...
                </option>
              ) : error ? (
                <option value="" disabled>
                  Error al cargar categorías
                </option>
              ) : (
                categoriasActivas.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-estado"
              className="mb-1 block text-sm font-medium text-marca-texto-etiqueta"
            >
              Estado
            </label>

            <select
              id="filtro-estado"
              value={estadoSeleccionado}
              onChange={(e) => {
                setEstadoSeleccionado(e.target.value);
                setPagina(1);
              }}
              className="w-full rounded-lg border border-marca-borde bg-white px-4 py-2 text-sm outline-none focus:border-marca-primario focus:ring-2 focus:ring-marca-enfoque"
            >
              <option value="">Todos los estados</option>
              <option value="DISPONIBLE">Disponible</option>
              <option value="BAJO_STOCK">Bajo stock</option>
              <option value="AGOTADO">Agotado</option>
              <option value="DESCONTINUADO">Descontinuado</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 border-t border-marca-borde pt-4">
          <input
            id="incluir-descontinuados"
            type="checkbox"
            checked={incluirDescontinuados}
            onChange={(e) => {
              setIncluirDescontinuados(e.target.checked);
              setPagina(1);
            }}
            className="h-4 w-4 accent-marca-primario"
          />

          <label
            htmlFor="incluir-descontinuados"
            className="text-sm text-marca-texto-secundario"
          >
            Incluir productos descontinuados
          </label>
        </div>
      </section>

      <div className="w-full overflow-x-auto rounded-xl border border-marca-borde bg-marca-superficie shadow-sm">
        <table className="w-full min-w-[850px] text-left text-sm">

          <thead className="bg-marca-enfoque font-heading text-xs uppercase tracking-wider text-marca-primario-hover">
            <tr>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Código</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Producto</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Categoría</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Stock actual</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Stock mínimo</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Estado</th>
              {(tiene("producto.editar") || tiene("producto.descontinuar")) && (
                <th className="whitespace-nowrap px-5 py-4 font-semibold">
                  Acciones
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-marca-borde">
            {cargandoProductos ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-marca-texto">
                  Cargando productos...
                </td>
              </tr>
            ) : errorProductos ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-marca-error">
                  {errorProductos}
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-marca-texto">
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              productos.map((producto) => (
                <tr
                  key={producto.id}
                  className="transition-colors duration-200 hover:bg-marca-superficie-hover"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-marca-texto-secundario">{producto.codigo}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-marca-primario-hover">
                    <Link
                      to={`/inventario/${producto.id}`}
                    className="rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marca-primario-hover focus-visible:ring-offset-2"
                    >
                      {producto.nombre}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-marca-texto-secundario">
                    {obtenerNombreCategoria(producto.categoria_id)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-marca-texto-secundario">{formatearCantidad(producto.stock_actual)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-marca-texto-secundario">
                    {formatearCantidad(producto.stock_minimo)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-marca-texto-secundario">
                    <EstadoBadge estado={producto.estado} />
                  </td>

                  {(tiene("producto.editar") || tiene("producto.descontinuar")) && (
                    <td className="whitespace-nowrap px-5 py-4">
                      <div className="flex items-center gap-2">
                        {tiene("producto.editar") && (
                          <Button
                            variant="secondary"
                            onClick={() => iniciarEdicion(producto)}
                          >
                            Editar
                          </Button>
                        )}

                        {tiene("producto.descontinuar") && (
                          <Button
                            variant="secondary"
                            onClick={() =>
                              manejarCambioEstado(
                                producto,
                                producto.descontinuado ? "reactivar" : "descontinuar"
                              )
                            }
                          >
                            {producto.descontinuado ? "Reactivar" : "Descontinuar"}
                          </Button>
                        )}
                      </div>
                    </td>
                  )}

                </tr>
              ))
            )}
          </tbody>



        </table>

      </div>
      {totalPaginas > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-marca-borde bg-white px-5 py-4 shadow-sm sm:flex-row">
          <p className="text-sm font-medium text-marca-texto">
            Página {pagina} de {totalPaginas}
            <span className="ml-2">
              ({totalProductos} productos)
            </span>
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPagina((actual) => actual - 1)}
              disabled={pagina === 1 || cargandoProductos}
              className="rounded-lg border border-marca-borde bg-white px-4 py-2 text-sm font-semibold text-marca-primario-hover transition hover:border-marca-primario hover:bg-marca-enfoque disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            <button
              type="button"
              onClick={() => setPagina((actual) => actual + 1)}
              disabled={pagina === totalPaginas || cargandoProductos}
              className="rounded-lg bg-marca-primario px-4 py-2 text-sm font-semibold text-white transition hover:bg-marca-primario-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </section>


  );

}
