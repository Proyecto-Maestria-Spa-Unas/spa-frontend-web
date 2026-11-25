/**
 * HU-09 · Usuarios (F8)
 * Responsable: Estefa44445 · API: src/api/identidad.js
 * Endpoints: GET/POST /usuarios; PATCH /usuarios/{id}, /usuarios/{id}/estado; GET /roles
 * Ver README.md de esta carpeta para el alcance y los criterios.
 */
import { useEffect, useState } from "react";
import { cambiarEstadoUsuario, crearUsuario, actualizarUsuario, listarRoles, listarUsuarios } from "../../api/identidad";
import { Alert } from "../../design-system/componentes/Alert";
import { Button } from "../../design-system/componentes/Button";
import { Card } from "../../design-system/componentes/Card";
import { EncabezadoPagina } from "../../design-system/componentes/EncabezadoPagina";
import { Modal } from "../../design-system/componentes/Modal";
import { Select } from "../../design-system/componentes/Select";
import { cn } from "../../utils/cn";
import { useAuth } from "../auth/AuthContext";
import { mensajeDeError } from "./errores";
import { etiquetaRol } from "./formato";
import { FormularioUsuario } from "./FormularioUsuario";
import { InterruptorEstado } from "./InterruptorEstado";
import { numerosDePagina, TAMANOS_PAGINA } from "./paginacion";

const COLUMNAS = ["Nombre", "Usuario", "Rol", "Estado", "Acciones"];

// Tres personas (trazos de 24x24, mismo estilo de línea que el ícono de Inventario).
const ICONO_USUARIOS = (
  <>
    <circle cx="12" cy="7.500" r="3" />
    <path d="M6.500 20v-3.500a5.500 5.500 0 0 1 11 0V20Z" />
    <path d="M7.500 5.200A2.800 2.800 0 1 0 4.500 9.500M4.500 13.500A4.500 4.500 0 0 0 2 17.500V20h3" />
    <path d="M16.500 5.200A2.800 2.800 0 1 1 19.500 9.500M19.500 13.500A4.500 4.500 0 0 1 22 17.500V20h-3" />
  </>
);
const DURACION_AVISO_MS = 4000; // manual de marca, 4.5: los avisos duran 4 s y se pueden cerrar a mano

function EstadoUsuario({ activo }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-heading text-xs font-medium",
        activo
          ? "bg-estado-disponible-fondo text-estado-disponible-texto"
          : "bg-estado-descontinuado-fondo text-estado-descontinuado-texto",
      )}
    >
      <span aria-hidden="true">{activo ? "●" : "○"}</span>
      {activo ? "Activo" : "Desactivado"}
    </span>
  );
}

/**
 * Pantalla de gestión de usuarios: lista, alta, edición y activar o desactivar. Solo con `usuario.gestionar`.
 * `duracionAviso` solo se cambia en las pruebas.
 */
