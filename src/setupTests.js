import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// findBy* y waitFor esperan 1 s por defecto. Con la suite completa en paralelo, en equipos
// más lentos el renderizado tarda más que eso y las pruebas fallan de forma intermitente.
configure({ asyncUtilTimeout: 5000 });
