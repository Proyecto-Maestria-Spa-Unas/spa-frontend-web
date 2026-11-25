/**
 * HU-10, RF-17 · Lista de productos que requieren reposición (X4)
 * API: GET /alertas?estado=  (src/api/analitica.js → listarAlertas)
 */
import { useEffect, useState } from "react";
import { listarAlertas } from "../../api/analitica";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Card } from "../../design-system/componentes/Card";
import { EstadoBadge } from "../../design-system/componentes/EstadoBadge";
import { Select } from "../../design-system/componentes/Select";
import { mensajeDeError } from "./errores";
import { formatoCantidad } from "./formato";

const COLUMNAS = [
  { titulo: "Producto", numerica: false },
  { titulo: "Estado", numerica: false },
  { titulo: "Stock actual", numerica: true },
  { titulo: "Stock mínimo", numerica: true },
  { titulo: "Faltante", numerica: true },
];

const FILTROS = [
  { value: "", label: "Todas" },
  { value: "AGOTADO", label: "Agotado" },
  { value: "BAJO_STOCK", label: "Bajo stock" },
];

const VACIO = Object.freeze({
  "": "No hay productos que requieran reposición.",
  AGOTADO: "No hay productos agotados.",
  BAJO_STOCK: "No hay productos con bajo stock.",
});

/** Alertas de stock con filtro por estado. El orden (agotados primero, luego mayor faltante) lo define la API. */
export function ListaAlertas() {
  const [filtro, setFiltro] = useState("");
  const [intento, setIntento] = useState(0);
  const [alertas, setAlertas] = useState([]);
  const [estado, setEstado] = useState("cargando");
  const [errorCarga, setErrorCarga] = useState("");

  useEffect(() => {
    let vigente = true;
    listarAlertas(filtro || undefined)
      .then((respuesta) => {
        if (!vigente) return;
        setAlertas(respuesta);
        setEstado("listo");
      })
      .catch((error) => {
        if (!vigente) return;
        setErrorCarga(mensajeDeError(error));
        setEstado("error");
      });
    return () => {
      vigente = false;
    };
  }, [filtro, intento]);

  function cambiarFiltro(evento) {
    setEstado("cargando");
    setFiltro(evento.target.value);
  }

  function reintentar() {
    setEstado("cargando");
    setIntento((n) => n + 1);
  }

  return (
    <Card title="Productos por reponer" className="mt-4">
      <Select label="Estado" options={FILTROS} value={filtro} onChange={cambiarFiltro} className="max-w-xs" />

      <div className="mt-4">
        {estado === "cargando" && <p role="status">Cargando alertas…</p>}

        {estado === "error" && (
          <div className="space-y-3">
            <Alert variant="error">{errorCarga}</Alert>
            <Button variant="secondary" onClick={reintentar}>
              Reintentar
            </Button>
          </div>
        )}

        {estado === "listo" && alertas.length === 0 && <p>{VACIO[filtro]}</p>}

        {estado === "listo" && alertas.length > 0 && (
          <>
            <p className="mb-2">
              {alertas.length} {alertas.length === 1 ? "producto" : "productos"} en alerta
            </p>
            <div className="overflow-x-auto rounded-xl border border-marca-borde">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Productos que requieren reposición</caption>
                <thead className="bg-marca-enfoque font-heading text-xs uppercase tracking-wider text-marca-primario-hover">
                  <tr>
                    {COLUMNAS.map(({ titulo, numerica }) => (
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
                  {alertas.map((a) => (
                    <tr key={a.producto_id} className="transition-colors duration-200 hover:bg-marca-superficie-hover">
                      <td className="px-4 py-3">
                        <span className="block font-semibold text-marca-primario-hover">{a.nombre}</span>
                        <span className="block text-xs text-marca-texto-secundario">{a.codigo}</span>
                      </td>
                      <td className="px-4 py-3">
                        <EstadoBadge estado={a.estado} />
                      </td>
                      <td className="px-4 py-3 text-right text-marca-texto-secundario">{formatoCantidad(a.stock_actual)}</td>
                      <td className="px-4 py-3 text-right text-marca-texto-secundario">{formatoCantidad(a.stock_minimo)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-marca-texto-secundario">{formatoCantidad(a.faltante)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
