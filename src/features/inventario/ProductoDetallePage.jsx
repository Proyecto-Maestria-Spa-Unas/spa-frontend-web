/**
 * X7 · Detalle del producto con su kardex valorizado (RF-14, DEC-11).
 * Responsable: ivonnelizethmoreno-cloud · Ruta: /inventario/:id · Permiso: analitica.consultar
 * API: obtenerProducto (catalogo.js) y kardex (analitica.js).
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { kardex as consultarKardex } from "../../api/analitica";
import { obtenerProducto } from "../../api/catalogo";
import { ROUTES } from "../../constants/routes";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Card } from "../../design-system/componentes/Card";
import { EstadoBadge } from "../../design-system/componentes/EstadoBadge";
import { Input } from "../../design-system/componentes/Input";
import { formatoCantidad } from "./formato";
import { KardexTabla } from "./KardexTabla";

const MENSAJES = Object.freeze({
  RECURSO_NO_EXISTE: "El producto no existe.",
  DATOS_INVALIDOS: "Revise el rango: la fecha inicial no puede ser posterior a la final.",
});

const traer = (id, desde, hasta) =>
  Promise.all([obtenerProducto(id), consultarKardex(id, desde || undefined, hasta || undefined)]);

export function ProductoDetallePage() {
  const { id } = useParams();
  const [producto, setProducto] = useState(null);
  const [datosKardex, setDatosKardex] = useState(null);
  const [rango, setRango] = useState({ desde: "", hasta: "" });
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const aplicar = useCallback((promesa, esVigente = () => true) => {
    promesa
      .then(([p, k]) => {
        if (!esVigente()) return;
        setProducto(p);
        setDatosKardex(k);
        setError(null);
      })
      .catch((e) => esVigente() && setError(MENSAJES[e.code] ?? e.message))
      .finally(() => esVigente() && setCargando(false));
  }, []);

  useEffect(() => {
    let vigente = true;
    aplicar(traer(id), () => vigente);
    return () => {
      vigente = false;
    };
  }, [id, aplicar]);

  const filtrar = (evento) => {
    evento.preventDefault();
    setCargando(true);
    aplicar(traer(id, rango.desde, rango.hasta));
  };

  return (
    <section className="space-y-4">
      <Link to={ROUTES.INVENTARIO} className="text-sm text-marca-primario underline">
        ← Volver al inventario
      </Link>
      <h2 className="text-xl font-semibold">{producto ? `${producto.nombre} · ${producto.codigo}` : "Detalle del producto"}</h2>

      {producto && (
        <p className="flex items-center gap-3 text-sm text-marca-texto">
          <EstadoBadge estado={producto.estado} />
          <span>Stock actual: {formatoCantidad(producto.stock_actual)}</span>
        </p>
      )}

      {error && <Alert variant="error">{error}</Alert>}

      <Card title="Kardex valorizado · costo promedio ponderado">
        <form onSubmit={filtrar} className="mb-4 flex flex-wrap items-end gap-3" aria-label="Filtrar el kardex por fechas">
          <Input
            label="Desde"
            type="date"
            value={rango.desde}
            onChange={(e) => setRango((r) => ({ ...r, desde: e.target.value }))}
          />
          <Input
            label="Hasta"
            type="date"
            value={rango.hasta}
            onChange={(e) => setRango((r) => ({ ...r, hasta: e.target.value }))}
          />
          <Button type="submit">Filtrar</Button>
        </form>
        {cargando && <p className="text-sm">Cargando…</p>}
        {!cargando && datosKardex && !error && <KardexTabla kardex={datosKardex} />}
      </Card>
    </section>
  );
}
