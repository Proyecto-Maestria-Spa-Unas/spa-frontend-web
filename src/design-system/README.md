# Design system

**Responsables:** Gleidy725 (F3 · tokens) y Estefa44445 (F4 · componentes base)

| Archivo | Qué contiene |
|---|---|
| `tokens.css` | Colores, tipografía y espaciado de la marca en `@theme` de Tailwind v4. Valores provisionales hasta el manual de marca (F2) |
| `estados.js` | Los 4 estados del inventario con etiqueta, ícono y clases basadas en tokens |
| `componentes/` | Button, EstadoBadge, Input, Select, Alert, Card y Modal (F4), cada uno con su prueba. `estilosCampo.js` reúne los estilos compartidos de Input y Select. `reglaTokens.test.js` verifica automáticamente que ningún componente use colores sueltos |

Regla: ningún componente fuera de esta carpeta usa colores hexadecimales ni clases de color de Tailwind sin token (`bg-pink-600`). Use `bg-marca-primario`, `text-estado-agotado-texto`, etc.
