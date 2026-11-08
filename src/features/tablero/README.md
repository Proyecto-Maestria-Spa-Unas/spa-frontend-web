# Feature · Alertas y tablero (HU-10, RF-17, RF-18, RF-19)

**Responsable:** Estefa44445 · **API:** `src/api/analitica.js` · **Contrato:** `analitica-v1.yaml`

| Entrega | Sprint | Funciones de la API |
|---|---|---|
| Lista de alertas y contador en el menú (**full-stack X4**: también los 2 endpoints) · **hecho** | Entrega 2 | `listarAlertas(estado)`, `resumenAlertas()` |
| Tablero de decisiones | Entrega 2 | `tablero()`, `consumo(desde, hasta, agruparPor)`, `cobertura()` |
| Exportar CSV / Parquet (**full-stack X5**: también el endpoint con DuckDB) | Entrega 2 | `exportar(conjunto, formato)` → Blob para descargar |
| Mapa de proveedores cercanos (**full-stack X6**: también el endpoint PostGIS) | Entrega 2 | `proveedoresCercanos(lat, lon, radioKm)` → GeoJSON para `L.geoJSON` |
| Kardex valorizado (lo construye ivonnelizethmoreno-cloud, X7) | Entrega 2 | `kardex(productoId, desde, hasta)` |

Para el mapa agregue `leaflet` y `react-leaflet` (`npm install leaflet react-leaflet`) y use teselas de OpenStreetMap con su atribución.

## Qué hace X4

* **Lista** (`ListaAlertas.jsx`): tabla con producto (nombre y código), estado, stock actual, stock mínimo y faltante. Filtro por estado: Todas, Agotado, Bajo stock. La API la entrega ordenada: agotados primero y, dentro de cada grupo, los que más faltan.
* **Contador del menú** (`ContadorAlertas.jsx`): número de productos en alerta junto a "Alertas y tablero". Se actualiza al cambiar de pantalla y cada minuto; no se muestra si no hay alertas ni si la consulta falla.
* **Cantidades**: la API las manda como texto ("350.000"); se muestran sin ceros de relleno y con coma decimal (`formato.js`).
* **Errores**: se explican por `code` (`errores.js`); la lista ofrece "Reintentar".
* Un producto sin stock mínimo configurado no genera alerta (RN-14), aunque esté en cero.
