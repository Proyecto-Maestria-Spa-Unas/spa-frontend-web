# Feature · Alertas y tablero (HU-10, RF-17, RF-18, RF-19)

**Responsable:** Estefa44445 · **API:** `src/api/analitica.js` · **Contrato:** `analitica-v1.yaml`

| Entrega | Sprint | Funciones de la API |
|---|---|---|
| Lista de alertas y contador en el menú | 3 | `listarAlertas(estado)`, `resumenAlertas()` |
| Tablero de decisiones | 4 | `tablero()`, `consumo(desde, hasta, agruparPor)`, `cobertura()` |
| Exportar CSV / Parquet | 4 | `exportar(conjunto, formato)` → Blob para descargar |

`valor_inventario` llega `null` mientras no se decida DEC-11: muestre "No disponible".
