
import { describe, expect, it } from "vitest";
import { validarProveedor } from "./validacion";

const VALORES_VALIDOS = {
    nombre: "Distribuidora Belleza Total",
    nit: "900123456-7",
    telefono: "6015550101",
    correo: "ventas@bellezatotal.co",
    direccion: "Cl. 63 #13-20, Chapinero",
};

describe("validarProveedor", () => {
    it("acepta datos válidos", () => {
        expect(validarProveedor(VALORES_VALIDOS)).toEqual({});
    });

    it("exige el nombre", () => {
        expect(validarProveedor({ ...VALORES_VALIDOS, nombre: " " })).toHaveProperty("nombre");
    });

    it("rechaza nombres con menos de 2 caracteres", () => {
        expect(validarProveedor({ ...VALORES_VALIDOS, nombre: "A" })).toHaveProperty("nombre");
    });

    it("rechaza NIT con formato inválido", () => {
        expect(validarProveedor({ ...VALORES_VALIDOS, nit: "900123456" })).toHaveProperty("nit");
    });

    it("acepta campos opcionales vacíos", () => {
        expect(
            validarProveedor({
                ...VALORES_VALIDOS,
                telefono: "",
                correo: "",
                direccion: "",
            }),
        ).toEqual({});
    });

    it("rechaza correos inválidos", () => {
        expect(validarProveedor({ ...VALORES_VALIDOS, correo: "correo-invalido" })).toHaveProperty(
            "correo",
        );
    });

    it("rechaza teléfonos mayores a 20 caracteres", () => {
        expect(validarProveedor({ ...VALORES_VALIDOS, telefono: "123456789012345678901" })).toHaveProperty(
            "telefono",
        );
    });

    it("acepta teléfonos con indicativo internacional", () => {
        expect(
            validarProveedor({ ...VALORES_VALIDOS, telefono: "+573001234567" }),
        ).toEqual({});
    });

    it("rechaza teléfonos con letras", () => {
        expect(
            validarProveedor({ ...VALORES_VALIDOS, telefono: "300ABC1234" }),
        ).toHaveProperty("telefono");
    });

    it("rechaza teléfonos con menos de 7 dígitos", () => {
        expect(
            validarProveedor({ ...VALORES_VALIDOS, telefono: "12345" }),
        ).toHaveProperty("telefono");
    });

    it("no exige ni valida el NIT al editar", () => {
        expect(
            validarProveedor({ ...VALORES_VALIDOS, nit: "" }, { editando: true }),
        ).toEqual({});
    });

    it("rechaza direcciones mayores a 200 caracteres", () => {
        expect(validarProveedor({ ...VALORES_VALIDOS, direccion: "A".repeat(201) })).toHaveProperty(
            "direccion",
        );
    });
});
