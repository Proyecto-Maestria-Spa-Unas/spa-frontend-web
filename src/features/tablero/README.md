# Feature · Alertas y tablero (HU-10, RF-17, RF-18, RF-19)

**Responsable:** Estefa44445 · **API:** `src/api/analitica.js` · **Contrato:** `analitica-v1.yaml`

| Entrega | Sprint | Funciones de la API |
|---|---|---|
| Lista de alertas y contador en el menú (**full-stack X4**: también los 2 endpoints) | Entrega 2 | `listarAlertas(estado)`, `resumenAlertas()` |
| Tablero de decisiones | Entrega 2 | `tablero()`, `consumo(desde, hasta, agruparPor)`, `cobertura()` |
| Exportar CSV / Parquet (**full-stack X5**: también el endpoint con DuckDB) | Entrega 2 | `exportar(conjunto, formato)` → Blob para descargar |
| Mapa de proveedores cercanos (**full-stack X6**: también el endpoint PostGIS) | Entrega 2 | `proveedoresCercanos(lat, lon, radioKm)` → GeoJSON para `L.geoJSON` |
| Kardex valorizado (lo construye ivonnelizethmoreno-cloud, X7) | Entrega 2 | `kardex(productoId, desde, hasta)` |

Para el mapa agregue `leaflet` y `react-leaflet` (`npm install leaflet react-leaflet`) y use teselas de OpenStreetMap con su atribución.
