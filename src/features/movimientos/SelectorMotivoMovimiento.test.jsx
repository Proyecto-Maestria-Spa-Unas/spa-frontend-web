import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { listarMotivos } from "../../api/movimientos";
import { SelectorMotivoMovimiento } from "./SelectorMotivoMovimiento";

vi.mock("../../api/movimientos", () => ({
    listarMotivos: vi.fn(),
}));

const motivosEntrada = [
    { codigo: "COMPRA", nombre: "Compra" },
    { codigo: "DEVOLUCION", nombre: "Devolución" },
    { codigo: "SALDO_INICIAL", nombre: "Saldo inicial" },
];

const motivosSalida = [
    { codigo: "CONSUMO", nombre: "Consumo" },
    { codigo: "MERMA", nombre: "Merma" },
    { codigo: "AJUSTE", nombre: "Ajuste" },
];

describe("SelectorMotivoMovimiento", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("consulta y muestra los motivos correspondientes a ENTRADA, excluyendo SALDO_INICIAL", async () => {
        listarMotivos.mockResolvedValueOnce(motivosEntrada);

        render(
            <SelectorMotivoMovimiento
                tipo="ENTRADA"
                value=""
                onChange={vi.fn()}
            />
        );

        expect(listarMotivos).toHaveBeenCalledWith("ENTRADA");

        expect(
            await screen.findByRole("option", { name: "Compra" })
        ).toBeTruthy();

        expect(
            screen.getByRole("option", { name: "Devolución" })
        ).toBeTruthy();

        expect(
            screen.queryByRole("option", { name: "Saldo inicial" })
        ).toBeNull();
    });

    it("consulta y muestra los motivos correspondientes a SALIDA", async () => {
        listarMotivos.mockResolvedValueOnce(motivosSalida);

        render(
            <SelectorMotivoMovimiento
                tipo="SALIDA"
                value=""
                onChange={vi.fn()}
            />
        );

        expect(listarMotivos).toHaveBeenCalledWith("SALIDA");

        expect(
            await screen.findByRole("option", { name: "Consumo" })
        ).toBeTruthy();

        expect(
            screen.getByRole("option", { name: "Merma" })
        ).toBeTruthy();

        expect(
            screen.getByRole("option", { name: "Ajuste" })
        ).toBeTruthy();
    });

    it("muestra un mensaje cuando falla la carga de motivos", async () => {
        listarMotivos.mockRejectedValueOnce(
            new Error("Fallo de prueba")
        );

        render(
            <SelectorMotivoMovimiento
                tipo="ENTRADA"
                value=""
                onChange={vi.fn()}
            />
        );

        expect(
            await screen.findByText(
                "No fue posible cargar los motivos del movimiento."
            )
        ).toBeTruthy();
    });

    it("muestra el estado de carga mientras consulta los motivos", async () => {
        let resolverMotivos;

        listarMotivos.mockReturnValueOnce(
            new Promise((resolve) => {
                resolverMotivos = resolve;
            })
        );

        render(
            <SelectorMotivoMovimiento
                tipo="ENTRADA"
                value=""
                onChange={vi.fn()}
            />
        );

        expect(
            screen.getByRole("option", { name: "Cargando motivos..." })
        ).toBeTruthy();

        resolverMotivos(motivosEntrada);

        expect(
            await screen.findByRole("option", { name: "Compra" })
        ).toBeTruthy();
    });

    it("notifica el cambio de selección", async () => {
        listarMotivos.mockResolvedValueOnce(motivosEntrada);
        const onChange = vi.fn();

        render(
            <SelectorMotivoMovimiento
                tipo="ENTRADA"
                value=""
                onChange={onChange}
            />
        );

        const selector = await screen.findByLabelText(
            "Motivo del movimiento *"
        );

        fireEvent.change(selector, {
            target: { value: "COMPRA" },
        });

        expect(onChange).toHaveBeenCalledWith("COMPRA");
    });

    it("consulta nuevamente los motivos y limpia la selección cuando cambia el tipo", async () => {
        listarMotivos
            .mockResolvedValueOnce(motivosEntrada)
            .mockResolvedValueOnce(motivosSalida);

        const onChange = vi.fn();

        const { rerender } = render(
            <SelectorMotivoMovimiento
                tipo="ENTRADA"
                value="COMPRA"
                onChange={onChange}
            />
        );

        expect(
            await screen.findByRole("option", { name: "Compra" })
        ).toBeTruthy();

        onChange.mockClear();

        rerender(
            <SelectorMotivoMovimiento
                tipo="SALIDA"
                value=""
                onChange={onChange}
            />
        );

        await waitFor(() => {
            expect(listarMotivos).toHaveBeenLastCalledWith("SALIDA");
            expect(onChange).toHaveBeenCalledWith("");
        });

        expect(
            await screen.findByRole("option", { name: "Consumo" })
        ).toBeTruthy();

        expect(
            screen.queryByRole("option", { name: "Compra" })
        ).toBeNull();
    });

});
