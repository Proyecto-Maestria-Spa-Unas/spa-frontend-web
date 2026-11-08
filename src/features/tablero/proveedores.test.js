import {
  ATRIBUCION,
  PUNTO_INICIAL,
  URL_TESELAS,
  contenidoGlobo,
  descargarGeoJson,
  formatoDistancia,
  redondearCoordenada,
  validarPunto,
} from "./proveedores";

describe("validarPunto", () => {
  it("acepta coordenadas válidas, también como texto y en los extremos", () => {
    expect(validarPunto({ latitud: "4.6097", longitud: "-74.0817" })).toEqual({});
    expect(validarPunto({ latitud: 90, longitud: 180 })).toEqual({});
    expect(validarPunto({ latitud: -90, longitud: -180 })).toEqual({});
    expect(validarPunto(PUNTO_INICIAL)).toEqual({});
  });

  it("pide la latitud y la longitud cuando están vacías o no son números", () => {
    expect(validarPunto({ latitud: "", longitud: "  " })).toEqual({
      latitud: "Escribe una latitud.",
      longitud: "Escribe una longitud.",
    });
    expect(validarPunto({ latitud: "abc", longitud: "-" })).toEqual({
      latitud: "Escribe una latitud.",
      longitud: "Escribe una longitud.",
    });
  });

  it("rechaza lo que sale de los rangos del contrato", () => {
    expect(validarPunto({ latitud: "90.1", longitud: "0" })).toEqual({ latitud: "La latitud va entre -90 y 90." });
    expect(validarPunto({ latitud: "-91", longitud: "0" })).toEqual({ latitud: "La latitud va entre -90 y 90." });
    expect(validarPunto({ latitud: "0", longitud: "180.5" })).toEqual({
      longitud: "La longitud va entre -180 y 180.",
    });
  });
});

describe("formato", () => {
  it("formatea la distancia en km con coma decimal", () => {
    expect(formatoDistancia("0.59")).toBe("0,59 km");
    expect(formatoDistancia("12.5")).toBe("12,50 km");
    expect(formatoDistancia(0)).toBe("0,00 km");
  });

  it("devuelve texto vacío si la distancia no es un número", () => {
    expect(formatoDistancia(undefined)).toBe("");
    expect(formatoDistancia("abc")).toBe("");
  });

  it("redondea las coordenadas a 5 decimales", () => {
    expect(redondearCoordenada(4.609712345)).toBe("4.60971");
    expect(redondearCoordenada(-74.0817)).toBe("-74.0817");
  });
});

describe("contenidoGlobo", () => {
  it("muestra nombre, teléfono y distancia", () => {
    const globo = contenidoGlobo({ nombre: "Plaza España", telefono: "3000000003", distancia_km: "0.92" });
    expect(globo.textContent).toBe("Plaza España" + "Tel. 3000000003" + "A 0,92 km");
  });

  it("avisa cuando el proveedor no tiene teléfono", () => {
    const globo = contenidoGlobo({ nombre: "Ghem", telefono: null, distancia_km: "1.5" });
    expect(globo.textContent).toContain("Sin teléfono registrado");
  });

  it("trata el nombre como texto, nunca como HTML", () => {
    const globo = contenidoGlobo({ nombre: '<img src=x onerror="alert(1)">', telefono: null, distancia_km: "1" });
    expect(globo.querySelector("img")).toBeNull();
    expect(globo.textContent).toContain('<img src=x onerror="alert(1)">');
  });
});

describe("OpenStreetMap", () => {
  it("usa las teselas oficiales y cita la atribución obligatoria", () => {
    expect(URL_TESELAS).toBe("https://tile.openstreetmap.org/{z}/{x}/{y}.png");
    expect(ATRIBUCION).toContain("OpenStreetMap");
    expect(ATRIBUCION).toContain("openstreetmap.org/copyright");
  });
});

describe("descargarGeoJson", () => {
  const COLECCION = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [-74.0855, 4.606] },
        properties: { proveedor_id: "p1", nombre: "San Andresito", telefono: null, distancia_km: "0.59" },
      },
    ],
  };

  function leer(blob) {
    return new Promise((resolver) => {
      const lector = new FileReader();
      lector.onload = () => resolver(lector.result);
      lector.readAsText(blob);
    });
  }

  afterEach(() => vi.restoreAllMocks());

  it("entrega un archivo .geojson con el contenido tal cual y libera la URL", async () => {
    let blob;
    URL.createObjectURL = vi.fn((b) => {
      blob = b;
      return "blob:prueba";
    });
    URL.revokeObjectURL = vi.fn();
    const descargas = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      descargas.push({ archivo: this.download, destino: this.href });
    });

    descargarGeoJson(COLECCION);

    expect(descargas).toEqual([{ archivo: "proveedores-cercanos.geojson", destino: "blob:prueba" }]);
    expect(blob.type).toBe("application/geo+json");
    expect(JSON.parse(await leer(blob))).toEqual(COLECCION);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:prueba");
    expect(document.querySelector("a[download]")).toBeNull();
  });

  it("permite elegir el nombre del archivo", () => {
    URL.createObjectURL = vi.fn(() => "blob:x");
    URL.revokeObjectURL = vi.fn();
    const nombres = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function () {
      nombres.push(this.download);
    });
    descargarGeoJson(COLECCION, "otro.geojson");
    expect(nombres).toEqual(["otro.geojson"]);
  });
});
