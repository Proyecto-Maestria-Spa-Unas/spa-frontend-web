
import { useRef, useState } from "react";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Input } from "../../design-system/componentes/Input";
import { MapaUbicacionProveedor } from "./MapaUbicacionProveedor";
import { erroresPorCampo, mensajeDeError } from "./errores";
import { validarProveedor } from "./validacion";

const ORDEN_CAMPOS = ["nombre", "nit", "telefono", "correo", "direccion"];

/**
 * Formulario de alta y edición de proveedores.
 * Sin proveedor crea; con proveedor edita sin modificar el NIT.
 * onGuardar(datos) debe lanzar el error de la API si falla.
 */
export function FormularioProveedor({
    proveedor,
    ubicacionInicial,
    onGuardar,
    onCancelar,
}) {
    const editando = Boolean(proveedor);

    const [valores, setValores] = useState({
        nombre: proveedor?.nombre ?? "",
        nit: proveedor?.nit ?? "",
        telefono: proveedor?.telefono ?? "",
        correo: proveedor?.correo ?? "",
        direccion: proveedor?.direccion ?? "",
    });

    const [ubicacion, setUbicacion] = useState(
        proveedor?.ubicacion ?? ubicacionInicial,
    );
    const [errores, setErrores] = useState({});
    const [errorGeneral, setErrorGeneral] = useState("");
    const [enviando, setEnviando] = useState(false);
    const campos = useRef({});

    function cambiar(campo) {
        return (evento) => {
            let valor = evento.target.value;

            if (campo === "telefono") {
                valor = valor.replace(/[^\d+]/g, "");

                if (valor.includes("+")) {
                    valor = `+${valor.replace(/\+/g, "")}`;
                }
            }

            setValores((anteriores) => ({
                ...anteriores,
                [campo]: valor,
            }));

            setErrores((anteriores) => ({
                ...anteriores,
                [campo]: undefined,
            }));
        };
    }

    function enfocarPrimerError(encontrados) {
        const primero = ORDEN_CAMPOS.find(
            (campo) => encontrados[campo] && campos.current[campo],
        );
        if (primero) campos.current[primero].focus();
    }

    async function enviar(evento) {
        evento.preventDefault();
        setErrorGeneral("");

        const encontrados = validarProveedor(valores, { editando });
        setErrores(encontrados);

        if (Object.keys(encontrados).length > 0) {
            enfocarPrimerError(encontrados);
            return;
        }

        const datos = {
            nombre: valores.nombre.trim(),
            telefono: valores.telefono.trim() || null,
            correo: valores.correo.trim() || null,
            direccion: valores.direccion.trim() || null,
            ubicacion,
        };

        if (!editando) datos.nit = valores.nit.trim();

        setEnviando(true);

        try {
            await onGuardar(datos);
        } catch (error) {
            const delServidor = erroresPorCampo(error);
            if (Object.keys(delServidor).length > 0) {
                setErrores(delServidor);
                enfocarPrimerError(delServidor);
            } else {
                setErrorGeneral(
                    mensajeDeError(error, "No fue posible guardar el proveedor."),
                );
            }
            setEnviando(false);
        }
    }

    return (
        <form
            className="space-y-3"
            onSubmit={enviar}
            noValidate
            aria-busy={enviando}
        >
            {errorGeneral && <Alert variant="error">{errorGeneral}</Alert>}

            <Input
                ref={(elemento) => (campos.current.nombre = elemento)}
                label="Nombre del proveedor"
                autoComplete="organization"
                required
                value={valores.nombre}
                onChange={cambiar("nombre")}
                error={errores.nombre}
            />

            <Input
                ref={(elemento) => (campos.current.nit = elemento)}
                label="NIT"
                hint={editando ? "El NIT no se puede modificar." : "Formato: 900123456-7."}
                required={!editando}
                disabled={editando}
                value={valores.nit}
                onChange={cambiar("nit")}
                error={errores.nit}
            />

            <Input
                ref={(elemento) => (campos.current.telefono = elemento)}
                label="Teléfono"
                type="tel"
                autoComplete="tel"
                value={valores.telefono}
                onChange={cambiar("telefono")}
                error={errores.telefono}
            />

            <Input
                ref={(elemento) => (campos.current.correo = elemento)}
                label="Correo electrónico"
                type="email"
                autoComplete="email"
                value={valores.correo}
                onChange={cambiar("correo")}
                error={errores.correo}
            />

            <Input
                ref={(elemento) => (campos.current.direccion = elemento)}
                label="Dirección"
                autoComplete="street-address"
                value={valores.direccion}
                onChange={cambiar("direccion")}
                error={errores.direccion}
            />

            <fieldset className="space-y-2 rounded-lg border border-marca-borde p-3">
                <legend className="font-semibold">Ubicación del proveedor</legend>
                <p className="text-sm text-marca-texto">
                    Selecciona un punto en el mapa para establecer la ubicación.
                </p>
                <MapaUbicacionProveedor
                    ubicacion={ubicacion}
                    alElegirPunto={setUbicacion}
                />
                <p className="text-xs text-marca-texto" aria-live="polite">
                    Latitud: {ubicacion.latitud.toFixed(6)} · Longitud:{" "}
                    {ubicacion.longitud.toFixed(6)}
                </p>
            </fieldset>

            <div className="sticky bottom-0 flex flex-wrap justify-end gap-2 border-t border-marca-borde bg-marca-superficie py-3">
                <Button type="button" variant="secondary" onClick={onCancelar}>
                    Cancelar
                </Button>
                <Button type="submit" disabled={enviando}>
                    {enviando ? "Guardando…" : "Guardar proveedor"}
                </Button>
            </div>
        </form>
    );
}
