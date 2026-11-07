// Regla del design system (ver src/design-system/README.md): ningún componente usa
// colores hexadecimales ni clases de color de Tailwind sin token (p. ej. bg-pink-600).
const archivos = import.meta.glob("./*.{js,jsx}", { query: "?raw", import: "default", eager: true });
const componentes = Object.entries(archivos).filter(([ruta]) => !ruta.includes(".test."));

const HEXADECIMAL = /#[0-9a-fA-F]{3,8}\b/;
const COLOR_TAILWIND =
  /\b(?:bg|text|border|ring|fill|stroke|from|to|via|divide|outline|placeholder)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/;

describe("Regla de tokens del design system", () => {
  it("encuentra los archivos del design system", () => {
    expect(componentes.length).toBeGreaterThan(5);
  });

  it.each(componentes)("%s no usa colores hexadecimales", (_ruta, contenido) => {
    expect(contenido).not.toMatch(HEXADECIMAL);
  });

  it.each(componentes)("%s no usa clases de color de Tailwind sin token", (_ruta, contenido) => {
    expect(contenido).not.toMatch(COLOR_TAILWIND);
  });
});
