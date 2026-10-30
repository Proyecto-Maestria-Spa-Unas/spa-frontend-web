/**
 * HU-03, HU-04, HU-02, HU-05, HU-12 · Inventario
 * Responsable: Gleidy725 · API: src/api/catalogo.js
 * Endpoints: GET /productos, /categorias, /unidades-medida; POST /productos; PATCH /productos/{id}
 * Ver README.md de esta carpeta para el alcance y los criterios.
 */

import { useEffect, useState } from "react";
import { EstadoBadge } from "../../design-system/componentes/EstadoBadge";
import {
  listarCategorias,
  listarProductos,
} from "../../api/catalogo";
export function InventarioPage() {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    async function cargarProductos() {
      try {
        setCargandoProductos(true);
        setErrorProductos(null);

        const respuesta = await listarProductos({
          q: busqueda,
          categoria_id: categoriaSeleccionada || undefined,
          estado: estadoSeleccionado || undefined,
          incluir_descontinuados: incluirDescontinuados,
          page: pagina,
          size: tamanoPagina,
        });

        setProductos(respuesta.items);
        setTotalProductos(respuesta.total);

      } catch (err) {
        setErrorProductos(
          err.message || "No fue posible cargar los productos."
        );
      } finally {
        setCargandoProductos(false);
      }
    }

    cargarProductos();
  }, [
    busqueda,
    categoriaSeleccionada,
    estadoSeleccionado,
    incluirDescontinuados,
    pagina,
  ]);

  return (
    <section className="space-y-6">
      {/* Encabezado de la sección */}
      <div className="flex items-center gap-4">
        {/* Espacio reservado para el logo */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-pink-200 bg-pink-50">
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
        <div>
          <p className="font-heading text-xs font-bold tracking-[0.25em] text-marca-primario">
            NAILSPA
          </p>

          <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-[#75445B]">
            Inventario de productos
          </h2>

          <p className="mt-1 text-sm text-marca-texto">
            Consulta y administra los productos registrados en tu inventario.
          </p>
        </div>
      </div>

      {/* Filtros del inventario */}
      <section className="mb-6 rounded-xl border border-marca-borde bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-heading text-lg font-semibold text-[#75445B]">
          Filtros del inventario
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="busqueda-productos"
              className="mb-1 block text-sm font-medium text-marca-texto"
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
              className="w-full rounded-lg border border-marca-borde px-4 py-2 text-sm outline-none focus:border-marca-primario focus:ring-2 focus:ring-[#FCEAF1]"
            />
          </div>

          <div>
            <label
              htmlFor="filtro-categoria"
              className="mb-1 block text-sm font-medium text-marca-texto"
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
              className="w-full rounded-lg border border-marca-borde bg-white px-4 py-2 text-sm outline-none focus:border-marca-primario focus:ring-2 focus:ring-[#FCEAF1]"
            >
              <option value="">Todas las categorías</option>
              {categoriasActivas.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="filtro-estado"
              className="mb-1 block text-sm font-medium text-marca-texto"
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
              className="w-full rounded-lg border border-marca-borde bg-white px-4 py-2 text-sm outline-none focus:border-marca-primario focus:ring-2 focus:ring-[#FCEAF1]"
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
            className="h-4 w-4 accent-[#C77D9F]"
          />

          <label
            htmlFor="incluir-descontinuados"
            className="text-sm text-marca-texto"
          >
            Incluir productos descontinuados
          </label>
        </div>
      </section>

      <div className="w-full overflow-x-auto rounded-xl border border-marca-borde bg-marca-superficie shadow-sm">
        <table className="w-full min-w-[850px] text-left text-sm">

          <thead className="bg-[#FCEAF1] font-heading text-xs uppercase tracking-wider text-[#75445B]">
            <tr>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Código</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Producto</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Categoría</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Stock actual</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Stock mínimo</th>
              <th className="whitespace-nowrap px-5 py-4 font-semibold">Estado</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-marca-borde">
            {cargandoProductos ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-marca-texto">
                  Cargando productos...
                </td>
              </tr>
            ) : errorProductos ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-red-600">
                  {errorProductos}
                </td>
              </tr>
            ) : productos.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-4 py-8 text-center text-marca-texto">
                  No se encontraron productos.
                </td>
              </tr>
            ) : (
              productos.map((producto) => (
                <tr
                  key={producto.id}
                  className="transition-colors duration-200 hover:bg-[#FFFAFC]"
                >
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-[#555555]">{producto.codigo}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-[#75445B]">
                    {producto.nombre}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-[#555555]">
                    {obtenerNombreCategoria(producto.categoria_id)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-[#555555]">{producto.stock_actual}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-[#555555]">
                    {producto.stock_minimo ?? "No definido"}
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-sm text-[#555555]">
                    <EstadoBadge estado={producto.estado} />
                  </td>
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
              className="rounded-lg border border-marca-borde bg-white px-4 py-2 text-sm font-semibold text-[#75445B] transition hover:border-marca-primario hover:bg-[#FCEAF1] disabled:cursor-not-allowed disabled:opacity-40"
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
