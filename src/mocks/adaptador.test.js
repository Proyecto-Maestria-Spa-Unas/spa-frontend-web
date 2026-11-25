
import { beforeEach, describe, expect, it, vi } from "vitest";

const ADMIN_ID = "a0000000-0000-4000-8000-000000000001";
const PRODUCTO_ID = "p0000000-0000-4000-8000-000000000002";

// Datos controlados para comprobar los límites de fecha y hora.
vi.mock("./datos", async (importOriginal) => {
  const datos = await importOriginal();

  return {
    ...datos,
    MOVIMIENTOS: [
      {
        id: 101,
        producto_id: "p0000000-0000-4000-8000-000000000002",
        tipo: "ENTRADA",
        registrado_por: "a0000000-0000-4000-8000-000000000001",
        ocurrido_en: "2026-11-19T12:00:00-05:00",
      },
      {
        id: 102,
        producto_id: "p0000000-0000-4000-8000-000000000002",
        tipo: "ENTRADA",
        registrado_por: "a0000000-0000-4000-8000-000000000001",
        ocurrido_en: "2026-11-20T23:30:00-05:00",
      },
      {
        id: 103,
        producto_id: "p0000000-0000-4000-8000-000000000002",
        tipo: "SALIDA",
        registrado_por: "a0000000-0000-4000-8000-000000000001",
        ocurrido_en: "2026-11-21T00:30:00-05:00",
      },
    ],
  };
});

import { adaptadorSimulado, reiniciarSimulacion } from "./adaptador";

async function consultarMovimientos(params = {}) {
  const respuesta = await adaptadorSimulado({
    method: "get",
    url: "/movimientos",
    params: { size: 100, ...params },
    headers: {
      Authorization: `Bearer simulado.${ADMIN_ID}`,
    },
  });

  return respuesta.data;
}

describe("Adaptador simulado · Filtro de fechas del historial", () => {
  beforeEach(() => {
    reiniciarSimulacion();
  });

  it("incluye un movimiento de las 23:30 del día hasta", async () => {
    const resultado = await consultarMovimientos({
      desde: "2026-11-20T00:00:00-05:00",
      hasta: "2026-11-20T23:59:59-05:00",
    });

    expect(resultado.items.map((m) => m.id)).toContain(102);
  });

  it("excluye un movimiento de las 00:30 del día siguiente", async () => {
    const resultado = await consultarMovimientos({
      desde: "2026-11-20T00:00:00-05:00",
      hasta: "2026-11-20T23:59:59-05:00",
    });

    expect(resultado.items.map((m) => m.id)).not.toContain(103);
  });

  it("filtra correctamente cuando solo se indica desde", async () => {
    const resultado = await consultarMovimientos({
      desde: "2026-11-20T00:00:00-05:00",
    });

    expect(resultado.items.map((m) => m.id)).toEqual([103, 102]);
  });

  it("devuelve todos los movimientos cuando no hay fechas", async () => {
    const resultado = await consultarMovimientos();

    expect(resultado.total).toBe(3);
    expect(resultado.items.map((m) => m.id)).toEqual([103, 102, 101]);
  });
});
