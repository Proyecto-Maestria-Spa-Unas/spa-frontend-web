# Auditoría de accesibilidad del frontend de NailsSpa

Tarea **F16** · Repositorio `spa-frontend-web` · Guía: WCAG 2.2 nivel AA

Revisión manual de las pantallas del frontend (modo simulado). Se probó con teclado, zoom del navegador, ancho de pantalla reducido, revisión visual, lector de pantalla (Narrador de Windows) y la extensión axe DevTools (axe-core 4.13.0) para el contraste y los nombres accesibles.

## 1. Hallazgos

| ID | Pantalla | Qué pasa | Cómo se probó | Rol | Tipo o criterio |
|---|---|---|---|---|---|
| H-01 | Login | El título muestra «Spa de Uñas» en lugar del nombre de la marca, NailsSpa. | Revisión visual | Sin sesión (pantalla pública) | Consistencia de marca |
| H-02 | Menú | A partir de 200 % de zoom, el menú y el logo se superponen un poco (ver [Evidencia 1](#evidencia-1)). | Zoom | Todos los roles | WCAG 1.4.4 Cambio de tamaño del texto |
| H-03 | General | Al reducir el ancho del navegador, el menú se sale de su espacio y se superpone con el logo y con la pantalla de Inventario (ver [Evidencias 1](#evidencia-1) y [2](#evidencia-2)). | Zoom y ancho de ventana | Todos los roles | WCAG 1.4.10 Reflujo |
| H-04 | Inventario | El resaltado del foco en los productos del inventario es muy tenue y podría pasar desapercibido (ver [Evidencia 5](#evidencia-5)). | Teclado | Todos los roles | WCAG 2.4.7 Foco visible |
| H-05 | Alertas y tablero, y Usuarios | El encabezado no sigue el diseño de Inventario: falta el logo, el nombre de la marca (NailsSpa) y la descripción, y el estilo del texto es distinto (ver [Evidencia 3](#evidencia-3)). | Revisión visual | Todos los roles | Consistencia visual |
| H-06 | Alertas y tablero, y Usuarios | El color y el tamaño del texto en las tablas y tarjetas (Productos por reponer, Exportar datos y Proveedores cercanos) no coinciden con los de Inventario (ver [Evidencia 4](#evidencia-4)). | Revisión visual | Todos los roles | Consistencia visual |
| H-07 | Inventario y Usuarios (enlace activo del menú) | El texto del enlace de la página actual (`#A85F82`) sobre su fondo (`#FCEAF1`) tiene un contraste de **3,93**; se requiere 4,5 (ver [Evidencias 6](#evidencia-6) y [8](#evidencia-8)). | axe DevTools | Todos los roles | WCAG 1.4.3 Contraste mínimo |
| H-08 | Usuarios | Un botón con texto `#A85F82` sobre fondo `#FCEAF1` (borde `#E8C5D5`) tiene un contraste de **3,93**; se requiere 4,5 (ver [Evidencia 8](#evidencia-8)). | axe DevTools | Todos los roles | WCAG 1.4.3 Contraste mínimo |
| H-09 | Usuarios | El botón principal tiene texto blanco (`#FFFFFF`) sobre fondo `#C77D9F`: contraste de **3,06**; se requiere 4,5 (ver [Evidencia 8](#evidencia-8)). Es el mismo estilo de botón que se usa en otras pantallas. | axe DevTools | Todos los roles | WCAG 1.4.3 Contraste mínimo |
| H-10 | Alertas y tablero | Los marcadores del mapa de proveedores (Leaflet) son botones enfocables sin nombre accesible: no tienen texto visible, `aria-label`, `aria-labelledby` ni `title` (ver [Evidencia 7](#evidencia-7)). axe reporta impacto grave. | axe DevTools | Todos los roles | WCAG 4.1.2 Nombre, función, valor |
| H-11 | Todas | Se verificó el funcionamiento del Narrador de Windows en todas las pantallas revisadas hasta el momento. | Lector de pantalla | Todos los roles | Observación (sin hallazgo) |

Cantidad de incidencias que reportó axe por pantalla:

| Pantalla | Incidencias | Tipo | Detalle en este documento |
|---|---|---|---|
| Inventario | 9 | Contraste insuficiente | Se documenta la primera (H-07). Las demás quedan por detallar. |
| Alertas y tablero | 2 | Nombre accesible faltante | Se documenta la primera (H-10). |
| Usuarios | 3 | Contraste insuficiente | Las 3 (H-07, H-08 y H-09). |

## 2. Pantallas revisadas

| Pantalla | Estado |
|---|---|
| Login | Revisada |
| Inventario | Revisada |
| Historial | Pendiente: la pantalla aún no está implementada en rol gerente. |
| Alertas y tablero | Revisada (sin los gráficos de F15, que todavía no están integrados) |
| Proveedores | Pendiente: la pantalla aún no está implementada |
| Usuarios | Revisada |

## 3. Evidencias

### Evidencia 1

Prueba con 250 % de zoom.

![Menú y logo superpuestos con 250 % de zoom](img/evidencia-1-zoom-250.png)

### Evidencia 2

Prueba simulando el ancho de un celular.

<img src="img/evidencia-2-celular-1.png" alt="Pantalla de Inventario con el ancho de un celular, primera captura" width="300"> <img src="img/evidencia-2-celular-2.png" alt="Pantalla de Inventario con el ancho de un celular, segunda captura" width="300">

### Evidencia 3

Comparación del encabezado de Inventario (arriba) con el de Alertas y tablero (abajo). Propuesta: añadir a Alertas y tablero el logo, el nombre de la marca NailsSpa y la descripción, como se ve en Inventario.

![Encabezado de Inventario con logo, nombre de la marca y descripción](img/evidencia-3-encabezado-inventario.png)

![Encabezado de Alertas y tablero, solo con el título](img/evidencia-3-encabezado-alertas.png)

### Evidencia 4

Estilo del texto en Inventario (arriba) frente a Productos por reponer, Exportar datos y Proveedores cercanos (abajo). Propuesta: que coincidan con los estilos y tamaños de Inventario.

![Filtros y tabla de Inventario](img/evidencia-4-inventario.png)

![Tarjetas de Alertas y tablero: Productos por reponer, Exportar datos y Proveedores cercanos](img/evidencia-4-alertas-tarjetas.png)

### Evidencia 5

Bajo nivel de resaltado en el foco, podría pasar desapercibido. Propuesta: cambiar a un color más oscuro y a un borde más ancho.

![Foco poco visible sobre «Acetona pura» en la tabla de Inventario](img/evidencia-5-foco-inventario.png)

### Evidencia 6

Inventario, axe DevTools: incidencia 1 de 9 por contraste insuficiente (3,93; se requiere 4,5) en el enlace activo del menú.

![Resultado de axe en Inventario: contraste de 3,93 en el enlace Inventario del menú](img/evidencia-6-axe-inventario.png)

### Evidencia 7

Alertas y tablero, axe DevTools: incidencia 1 de 2, un marcador de Leaflet con rol de botón y sin nombre accesible.

![Resultado de axe en Alertas y tablero: marcador del mapa sin nombre accesible](img/evidencia-7-axe-alertas.png)

### Evidencia 8

Usuarios, axe DevTools: las 3 incidencias de contraste insuficiente (enlace activo del menú, botón con borde rosado y botón principal).

![Resultado de axe en Usuarios, incidencia 1 de 3: enlace Usuarios del menú con contraste de 3,93](img/evidencia-8-axe-usuarios-1.png)

![Resultado de axe en Usuarios, incidencia 2 de 3: botón con contraste de 3,93](img/evidencia-8-axe-usuarios-2.png)

![Resultado de axe en Usuarios: botón principal con texto blanco sobre #C77D9F, contraste de 3,06](img/evidencia-8-axe-usuarios-3.png)
