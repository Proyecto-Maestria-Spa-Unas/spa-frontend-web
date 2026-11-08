
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthContext } from "../auth/AuthContext";
import { MemoryRouter } from "react-router-dom";
import { InventarioPage } from "./InventarioPage";
import {
    listarCategorias,
    listarProductos,
    listarUnidades,
    descontinuarProducto,
    reactivarProducto,
    obtenerProducto,
    actualizarProducto,
    configurarStockMinimo,
    crearProducto,
} from "../../api/catalogo";

vi.mock("../../api/catalogo", () => ({
    listarCategorias: vi.fn(),
    listarProductos: vi.fn(),
    listarUnidades: vi.fn(),
    crearProducto: vi.fn(),
    actualizarProducto: vi.fn(),
    obtenerProducto: vi.fn(),
    configurarStockMinimo: vi.fn(),
    descontinuarProducto: vi.fn(),
    reactivarProducto: vi.fn(),
}));

const categorias = [
    { id: 1, nombre: "Esmaltes", activa: true, orden: 1 },
    { id: 2, nombre: "Removedores", activa: true, orden: 2 },
    { id: 3, nombre: "Herramientas", activa: true, orden: 3 },
    { id: 4, nombre: "Desechables", activa: true, orden: 4 },
];

const unidades = [
    { id: 1, codigo: "UND", nombre: "Unidad", magnitud: "CONTEO", admite_decimales: false },
    { id: 2, codigo: "ML", nombre: "Mililitro", magnitud: "VOLUMEN", admite_decimales: true },
    { id: 3, codigo: "PAR", nombre: "Par", magnitud: "CONTEO", admite_decimales: false },
];

const productos = [
    {
        id: "producto-1",
        codigo: "ESM-001",
        nombre: "Esmalte rojo",
        categoria_id: 1,
        stock_actual: "24.000",
        stock_minimo: "6.000",
        estado: "DISPONIBLE",
        descontinuado: false,
        version: 1,
    },
    {
        id: "producto-2",
        codigo: "REM-001",
        nombre: "Acetona pura",
        categoria_id: 2,
        stock_actual: "350.000",
        stock_minimo: "500.000",
        estado: "BAJO_STOCK",
        descontinuado: false,
        version: 1,
    },
    {
        id: "producto-3",
        codigo: "DES-004",
        nombre: "Guantes de nitrilo",
        categoria_id: 4,
        stock_actual: "0.000",
        stock_minimo: "20.000",
        estado: "AGOTADO",
        descontinuado: false,
        version: 1,
    },
    {
        id: "producto-4",
        codigo: "HER-010",
        nombre: "Lima de cartón",
        categoria_id: 3,
        stock_actual: "12.000",
        stock_minimo: null,
        estado: "DESCONTINUADO",
        descontinuado: true,
        version: 1,
    },
];

function configurarRespuestaProductos() {
    listarProductos.mockImplementation(async (parametros = {}) => {
        let resultado = [...productos];

        if (parametros.q) {
            const busqueda = parametros.q.toLowerCase();

            resultado = resultado.filter(
                (producto) =>
                    producto.nombre.toLowerCase().includes(busqueda) ||
                    producto.codigo.toLowerCase().includes(busqueda)
            );
        }

        if (parametros.categoria_id) {
            resultado = resultado.filter(
                (producto) =>
                    producto.categoria_id === Number(parametros.categoria_id)
            );
        }

        if (parametros.estado) {
            resultado = resultado.filter(
                (producto) => producto.estado === parametros.estado
            );
        }

        if (!parametros.incluir_descontinuados) {
            resultado = resultado.filter(
                (producto) => !producto.descontinuado
            );
        }

        const total = resultado.length;
        const inicio = ((parametros.page || 1) - 1) * (parametros.size || 10);

        return {
            items: resultado.slice(inicio, inicio + (parametros.size || 10)),
            total,
        };
    });
}

function renderizarInventario(permisos = []) {
    const tiene = vi.fn((permiso) => permisos.includes(permiso));

    return render(
        <MemoryRouter>
            <AuthContext.Provider value={{ tiene }}>
                <InventarioPage />
            </AuthContext.Provider>
        </MemoryRouter>
    );
}

