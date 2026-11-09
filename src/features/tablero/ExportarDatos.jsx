/**
 * RNF-10 · Exportar inventario o movimientos (X5)
 * API: GET /analitica/exportar  (src/api/analitica.js → exportar). Permiso: analitica.consultar.
 */
import { useState } from "react";
import { exportar } from "../../api/analitica";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Card } from "../../design-system/componentes/Card";
import { Select } from "../../design-system/componentes/Select";
import { useAuth } from "../auth/AuthContext";
import { CONJUNTOS, FORMATOS, guardarArchivo, mensajeExportar, nombreArchivo } from "./exportacion";

export function ExportarDatos() {
  const { tiene } = useAuth();
  const [conjunto, setConjunto] = useState("inventario");
  const [formato, setFormato] = useState("csv");
  const [descargando, setDescargando] = useState(false);
  const [resultado, setResultado] = useState(null); // { tipo: "exito" | "error", texto }

  // La Manicurista consulta alertas pero no analítica: se oculta la opción (la barrera real es el backend).
  if (!tiene("analitica.consultar")) return null;

  async function descargar(evento) {
    evento.preventDefault();
    setResultado(null);
    setDescargando(true);
    try {
      const archivo = await exportar(conjunto, formato);
      const nombre = nombreArchivo(conjunto, formato);
      guardarArchivo(archivo, nombre);
      setResultado({ tipo: "exito", texto: `Descarga lista: ${nombre}` });
    } catch (error) {
      setResultado({ tipo: "error", texto: mensajeExportar(error) });
    } finally {
      setDescargando(false);
    }
  }

  return (
    <Card title="Exportar datos" className="mt-6">
      <form className="space-y-4" onSubmit={descargar} aria-busy={descargando}>
        <p>Descarga una copia del inventario o de los movimientos para revisarla en Excel o con herramientas de análisis.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Qué descargar" options={CONJUNTOS} value={conjunto} onChange={(e) => setConjunto(e.target.value)} />
          <Select label="Formato" options={FORMATOS} value={formato} onChange={(e) => setFormato(e.target.value)} />
        </div>
        {resultado?.tipo === "error" && <Alert variant="error">{resultado.texto}</Alert>}
        {resultado?.tipo === "exito" && <Alert variant="success">{resultado.texto}</Alert>}
        <Button type="submit" disabled={descargando}>
          {descargando ? "Preparando archivo…" : "Descargar"}
        </Button>
      </form>
    </Card>
  );
}
