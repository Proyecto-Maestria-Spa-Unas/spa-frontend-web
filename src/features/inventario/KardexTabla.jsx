import { formatoCantidad, formatoFecha, formatoPesos, nombreMotivo } from "./formato";

const COLUMNAS = [
  "Fecha",
  "Movimiento",
  "Cantidad",
  "Costo unitario",
  "Costo total",
  "Saldo",
  "Costo promedio",
  "Valor del saldo",
];

/**
 * X7 · Kardex valorizado por costo promedio ponderado (DEC-11, política de A3).
 * Las salidas se muestran valoradas al promedio vigente; el saldo y su valor quedan
 * después de cada movimiento.
 */
export function KardexTabla({ kardex }) {
  if (kardex.lineas.length === 0) {
    return <p className="text-sm text-marca-texto">No hay movimientos en el rango seleccionado.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <caption className="sr-only">Kardex valorizado de {kardex.nombre}</caption>
        <thead>
          <tr className="border-b border-marca-borde text-left">
            {COLUMNAS.map((c) => (
              <th key={c} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {kardex.lineas.map((l, i) => {
            const sale = l.tipo === "SALIDA";
            return (
              <tr key={`${l.ocurrido_en}-${i}`} className="border-b border-marca-borde/60">
                <td className="px-3 py-2 whitespace-nowrap">{formatoFecha(l.ocurrido_en)}</td>
                <td className="px-3 py-2">{nombreMotivo(l.motivo_codigo)}</td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {sale ? "−" : "+"}
                  {formatoCantidad(l.cantidad)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatoPesos(l.costo_unitario)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatoPesos(l.costo_total)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatoCantidad(l.saldo)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatoPesos(l.costo_promedio)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatoPesos(l.valor_saldo)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="font-semibold">
            <th scope="row" colSpan={5} className="px-3 py-2 text-right">
              Saldo final
            </th>
            <td className="px-3 py-2 text-right tabular-nums">{formatoCantidad(kardex.saldo_final)}</td>
            <th scope="row" className="px-3 py-2 text-right">
              Valor final
            </th>
            <td className="px-3 py-2 text-right tabular-nums">{formatoPesos(kardex.valor_final)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
