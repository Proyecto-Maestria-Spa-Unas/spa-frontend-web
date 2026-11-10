/**
 * HU-10, RF-19 · Tablero de decisiones con gráficos (F15)
 * API: GET /analitica/tablero, /analitica/consumo, /analitica/cobertura  (src/api/analitica.js)
 * Cada indicador carga por separado: si uno falla, los demás se siguen viendo. Todos tienen su tabla.
 */
import { useCallback, useState } from "react";
import { cobertura, consumo, tablero } from "../../api/analitica";
import { Card } from "../../design-system/componentes/Card";
import { Select } from "../../design-system/componentes/Select";
import { GraficoBarras } from "./GraficoBarras";
import { TablaDatos } from "./TablaDatos";
import { TarjetaGrafico } from "./TarjetaGrafico";
import { formatoCantidad } from "./formato";
import {
  AGRUPACIONES,
  DIAS_VENTANA,
  MAX_COBERTURA,
  filasCobertura,
  filasConsumo,
  filasEstados,
  filasRotacion,
  formatoDias,
  formatoValor,
  ordenarCobertura,
  rangoUltimos30Dias,
  resumenFilas,
  totalProductos,
} from "./indicadores";
import { useDatos } from "./useDatos";

function Cifra({ titulo, valor, detalle }) {
  return (
    <Card as="div" className="text-center">
      <p className="text-xs font-semibold uppercase tracking-wide">{titulo}</p>
      <p className="mt-1 font-heading text-2xl font-semibold text-marca-texto-principal">{valor}</p>
      {detalle && <p className="mt-1 text-xs">{detalle}</p>}
    </Card>
  );
}

