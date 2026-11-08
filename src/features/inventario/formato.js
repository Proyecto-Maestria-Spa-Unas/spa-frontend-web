/** Formatos de Colombia para cantidades, pesos y fechas. La API envía números como texto decimal. */

const CANTIDAD = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
const PESOS = new Intl.NumberFormat("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
const FECHA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export const formatoCantidad = (valor) => (valor == null ? "—" : CANTIDAD.format(Number(valor)));
export const formatoPesos = (valor) => (valor == null ? "—" : `$ ${PESOS.format(Number(valor))}`);
export const formatoFecha = (iso) => FECHA.format(new Date(iso));

const NOMBRES_MOTIVO = Object.freeze({
  COMPRA: "Compra",
  SALDO_INICIAL: "Saldo inicial",
  AJUSTE_CONTEO: "Ajuste por conteo",
  CONSUMO_SERVICIO: "Consumo en servicio",
  MERMA: "Merma",
  VENCIMIENTO: "Vencimiento",
  ANULACION: "Anulación",
});

export const nombreMotivo = (codigo) => NOMBRES_MOTIVO[codigo] ?? codigo;
