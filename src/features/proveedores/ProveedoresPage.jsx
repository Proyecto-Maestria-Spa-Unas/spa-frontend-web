
import { useEffect, useState } from "react";
import {
  actualizarProveedor,
  crearProveedor,
  listarProveedores,
} from "../../api/catalogo";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Card } from "../../design-system/componentes/Card";
import { Modal } from "../../design-system/componentes/Modal";
import { useAuth } from "../auth/AuthContext";
import { PUNTO_INICIAL } from "../tablero/proveedores";
import { mensajeDeError } from "./errores";
import { FormularioProveedor } from "./FormularioProveedor";

function EstadoProveedor({ activo }) {
  return (
    <span
      className={
        activo
          ? "rounded-full bg-estado-disponible-fondo px-2 py-1 text-xs font-medium text-estado-disponible-texto"
          : "rounded-full bg-estado-descontinuado-fondo px-2 py-1 text-xs font-medium text-estado-descontinuado-texto"
      }
    >
      {activo ? "● Activo" : "○ Inactivo"}
    </span>
  );
}

export function ProveedoresPage() {
  const { tiene } = useAuth();
  const puedeAdministrar = tiene("catalogo.administrar");

  const [proveedores, setProveedores] = useState([]);
  const [incluirInactivos, setIncluirInactivos] = useState(false);
  const [estado, setEstado] = useState("cargando");
  const [errorCarga, setErrorCarga] = useState("");
  const [intento, setIntento] = useState(0);
  const [aviso, setAviso] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    let vigente = true;

    listarProveedores(incluirInactivos)
      .then((respuesta) => {
        if (!vigente) return;
        setProveedores(respuesta);
        setEstado("listo");
      })
      .catch((error) => {
        if (!vigente) return;
        setErrorCarga(
          mensajeDeError(error, "No fue posible cargar los proveedores."),
        );
        setEstado("error");
      });

    return () => {
      vigente = false;
    };
  }, [incluirInactivos, intento]);

  function reintentar() {
    setEstado("cargando");
    setIntento((actual) => actual + 1);
  }

  async function guardar(datos) {
    if (formulario.proveedor) {
      const actualizado = await actualizarProveedor(
        formulario.proveedor.id,
        datos,
      );

      setProveedores((anteriores) =>
        anteriores.map((proveedor) =>
          proveedor.id === actualizado.id ? actualizado : proveedor,
        ),
      );

      setAviso({ variante: "success", texto: "Proveedor actualizado." });
    } else {
      const nuevo = await crearProveedor(datos);
      setProveedores((anteriores) => [nuevo, ...anteriores]);
      setAviso({ variante: "success", texto: "Proveedor creado." });
    }

    setFormulario(null);
  }

  async function cambiarEstado(proveedor) {
    const activar = !proveedor.activo;
    setProcesandoId(proveedor.id);

    try {
      const actualizado = await actualizarProveedor(proveedor.id, {
        activo: activar,
      });

      setProveedores((anteriores) =>
        anteriores
          .map((actual) =>
            actual.id === actualizado.id ? actualizado : actual,
          )
          .filter((actual) => incluirInactivos || actual.activo),
      );

      setAviso({
        variante: "success",
        texto: activar ? "Proveedor activado." : "Proveedor desactivado.",
      });
    } catch (error) {
      setAviso({
        variante: "error",
        texto: mensajeDeError(
          error,
          activar
            ? "No fue posible activar el proveedor."
            : "No fue posible desactivar el proveedor.",
        ),
      });
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Ícono de proveedores */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-marca-acento bg-marca-enfoque">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-marca-primario"
            aria-hidden="true"
          >
            <path d="M10 17h4V5H2v12h3" />
            <path d="M14 9h4l4 4v4h-3" />
            <circle cx="7.5" cy="17.5" r="2.5" />
            <circle cx="16.5" cy="17.5" r="2.5" />
          </svg>
        </div>

        {/* Nombre y descripción */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-heading text-xs font-bold tracking-[0.25em] text-marca-primario-hover">
              NAILSSPA
            </p>

            <h2 className="mt-1 font-heading text-3xl font-bold tracking-tight text-marca-primario-hover">
              Proveedores
            </h2>

            <p className="mt-1 text-sm text-marca-texto">
              Consulta y administra los proveedores de NailsSpa.
            </p>
          </div>
        </div>

        {puedeAdministrar && (
          <Button onClick={() => setFormulario({ proveedor: null })}>
            Nuevo proveedor
          </Button>
        )}
      </div>

      {aviso && (
        <Alert
          variant={aviso.variante}
          onClose={() => setAviso(null)}
        >
          {aviso.texto}
        </Alert>
      )}

      {puedeAdministrar && (
        <label className="flex items-center gap-2 text-sm text-marca-texto">
          <input
            type="checkbox"
            checked={incluirInactivos}
            onChange={(evento) => {
              setEstado("cargando");
              setIncluirInactivos(evento.target.checked);
            }}
            className="size-4 accent-marca-primario"
          />
          Mostrar proveedores inactivos
        </label>
      )}

      <Card>
        {estado === "cargando" && (
          <p role="status">Cargando proveedores…</p>
        )}

        {estado === "error" && (
          <div className="space-y-3">
            <Alert variant="error">{errorCarga}</Alert>
            <Button variant="secondary" onClick={reintentar}>
              Reintentar
            </Button>
          </div>
        )}

        {estado === "listo" && proveedores.length === 0 && (
          <p>No hay proveedores registrados.</p>
        )}

        {estado === "listo" && proveedores.length > 0 && (
          <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {proveedores.map((proveedor) => (
              <li key={proveedor.id} className="min-w-0">
                <article className="flex h-full min-w-0 flex-col gap-4 rounded-xl border border-marca-borde bg-marca-superficie p-5 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex min-w-0 items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words font-heading text-base font-bold leading-snug text-marca-primario-hover">
                        {proveedor.nombre}
                      </h3>
                      <div className="shrink-0">
                        <EstadoProveedor activo={proveedor.activo} />
                      </div>
                    </div>
                    <div className="h-1 w-12 rounded-full bg-marca-primario" />
                  </div>

                  <dl className="grid min-w-0 grid-cols-1 gap-3 text-sm text-marca-texto">
                    <div className="min-w-0">
                      <dt className="font-semibold">NIT</dt>
                      <dd>{proveedor.nit}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-semibold">Teléfono</dt>
                      <dd>{proveedor.telefono || "No registrado"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-semibold">Correo</dt>
                      <dd>{proveedor.correo || "No registrado"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-semibold">Dirección</dt>
                      <dd>{proveedor.direccion || "No registrada"}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="font-semibold">Ubicación</dt>
                      <dd>
                        {proveedor.ubicacion
                          ? `${proveedor.ubicacion.latitud.toFixed(5)}, ${proveedor.ubicacion.longitud.toFixed(5)}`
                          : "Sin ubicación registrada"}
                      </dd>
                    </div>
                  </dl>

                  {puedeAdministrar && (
                    <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-marca-borde pt-4">
                      <Button
                        className="flex-1"
                        variant="secondary"
                        onClick={() => setFormulario({ proveedor })}
                      >
                        Editar
                      </Button>
                      <Button
                        className="flex-1"
                        variant="secondary"
                        disabled={procesandoId === proveedor.id}
                        onClick={() => cambiarEstado(proveedor)}
                      >
                        {procesandoId === proveedor.id
                          ? "Procesando…"
                          : proveedor.activo
                            ? "Desactivar"
                            : "Activar"}
                      </Button>
                    </div>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={Boolean(formulario)}
        onClose={() => setFormulario(null)}
        title={
          formulario?.proveedor ? "Editar proveedor" : "Nuevo proveedor"
        }
      >
        {formulario && (
          <FormularioProveedor
            proveedor={formulario.proveedor}
            ubicacionInicial={PUNTO_INICIAL}
            onGuardar={guardar}
            onCancelar={() => setFormulario(null)}
          />
        )}
      </Modal>
    </section>
  );
}
