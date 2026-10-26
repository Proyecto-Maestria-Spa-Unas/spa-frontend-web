# Feature · Movimientos (HU-06, HU-07, HU-08, HU-11, HU-13)

**Responsable:** Gleidy725 · **API:** `src/api/movimientos.js` · **Contrato:** `movimientos-v1.yaml`

| Entrega | Sprint | Funciones de la API |
|---|---|---|
| Registrar entrada y salida (`MovimientosPage`) | 3 | `listarMotivos(tipo)`, `registrarEntrada`, `registrarSalida` |
| Historial con filtros (`HistorialPage`) | 3 | `listarMovimientos({ producto_id, tipo, desde, hasta })` |
| Anulación con confirmación | 3 | `anularMovimiento(id, motivo)` |

Reglas:

* Genere **una** clave con `nuevaClaveIdempotencia()` al abrir el formulario y reutilícela si reintenta el envío: así un doble clic o un corte de red no duplica el movimiento.
* Muestre `STOCK_INSUFICIENTE` y `PRODUCTO_DESCONTINUADO` con mensajes claros; tras registrar, use `estado` de la respuesta para avisar si el producto quedó en bajo stock.
* La anulación exige confirmación explícita del usuario (el cuerpo lleva `confirmacion: true`).
