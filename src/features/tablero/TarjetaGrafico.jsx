/** Tarjeta de un indicador (F15): carga, error con reintento, gráfico y la misma información en tabla. */
import { useState } from "react";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Card } from "../../design-system/componentes/Card";

/**
 * `estado`: "cargando" | "error" | "listo". `vacio`: texto cuando no hay datos (no se muestra el gráfico).
 * `grafico` y `tabla` son lo que se muestra según el botón "Ver como tabla" / "Ver gráfico".
 */
export function TarjetaGrafico({ titulo, estado, error, onReintentar, vacio, grafico, tabla, nota, className }) {
  const [verTabla, setVerTabla] = useState(false);

  return (
    <Card title={titulo} className={className} aria-busy={estado === "cargando"}>
      {estado === "cargando" && <p role="status">Cargando…</p>}

      {estado === "error" && (
        <div className="space-y-3">
          <Alert variant="error">{error}</Alert>
          <Button variant="secondary" onClick={onReintentar}>
            Reintentar
          </Button>
        </div>
      )}

      {estado === "listo" && vacio && <p>{vacio}</p>}

      {estado === "listo" && !vacio && (
        <div className="space-y-3">
          {verTabla ? tabla : grafico}
          {nota && <p className="text-xs">{nota}</p>}
          <Button variant="secondary" aria-pressed={verTabla} onClick={() => setVerTabla((v) => !v)}>
            {verTabla ? "Ver gráfico" : "Ver como tabla"}
          </Button>
        </div>
      )}
    </Card>
  );
}