function Indicadores({ resultado }) {
  const { estado, datos, error, reintentar } = resultado;
  const porEstado = datos?.productos_por_estado ?? {};
  const estados = filasEstados(porEstado);
  const rotacion = filasRotacion(datos?.top_rotacion);

  return (
    <>
      {estado === "listo" && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Cifra titulo="Valor del inventario" valor={formatoValor(datos.valor_inventario)} detalle="Stock × costo promedio" />
          <Cifra
            titulo={`Consumo de ${DIAS_VENTANA} días`}
            valor={formatoCantidad(datos.consumo_30_dias)}
            detalle="Unidades que salieron"
          />
          <Cifra titulo="Productos" valor={totalProductos(porEstado)} detalle="En el inventario" />
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TarjetaGrafico
          titulo="Productos por estado"
          estado={estado}
          error={error}
          onReintentar={reintentar}
          vacio={estados.length === 0 ? "Todavía no hay productos." : ""}
          grafico={<GraficoBarras descripcion={`Productos por estado: ${resumenFilas(estados)}`} filas={estados} />}
          tabla={
            <TablaDatos
              descripcion="Productos por estado"
              columnas={[{ titulo: "Estado" }, { titulo: "Productos", numerica: true }]}
              filas={estados.map((f) => [f.nombre, f.texto])}
            />
          }
        />

        <TarjetaGrafico
          titulo={`Top de rotación (${DIAS_VENTANA} días)`}
          estado={estado}
          error={error}
          onReintentar={reintentar}
          vacio={rotacion.length === 0 ? "No hubo salidas de productos en los últimos 30 días." : ""}
          grafico={<GraficoBarras descripcion={`Top de rotación: ${resumenFilas(rotacion)}`} filas={rotacion} />}
          tabla={
            <TablaDatos
              descripcion="Productos con más salidas en los últimos 30 días"
              columnas={[{ titulo: "Producto" }, { titulo: "Código" }, { titulo: "Consumo", numerica: true }]}
              filas={rotacion.map((f) => [f.nombre, f.detalle, f.texto])}
            />
          }
        />
      </div>
    </>
  );
}

function ConsumoAgrupado({ agrupacion }) {
  const cargar = useCallback(() => {
    const { desde, hasta } = rangoUltimos30Dias();
    return consumo(desde, hasta, agrupacion);
  }, [agrupacion]);
  const { estado, datos, error, reintentar } = useDatos(cargar);
  const filas = filasConsumo(datos ?? []);
  const columna = agrupacion === "producto" ? "Código de producto" : "Categoría";

  return (
    <TarjetaGrafico
      titulo={`Consumo de ${DIAS_VENTANA} días por ${agrupacion === "producto" ? "producto" : "categoría"}`}
      estado={estado}
      error={error}
      onReintentar={reintentar}
      vacio={filas.length === 0 ? "No hubo consumo en los últimos 30 días." : ""}
      grafico={<GraficoBarras descripcion={`Consumo por ${columna.toLowerCase()}: ${resumenFilas(filas)}`} filas={filas} />}
      tabla={
        <TablaDatos
          descripcion={`Consumo de los últimos 30 días por ${columna.toLowerCase()}`}
          columnas={[{ titulo: columna }, { titulo: "Consumo", numerica: true }]}
          filas={filas.map((f) => [f.nombre, f.texto])}
        />
      }
    />
  );
}

function Cobertura() {
  const { estado, datos, error, reintentar } = useDatos(cobertura);
  const todos = ordenarCobertura(datos ?? []);
  const filas = filasCobertura(datos ?? []);
  const sinConsumo = todos.length - todos.filter((c) => c.dias_cobertura !== null).length;
  const nota =
    todos.length > filas.length
      ? `El gráfico muestra los ${Math.min(MAX_COBERTURA, filas.length)} productos con menos cobertura. La tabla incluye los ${todos.length}` +
        (sinConsumo > 0 ? `; ${sinConsumo} sin consumo en ${DIAS_VENTANA} días.` : ".")
      : "";

  return (
    <TarjetaGrafico
      titulo="Cobertura estimada (días)"
      estado={estado}
      error={error}
      onReintentar={reintentar}
      vacio={todos.length === 0 ? "Todavía no hay productos para calcular la cobertura." : ""}
      grafico={
        filas.length > 0 ? (
          <GraficoBarras descripcion={`Cobertura en días: ${resumenFilas(filas)}`} filas={filas} />
        ) : (
          <p>Ningún producto tuvo consumo en los últimos 30 días, así que no hay cobertura para graficar.</p>
        )
      }
      tabla={
        <TablaDatos
          descripcion="Días de cobertura por producto, de menor a mayor"
          columnas={[
            { titulo: "Producto" },
            { titulo: "Stock actual", numerica: true },
            { titulo: "Consumo diario", numerica: true },
            { titulo: "Cobertura", numerica: true },
          ]}
          filas={todos.map((c) => [
            `${c.nombre} (${c.codigo})`,
            formatoCantidad(c.stock_actual),
            formatoCantidad(c.consumo_diario_promedio),
            formatoDias(c.dias_cobertura),
          ])}
        />
      }
      nota={nota}
    />
  );
}

/** Solo para quienes tienen `analitica.consultar` (lo decide TableroPage). */
export function TableroDecisiones() {
  const resultado = useDatos(tablero);
  const [agrupacion, setAgrupacion] = useState("categoria");

  return (
    <section aria-labelledby="tablero-decisiones" className="mt-6">
      <h3 id="tablero-decisiones" className="font-heading text-lg font-semibold text-marca-texto">
        Tablero de decisiones
      </h3>
      <p className="mb-4 text-sm text-marca-texto">Los últimos {DIAS_VENTANA} días, incluido hoy. Cada gráfico tiene su tabla con los mismos datos.</p>

      <Indicadores resultado={resultado} />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <Select
            label="Agrupar el consumo por"
            options={AGRUPACIONES}
            value={agrupacion}
            onChange={(e) => setAgrupacion(e.target.value)}
            className="mb-3 max-w-xs"
          />
          <ConsumoAgrupado key={agrupacion} agrupacion={agrupacion} />
        </div>
        <Cobertura />
      </div>
    </section>
  );
}