describe("InventarioPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        listarCategorias.mockResolvedValue(categorias);
        listarUnidades.mockResolvedValue(unidades);

        configurarRespuestaProductos();
    });

    it("filtra productos por búsqueda", async () => {
        renderizarInventario([
            "producto.crear",
            "producto.editar",
            "producto.descontinuar",
        ]);

        await screen.findByText("Esmalte rojo");

        fireEvent.change(
            document.getElementById("busqueda-productos"),
            { target: { value: "Acetona" } }
        );

        await waitFor(() => {
            expect(listarProductos).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    q: "Acetona",
                    page: 1,
                })
            );
        });

        expect(await screen.findByText("Acetona pura")).toBeTruthy();
        expect(screen.queryByText("Esmalte rojo")).toBeNull();
    });

    it("filtra productos por categoría", async () => {
        renderizarInventario([
            "producto.crear",
            "producto.editar",
            "producto.descontinuar",
        ]);

        await screen.findByText("Esmalte rojo");

        fireEvent.change(
            document.getElementById("filtro-categoria"),
            { target: { value: "2" } }
        );

        await waitFor(() => {
            expect(listarProductos).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    categoria_id: "2",
                    page: 1,
                })
            );
        });

        expect(await screen.findByText("Acetona pura")).toBeTruthy();
        expect(screen.queryByText("Esmalte rojo")).toBeNull();
    });

    it("filtra productos por estado", async () => {
        renderizarInventario([
            "producto.crear",
            "producto.editar",
            "producto.descontinuar",
        ]);

        await screen.findByText("Esmalte rojo");

        fireEvent.change(
            document.getElementById("filtro-estado"),
            { target: { value: "BAJO_STOCK" } }
        );

        await waitFor(() => {
            expect(listarProductos).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    estado: "BAJO_STOCK",
                    page: 1,
                })
            );
        });

        expect(await screen.findByText("Acetona pura")).toBeTruthy();
        expect(screen.queryByText("Esmalte rojo")).toBeNull();
    });

    it("muestra el estado correspondiente en cada producto", async () => {
        renderizarInventario([
            "producto.crear",
            "producto.editar",
            "producto.descontinuar",
        ]);

        expect(await screen.findByText("Esmalte rojo")).toBeTruthy();

        expect(screen.getAllByText("Disponible")).toHaveLength(2);
        expect(screen.getAllByText("Bajo stock")).toHaveLength(2);
        expect(screen.getAllByText("Agotado")).toHaveLength(2);

        fireEvent.click(
            screen.getByLabelText("Incluir productos descontinuados")
        );

        expect(await screen.findByText("Lima de cartón")).toBeTruthy();
        expect(screen.getAllByText("Descontinuado")).toHaveLength(2);
    });

    it("permite avanzar y retroceder entre páginas", async () => {
        const muchosProductos = Array.from({ length: 11 }, (_, indice) => ({
            ...productos[0],
            id: `producto-${indice + 1}`,
            codigo: `ESM-${String(indice + 1).padStart(3, "0")}`,
            nombre: `Esmalte ${indice + 1}`,
        }));

        listarProductos.mockImplementation(async (parametros = {}) => {
            const total = muchosProductos.length;
            const inicio = ((parametros.page || 1) - 1) * (parametros.size || 10);

            return {
                items: muchosProductos.slice(
                    inicio,
                    inicio + (parametros.size || 10)
                ),
                total,
            };
        });

        renderizarInventario([
            "producto.crear",
            "producto.editar",
            "producto.descontinuar",
        ]);

        expect(await screen.findByText("Esmalte 1")).toBeTruthy();
        expect(screen.getByText(/1 de 2/)).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));

        expect(await screen.findByText("Esmalte 11")).toBeTruthy();

        await waitFor(() => {
            expect(listarProductos).toHaveBeenLastCalledWith(
                expect.objectContaining({ page: 2 })
            );
        });

        expect(screen.getByText(/2 de 2/)).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Anterior" }));

        expect(await screen.findByText("Esmalte 1")).toBeTruthy();

        await waitFor(() => {
            expect(listarProductos).toHaveBeenLastCalledWith(
                expect.objectContaining({ page: 1 })
            );
        });
    });

    it("muestra un mensaje cuando falla la carga de categorías", async () => {
        listarCategorias.mockRejectedValueOnce(
            new Error("Fallo de prueba")
        );

        renderizarInventario([
            "producto.crear",
            "producto.editar",
            "producto.descontinuar",
        ]);

        expect(
            await screen.findByRole("option", {
                name: /Error al cargar categorías/,
            })
        ).toBeTruthy();
    });

    it("muestra un mensaje cuando falla la carga de unidades", async () => {
        listarUnidades.mockRejectedValueOnce(
            new Error("Fallo de prueba")
        );

        renderizarInventario([
            "producto.crear",
            "producto.editar",
            "producto.descontinuar",
        ]);

        fireEvent.click(
            await screen.findByRole("button", {
                name: /\+ Crear producto/,
            })
        );

        expect(
            await screen.findByText("No fue posible cargar las unidades.")
        ).toBeTruthy();
    });

    it("muestra un mensaje cuando falla la carga de productos", async () => {
        listarProductos.mockRejectedValueOnce(
            new Error("Fallo de prueba")
        );

        renderizarInventario([
            "producto.crear",
            "producto.editar",
            "producto.descontinuar",
        ]);

        expect(
            await screen.findByText("Fallo de prueba")
        ).toBeTruthy();
    });
    it("muestra un mensaje cuando no hay productos registrados", async () => {
        listarProductos.mockResolvedValueOnce({
            items: [],
            total: 0,
        });

        renderizarInventario([
            "producto.crear",
            "producto.editar",
            "producto.descontinuar",
        ]);

        expect(
            await screen.findByText("No se encontraron productos.")
        ).toBeTruthy();
    });

    it("oculta el botón de crear producto cuando el usuario no tiene permiso", async () => {
        renderizarInventario([
            "producto.editar",
            "producto.descontinuar",
        ]);

        expect(
            screen.queryByRole("button", { name: /\+ Crear producto/ })
        ).toBeNull();
    });

    it("oculta las acciones de edición y descontinuación sin permisos", async () => {
        renderizarInventario(["producto.crear"]);

        expect(
            await screen.findByText("Esmalte rojo")
        ).toBeTruthy();

        expect(
            screen.queryByRole("button", { name: "Editar" })
        ).toBeNull();

        expect(
            screen.queryByRole("button", { name: "Descontinuar" })
        ).toBeNull();
    });

    it("descontinúa un producto cuando el usuario confirma la acción", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        descontinuarProducto.mockResolvedValueOnce({});
        configurarRespuestaProductos();

        renderizarInventario([
            "producto.editar",
            "producto.descontinuar",
        ]);

        fireEvent.click(
            await screen.findAllByRole("button", { name: "Descontinuar" }).then(
                (botones) => botones[0]
            )
        );

        await waitFor(() => {
            expect(descontinuarProducto).toHaveBeenCalledWith("producto-1");
        });
    });

    it("no descontinúa un producto cuando el usuario cancela la confirmación", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(false);

        renderizarInventario([
            "producto.editar",
            "producto.descontinuar",
        ]);

        const botones = await screen.findAllByRole("button", {
            name: "Descontinuar",
        });

        fireEvent.click(botones[0]);

        expect(descontinuarProducto).not.toHaveBeenCalled();
    });

    it("reactiva un producto cuando el usuario confirma la acción", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        reactivarProducto.mockResolvedValueOnce({});
        configurarRespuestaProductos();

        renderizarInventario([
            "producto.editar",
            "producto.descontinuar",
        ]);

        fireEvent.click(
            screen.getByRole("checkbox", {
                name: "Incluir productos descontinuados",
            })
        );

        const botones = await screen.findAllByRole("button", {
            name: "Reactivar",
        });

        fireEvent.click(botones[0]);

        await waitFor(() => {
            expect(reactivarProducto).toHaveBeenCalledWith("producto-4");
        });
    });

    it("muestra un error cuando falla la descontinuación de un producto", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        descontinuarProducto.mockRejectedValueOnce(
            new Error("No fue posible descontinuar el producto.")
        );

        renderizarInventario([
            "producto.editar",
            "producto.descontinuar",
        ]);

        const botones = await screen.findAllByRole("button", {
            name: "Descontinuar",
        });

        fireEvent.click(botones[0]);

        expect(
            await screen.findByText("No fue posible descontinuar el producto.")
        ).toBeTruthy();
    });

    it("muestra un error cuando falla la reactivación de un producto", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        reactivarProducto.mockRejectedValueOnce(
            new Error("No fue posible reactivar el producto.")
        );

        renderizarInventario([
            "producto.editar",
            "producto.descontinuar",
        ]);

        fireEvent.click(
            screen.getByRole("checkbox", {
                name: "Incluir productos descontinuados",
            })
        );

        const botones = await screen.findAllByRole("button", {
            name: "Reactivar",
        });

        fireEvent.click(botones[0]);

        expect(
            await screen.findByText("No fue posible reactivar el producto.")
        ).toBeTruthy();
    });

    it("carga los datos del producto al iniciar su edición", async () => {
        obtenerProducto.mockResolvedValueOnce({
            id: "producto-1",
            codigo: "ESM-001",
            nombre: "Esmalte rojo",
            descripcion: "Esmalte de larga duración",
            categoria_id: 1,
            unidad_medida_id: 1,
            stock_minimo: "6.000",
            version: 1,
        });

        renderizarInventario([
            "producto.editar",
        ]);

        const botones = await screen.findAllByRole("button", {
            name: "Editar",
        });

        fireEvent.click(botones[0]);

        expect(
            await screen.findByDisplayValue("Esmalte rojo")
        ).toBeTruthy();

        expect(obtenerProducto).toHaveBeenCalledWith("producto-1");
    });


    it("maneja el error cuando falla la carga del producto para editar", async () => {
        obtenerProducto.mockRejectedValueOnce(
            new Error("No fue posible cargar el producto.")
        );

        renderizarInventario([
            "producto.editar",
        ]);

        const botones = await screen.findAllByRole("button", {
            name: "Editar",
        });

        fireEvent.click(botones[0]);

        await waitFor(() => {
            expect(obtenerProducto).toHaveBeenCalledWith("producto-1");
        });

        expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("actualiza un producto con sus datos editados", async () => {
        obtenerProducto.mockResolvedValueOnce({
            id: "producto-1",
            codigo: "ESM-001",
            nombre: "Esmalte rojo",
            descripcion: "Descripción anterior",
            categoria_id: 1,
            unidad_medida_id: 1,
            stock_minimo: "6.000",
            version: 1,
        });

        actualizarProducto.mockResolvedValueOnce({});
        configurarRespuestaProductos();

        renderizarInventario(["producto.editar"]);

        const botones = await screen.findAllByRole("button", {
            name: "Editar",
        });

        fireEvent.click(botones[0]);

        const campoNombre = await screen.findByLabelText("Nombre *");

        fireEvent.change(campoNombre, {
            target: { value: "Esmalte azul" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Guardar producto" })
        );

        await waitFor(() => {
            expect(actualizarProducto).toHaveBeenCalledWith(
                "producto-1",
                {
                    nombre: "Esmalte azul",
                    descripcion: "Descripción anterior",
                    categoria_id: 1,
                    unidad_medida_id: 1,
                },
                1
            );
        });
    });

    it("actualiza el stock mínimo cuando cambia y tiene el permiso", async () => {
        obtenerProducto.mockResolvedValueOnce({
            id: "producto-1",
            codigo: "ESM-001",
            nombre: "Esmalte rojo",
            descripcion: "Descripción anterior",
            categoria_id: 1,
            unidad_medida_id: 1,
            stock_minimo: "6.000",
            version: 1,
        });

        actualizarProducto.mockResolvedValueOnce({});
        configurarStockMinimo.mockResolvedValueOnce({});
        configurarRespuestaProductos();

        renderizarInventario([
            "producto.editar",
            "producto.configurar_minimo",
        ]);

        const botones = await screen.findAllByRole("button", {
            name: "Editar",
        });

        fireEvent.click(botones[0]);

        const campoStockMinimo = await screen.findByLabelText("Stock mínimo");

        fireEvent.change(campoStockMinimo, {
            target: { value: "10" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Guardar producto" })
        );

        await waitFor(() => {
            expect(actualizarProducto).toHaveBeenCalled();
            expect(configurarStockMinimo).toHaveBeenCalledWith(
                "producto-1",
                10
            );
        });
    });

    it("muestra la opción de recargar cuando ocurre un conflicto de versión", async () => {
        obtenerProducto.mockResolvedValueOnce({
            id: "producto-1",
            codigo: "ESM-001",
            nombre: "Esmalte rojo",
            descripcion: "Descripción anterior",
            categoria_id: 1,
            unidad_medida_id: 1,
            stock_minimo: "6.000",
            version: 1,
        });

        const error = new Error("Conflicto de versión");
        error.code = "VERSION_CONFLICTO";

        actualizarProducto.mockRejectedValueOnce(error);

        renderizarInventario(["producto.editar"]);

        const botones = await screen.findAllByRole("button", {
            name: "Editar",
        });

        fireEvent.click(botones[0]);

        await screen.findByDisplayValue("Esmalte rojo");

        fireEvent.click(
            screen.getByRole("button", { name: "Guardar producto" })
        );

        expect(
            await screen.findByText(
                /Este producto fue modificado por otra persona/
            )
        ).toBeTruthy();

        expect(
            screen.getByRole("button", { name: /Recargar producto/ })
        ).toBeTruthy();
    });

    it("recarga los datos del producto después de un conflicto de versión", async () => {
        obtenerProducto
            .mockResolvedValueOnce({
                id: "producto-1",
                codigo: "ESM-001",
                nombre: "Esmalte rojo",
                descripcion: "Descripción anterior",
                categoria_id: 1,
                unidad_medida_id: 1,
                stock_minimo: "6.000",
                version: 1,
            })
            .mockResolvedValueOnce({
                id: "producto-1",
                codigo: "ESM-001",
                nombre: "Esmalte actualizado",
                descripcion: "Descripción nueva",
                categoria_id: 1,
                unidad_medida_id: 1,
                stock_minimo: "8.000",
                version: 2,
            });

        const error = new Error("Conflicto de versión");
        error.code = "VERSION_CONFLICTO";

        actualizarProducto.mockRejectedValueOnce(error);

        renderizarInventario(["producto.editar"]);

        const botonesEditar = await screen.findAllByRole("button", {
            name: "Editar",
        });

        fireEvent.click(botonesEditar[0]);

        await screen.findByDisplayValue("Esmalte rojo");

        fireEvent.click(
            screen.getByRole("button", { name: "Guardar producto" })
        );

        fireEvent.click(
            await screen.findByRole("button", {
                name: /Recargar producto/,
            })
        );

        expect(
            await screen.findByDisplayValue("Esmalte actualizado")
        ).toBeTruthy();

        expect(obtenerProducto).toHaveBeenCalledTimes(2);
    });

    it("crea un producto con todos sus datos", async () => {
        crearProducto.mockResolvedValueOnce({});
        configurarRespuestaProductos();

        renderizarInventario(["producto.crear"]);

        fireEvent.click(
            await screen.findByRole("button", {
                name: /\+ Crear producto/,
            })
        );

        fireEvent.change(screen.getByLabelText(/Código/), {
            target: { value: "ESM-020" },
        });

        fireEvent.change(screen.getByLabelText("Nombre *"), {
            target: { value: "Esmalte violeta" },
        });

        fireEvent.change(screen.getByLabelText("Descripción"), {
            target: { value: "Esmalte de larga duración" },
        });

        fireEvent.change(screen.getByLabelText("Categoría *"), {
            target: { value: "1" },
        });

        fireEvent.change(screen.getByLabelText("Unidad de medida *"), {
            target: { value: "1" },
        });

        fireEvent.change(screen.getByLabelText("Cantidad inicial"), {
            target: { value: "20" },
        });

        fireEvent.change(screen.getByLabelText("Stock mínimo"), {
            target: { value: "5" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Guardar producto" })
        );

        await waitFor(() => {
            expect(crearProducto).toHaveBeenCalledWith({
                codigo: "ESM-020",
                nombre: "Esmalte violeta",
                descripcion: "Esmalte de larga duración",
                categoria_id: 1,
                unidad_medida_id: 1,
                cantidad_inicial: 20,
                stock_minimo: 5,
            });
        });
    });

    it("muestra un error cuando se intenta crear un producto con código duplicado", async () => {
        const error = new Error("Código duplicado");
        error.code = "CODIGO_DUPLICADO";

        crearProducto.mockRejectedValueOnce(error);
        configurarRespuestaProductos();

        renderizarInventario(["producto.crear"]);

        fireEvent.click(
            await screen.findByRole("button", {
                name: /\+ Crear producto/,
            })
        );

        fireEvent.change(screen.getByLabelText(/Código/), {
            target: { value: "ESM-001" },
        });

        fireEvent.change(screen.getByLabelText("Nombre *"), {
            target: { value: "Esmalte violeta" },
        });

        fireEvent.change(screen.getByLabelText("Categoría *"), {
            target: { value: "1" },
        });

        fireEvent.change(screen.getByLabelText("Unidad de medida *"), {
            target: { value: "1" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Guardar producto" })
        );

        expect(
            await screen.findByText(
                "Este código ya está registrado. Ingresa uno diferente."
            )
        ).toBeTruthy();

        expect(crearProducto).toHaveBeenCalledTimes(1);
    });

    it("muestra los errores cuando el servidor devuelve datos inválidos", async () => {
        const error = new Error("Datos inválidos");
        error.code = "DATOS_INVALIDOS";
        error.errors = [
            {
                campo: "nombre",
                mensaje: "El nombre no es válido",
            },
        ];

        crearProducto.mockRejectedValueOnce(error);
        configurarRespuestaProductos();

        renderizarInventario(["producto.crear"]);

        fireEvent.click(
            await screen.findByRole("button", {
                name: /\+ Crear producto/,
            })
        );

        fireEvent.change(screen.getByLabelText(/Código/), {
            target: { value: "ESM-025" },
        });

        fireEvent.change(screen.getByLabelText("Nombre *"), {
            target: { value: "Esmalte violeta" },
        });

        fireEvent.change(screen.getByLabelText("Categoría *"), {
            target: { value: "1" },
        });

        fireEvent.change(screen.getByLabelText("Unidad de medida *"), {
            target: { value: "1" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Guardar producto" })
        );

        expect(
            await screen.findByText(
                "Revisa los campos del formulario e intenta nuevamente."
            )
        ).toBeTruthy();

        expect(
            screen.getByText("El nombre no es válido")
        ).toBeTruthy();
    });

    it("muestra un mensaje cuando ocurre un error inesperado al crear un producto", async () => {
        crearProducto.mockRejectedValueOnce(
            new Error("Error inesperado del servidor")
        );
        configurarRespuestaProductos();

        renderizarInventario(["producto.crear"]);

        fireEvent.click(
            await screen.findByRole("button", {
                name: /\+ Crear producto/,
            })
        );

        fireEvent.change(screen.getByLabelText(/Código/), {
            target: { value: "ESM-026" },
        });

        fireEvent.change(screen.getByLabelText("Nombre *"), {
            target: { value: "Esmalte naranja" },
        });

        fireEvent.change(screen.getByLabelText("Categoría *"), {
            target: { value: "1" },
        });

        fireEvent.change(screen.getByLabelText("Unidad de medida *"), {
            target: { value: "1" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: "Guardar producto" })
        );

        expect(
            await screen.findByText("Error inesperado del servidor")
        ).toBeTruthy();
    });

    it("muestra el nombre de cada producto como enlace a su detalle", async () => {
        renderizarInventario();

        const enlace = await screen.findByRole("link", {
            name: "Esmalte rojo",
        });

        expect(enlace.getAttribute("href")).toBe("/inventario/producto-1");
    });

});
