# Feature · Alertas y tablero (HU-10, RF-17, RF-18, RF-19)

**Responsable:** Estefa44445 · **API:** `src/api/analitica.js` · **Contrato:** `analitica-v1.yaml`

| Entrega | Sprint | Funciones de la API |
|---|---|---|
| Lista de alertas y contador en el menú (**full-stack X4**: también los 2 endpoints) · **hecho** | Entrega 2 | `listarAlertas(estado)`, `resumenAlertas()` |
| Tablero de decisiones con gráficos (**F15**) · **hecho** | Entrega 2 | `tablero()`, `consumo(desde, hasta, agruparPor)`, `cobertura()` |
| Exportar CSV / Parquet (**full-stack X5**: también el endpoint con DuckDB) · **hecho** | Entrega 2 | `exportar(conjunto, formato)` → Blob para descargar |
| Mapa de proveedores cercanos (**full-stack X6**: también el endpoint PostGIS) · **hecho** | Entrega 2 | `proveedoresCercanos(lat, lon, radioKm)` → GeoJSON para `L.geoJSON` |
| Kardex valorizado (lo construye ivonnelizethmoreno-cloud, X7) | Entrega 2 | `kardex(productoId, desde, hasta)` |

El mapa usa Leaflet 1.9.4 (`npm install leaflet@1.9.4`) con teselas de OpenStreetMap y su atribución.

## Qué hace X4

* **Lista** (`ListaAlertas.jsx`): tabla con producto (nombre y código), estado, stock actual, stock mínimo y faltante. Filtro por estado: Todas, Agotado, Bajo stock. La API la entrega ordenada: agotados primero y, dentro de cada grupo, los que más faltan.
* **Tablero de decisiones** (F15 · `TableroDecisiones.jsx`): solo para quienes tienen `analitica.consultar` (Administrador y Gerente). Muestra tres cifras (valor del inventario, consumo de 30 días, total de productos) y cuatro gráficos de barras: productos por estado, top de rotación, consumo de 30 días (por categoría o por producto) y cobertura en días (los 10 productos con menos cobertura). Cada indicador carga por separado: si uno falla, los otros se ven y ese ofrece "Reintentar".
* **Accesible**: los gráficos están hechos con HTML y los colores del design system (sin librerías). Cada barra lleva su valor escrito y el estado va con ícono y texto, no solo con color. El gráfico se anuncia a los lectores de pantalla con un resumen y el botón **Ver como tabla** muestra los mismos datos en una tabla (la de cobertura incluye también los productos sin consumo).
* **Valor del inventario**: si no hay costos registrados la API manda `null` y se muestra "Sin costos registrados".
* **Exportar datos** (`ExportarDatos.jsx`, `exportacion.js`): tarjeta con dos listas (Inventario o Movimientos; CSV o Parquet) y el botón Descargar. Solo la ven quienes tienen `analitica.consultar` (Administrador y Gerente; la Manicurista no). El archivo se llama `<conjunto>-AAAAMMDD.<formato>` con la fecha de Bogotá. Si falla, muestra un aviso (sin conexión, sesión vencida, sin permiso u otro) y se puede reintentar.
* **Contador del menú** (`ContadorAlertas.jsx`): número de productos en alerta junto a "Alertas y tablero". Se actualiza al cambiar de pantalla y cada minuto; no se muestra si no hay alertas ni si la consulta falla.
* **Cantidades**: la API las manda como texto ("350.000"); se muestran sin ceros de relleno y con coma decimal (`formato.js`).
* **Errores**: se explican por `code` (`errores.js`); la lista ofrece "Reintentar".
* Un producto sin stock mínimo configurado no genera alerta (RN-14), aunque esté en cero.

## Qué hace X6

* **Mapa** (`MapaProveedores.jsx`, `MapaLeaflet.jsx`): Leaflet con OpenStreetMap. Muestra el punto de búsqueda, el círculo del radio y un marcador por proveedor (con teléfono y distancia al hacer clic).
* **Punto de búsqueda**: se elige haciendo clic en el mapa o escribiendo latitud y longitud (se validan: latitud -90 a 90, longitud -180 a 180). Parte de Bogotá centro.
* **Radio**: control deslizable de 1 a 50 km; la consulta se hace cuando el usuario se detiene.
* **Lista**: proveedores ordenados por cercanía con su distancia en km. Los proveedores sin ubicación no aparecen (D12).
* **Descargar GeoJSON** (`proveedores.js → descargarGeoJson`): baja `proveedores-cercanos.geojson` (RFC 7946, coordenadas `[longitud, latitud]`) para abrirlo en QGIS o ArcGIS.
* Los nombres se muestran como texto en los globos del mapa, nunca como HTML.
* El mapa necesita internet para las teselas de OpenStreetMap.
