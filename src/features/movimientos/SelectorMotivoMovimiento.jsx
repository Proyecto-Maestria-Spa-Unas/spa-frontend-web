import { useEffect, useState } from "react";

import { listarMotivos } from "../../api/movimientos";
import { Select } from "../../design-system/componentes/Select";

export function SelectorMotivoMovimiento({ tipo, value, onChange }) {
    const [motivos, setMotivos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let activo = true;

        const cargarMotivos = async () => {
            try {
                setCargando(true);
                setError("");
                setMotivos([]);

                const respuesta = await listarMotivos(tipo);

                const motivosRecibidos = Array.isArray(respuesta)
                    ? respuesta
                    : respuesta.items ?? [];

                if (!activo) return;

                const motivosVisibles =
                    tipo === "ENTRADA"
                        ? motivosRecibidos.filter(
                            (motivo) => motivo.codigo !== "SALDO_INICIAL"
                        )
                        : motivosRecibidos;

                setMotivos(motivosVisibles);
            } catch (errorCarga) {
                console.error("Error al cargar los motivos:", errorCarga);

                if (activo) {
                    setError(
                        "No fue posible cargar los motivos del movimiento."
                    );
                }
            } finally {
                if (activo) {
                    setCargando(false);
                }
            }
        };

        onChange("");
        cargarMotivos();

        return () => {
            activo = false;
        };
    }, [tipo, onChange]);

    const opciones = motivos.map((motivo) => ({
        value: motivo.codigo,
        label: motivo.nombre,
    }));

    return (
        <div>
            <Select
                id="motivo"
                label="Motivo del movimiento"
                required
                value={value}
                onChange={(evento) => onChange(evento.target.value)}
                options={opciones}
                placeholder={
                    cargando
                        ? "Cargando motivos..."
                        : "Selecciona un motivo"
                }
                disabled={cargando || Boolean(error)}
                error={error}
            />
        </div>
    );
}
