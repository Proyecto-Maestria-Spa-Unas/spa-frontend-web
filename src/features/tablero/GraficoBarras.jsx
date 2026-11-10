/** Gráfico de barras horizontales hecho con HTML y los colores del design system (F15). Sin librerías. */
import { porcentajeBarra } from "./indicadores";

/**
 * `filas`: [{ clave, etiqueta, detalle?, valor, texto, color? }]. Cada barra lleva su valor escrito, así que
 * el dato no depende del color. El gráfico se anuncia como imagen con un resumen; la tabla tiene los mismos datos.
 */
export function GraficoBarras({ descripcion, filas }) {
  const maximo = Math.max(0, ...filas.map((f) => f.valor));
  return (
    <div role="img" aria-label={descripcion} className="space-y-2">
      {filas.map((f) => (
        <div key={f.clave} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-2 text-sm sm:grid-cols-[minmax(0,11rem)_1fr_auto]">
          <span className="truncate" title={f.detalle ? `${f.etiqueta} (${f.detalle})` : f.etiqueta}>
            {f.etiqueta}
          </span>
          <span className="h-4 rounded bg-marca-fondo" aria-hidden="true">
            <span
              className={`block h-4 rounded ${f.color ?? "bg-marca-primario"}`}
              style={{ width: `${porcentajeBarra(f.valor, maximo)}%` }}
            />
          </span>
          <span className="min-w-14 text-right font-semibold">{f.texto}</span>
        </div>
      ))}
    </div>
  );
}
