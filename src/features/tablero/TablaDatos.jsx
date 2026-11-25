/** Tabla con los mismos datos que un gráfico (F15, criterio de accesibilidad). */

/** `columnas`: [{ titulo, numerica? }]; `filas`: arreglo de arreglos de texto con el mismo orden de columnas. */
export function TablaDatos({ descripcion, columnas, filas }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-marca-borde">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{descripcion}</caption>
        <thead className="bg-marca-enfoque font-heading text-xs uppercase tracking-wider text-marca-primario-hover">
          <tr>
            {columnas.map(({ titulo, numerica }) => (
              <th
                key={titulo}
                scope="col"
                className={`px-4 py-3 font-semibold ${numerica ? "text-right" : ""}`}
              >
                {titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-marca-borde">
          {filas.map((fila, i) => (
            <tr key={i} className="transition-colors duration-200 hover:bg-marca-superficie-hover">
              {fila.map((celda, j) => (
                <td key={j} className={`px-4 py-3 text-marca-texto-secundario ${columnas[j].numerica ? "text-right" : ""}`}>
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