export function UsuariosPage({ duracionAviso = DURACION_AVISO_MS }) {
  const { usuario: sesion } = useAuth();
  const [pagina, setPagina] = useState(1);
  const [tamano, setTamano] = useState(TAMANOS_PAGINA[0]);
  const [intento, setIntento] = useState(0);
  const [lista, setLista] = useState({ items: [], total: 0 });
  const [roles, setRoles] = useState([]);
  const [estado, setEstado] = useState("cargando");
  const [errorCarga, setErrorCarga] = useState("");
  const [aviso, setAviso] = useState(null);
  const [formulario, setFormulario] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  useEffect(() => {
    let vigente = true;
    Promise.all([listarUsuarios({ page: pagina, size: tamano }), listarRoles()])
      .then(([respuesta, listaRoles]) => {
        if (!vigente) return;
        setLista(respuesta);
        setRoles(listaRoles);
        setEstado("listo");
      })
      .catch((error) => {
        if (!vigente) return;
        setErrorCarga(mensajeDeError(error, "No fue posible cargar los usuarios."));
        setEstado("error");
      });
    return () => {
      vigente = false;
    };
  }, [pagina, tamano, intento]);

  // Los avisos de éxito se cierran solos a los 4 s; los de error se quedan hasta cerrarlos.
  useEffect(() => {
    if (aviso?.variante !== "success") return undefined;
    const temporizador = setTimeout(() => setAviso(null), duracionAviso);
    return () => clearTimeout(temporizador);
  }, [aviso, duracionAviso]);

  const totalPaginas = Math.max(1, Math.ceil(lista.total / tamano));

  function irAPagina(numero) {
    setEstado("cargando");
    setPagina(numero);
  }

  function cambiarTamano(evento) {
    setEstado("cargando");
    setTamano(Number(evento.target.value));
    setPagina(1);
  }

  function reintentar() {
    setEstado("cargando");
    setIntento((n) => n + 1);
  }

  function reemplazar(actualizado) {
    setLista((anterior) => ({
      ...anterior,
      items: anterior.items.map((u) => (u.id === actualizado.id ? actualizado : u)),
    }));
  }

  // Tras crear o editar se actualiza la lista con lo que responde la API (sin volver a pedirla).
  async function guardar(datos) {
    if (formulario.usuario) {
      reemplazar(await actualizarUsuario(formulario.usuario.id, datos));
      setAviso({ variante: "success", texto: "Usuario actualizado." });
    } else {
      const nuevo = await crearUsuario(datos);
      setLista((anterior) => ({
        items: [nuevo, ...anterior.items].slice(0, tamano),
        total: anterior.total + 1,
      }));
      setAviso({ variante: "success", texto: "Usuario creado." });
    }
    setFormulario(null);
  }

  async function cambiarEstado(usuario) {
    const activar = !usuario.activo;
    setProcesandoId(usuario.id);
    try {
      reemplazar(await cambiarEstadoUsuario(usuario.id, activar));
      setAviso({ variante: "success", texto: activar ? "Usuario activado." : "Usuario desactivado." });
    } catch (error) {
      const porDefecto = activar ? "No fue posible activar al usuario." : "No fue posible desactivar al usuario.";
      setAviso({ variante: "error", texto: mensajeDeError(error, porDefecto) });
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <section>
      <EncabezadoPagina
        icono={ICONO_USUARIOS}
        titulo="Usuarios"
        descripcion="Crea y administra los usuarios que ingresan a NailsSpa."
        acciones={<Button onClick={() => setFormulario({ usuario: null })}>Nuevo usuario</Button>}
      />

      {aviso && (
        <Alert variant={aviso.variante} onClose={() => setAviso(null)} className="mt-4">
          {aviso.texto}
        </Alert>
      )}

      <Card className="mt-4">
        {estado === "cargando" && <p role="status">Cargando usuarios…</p>}

        {estado === "error" && (
          <div className="space-y-3">
            <Alert variant="error">{errorCarga}</Alert>
            <Button variant="secondary" onClick={reintentar}>
              Reintentar
            </Button>
          </div>
        )}

        {estado === "listo" && lista.items.length === 0 && <p>No hay usuarios registrados.</p>}

        {estado === "listo" && lista.items.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-marca-borde">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Usuarios del sistema</caption>
              <thead className="bg-marca-enfoque font-heading text-xs uppercase tracking-wider text-marca-primario-hover">
                <tr>
                  {COLUMNAS.map((columna) => (
                    <th
                      key={columna}
                      scope="col"
                      className="px-4 py-3 font-semibold"
                    >
                      {columna}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-marca-borde">
                {lista.items.map((u) => {
                  const esPropio = u.id === sesion?.id;
                  return (
                    <tr key={u.id} className="transition-colors duration-200 hover:bg-marca-superficie-hover">
                      <td className="px-4 py-3 font-semibold text-marca-primario-hover">{u.nombre_completo}</td>
                      <td className="px-4 py-3 text-marca-texto-secundario">{u.correo}</td>
                      <td className="px-4 py-3 text-marca-texto-secundario">{etiquetaRol(u.rol, roles)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <InterruptorEstado
                            activo={u.activo}
                            nombre={u.nombre_completo}
                            deshabilitado={esPropio || procesandoId === u.id}
                            titulo={esPropio ? "No puedes desactivar tu propia cuenta" : undefined}
                            onCambiar={() => cambiarEstado(u)}
                          />
                          <EstadoUsuario activo={u.activo} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="secondary"
                          aria-label={`Editar a ${u.nombre_completo}`}
                          onClick={() => setFormulario({ usuario: u })}
                        >
                          Editar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {estado === "listo" && lista.total > 0 && (
          <nav
            aria-label="Paginación de usuarios"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-center gap-4">
              <Select
                label="Registros por página"
                options={TAMANOS_PAGINA.map((n) => ({ value: String(n), label: String(n) }))}
                value={String(tamano)}
                onChange={cambiarTamano}
              />
              <span>{lista.total} usuarios</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" disabled={pagina <= 1} onClick={() => irAPagina(pagina - 1)}>
                Anterior
              </Button>
              {numerosDePagina(pagina, totalPaginas).map((numero) => (
                <Button
                  key={numero}
                  variant={numero === pagina ? "primary" : "secondary"}
                  aria-label={`Página ${numero}`}
                  aria-current={numero === pagina ? "page" : undefined}
                  onClick={() => irAPagina(numero)}
                >
                  {numero}
                </Button>
              ))}
              <Button variant="secondary" disabled={pagina >= totalPaginas} onClick={() => irAPagina(pagina + 1)}>
                Siguiente
              </Button>
            </div>
          </nav>
        )}
      </Card>

      <Modal
        open={Boolean(formulario)}
        onClose={() => setFormulario(null)}
        title={formulario?.usuario ? "Editar usuario" : "Nuevo usuario"}
      >
        {formulario && (
          <FormularioUsuario
            usuario={formulario.usuario}
            roles={roles}
            onGuardar={guardar}
            onCancelar={() => setFormulario(null)}
          />
        )}
      </Modal>
    </section>
  );
}
