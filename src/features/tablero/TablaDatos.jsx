/** Tabla con los mismos datos que un gráfico (F15, criterio de accesibilidad). */

/** `columnas`: [{ titulo, numerica? }]; `filas`: arreglo de arreglos de texto con el mismo orden de columnas. */
export function TablaDatos({ descripcion, columnas, filas }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{descripcion}</caption>
        <thead>
          <tr className="border-b border-marca-borde">
            {columnas.map(({ titulo, numerica }) => (
              <th
                key={titulo}
                scope="col"
                className={`px-3 py-2 font-heading text-[0.8125rem] font-semibold uppercase tracking-wide ${numerica ? "text-right" : ""}`}
              >
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i} className="border-b border-marca-borde last:border-0">
              {fila.map((celda, j) => (
                <td key={j} className={`px-3 py-2 ${columnas[j].numerica ? "text-right" : ""}`}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
