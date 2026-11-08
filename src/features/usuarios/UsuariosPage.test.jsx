import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ErrorApi } from "../../api/cliente";
import * as identidad from "../../api/identidad";
import { AuthContext } from "../auth/AuthContext";
import { UsuariosPage } from "./UsuariosPage";

vi.mock("../../api/identidad");

const ROLES = [
  { codigo: "ADMINISTRADOR", nombre: "Administrador", permisos: [] },
  { codigo: "MANICURISTA", nombre: "Manicurista", permisos: [] },
  { codigo: "GERENTE", nombre: "Gerente", permisos: [] },
];
const LAURA = { id: "u1", correo: "admin@spa.co", nombre_completo: "Laura Gómez", rol: "ADMINISTRADOR", activo: true, creado_en: "2026-10-01T08:00:00-05:00" };
const DIANA = { id: "u2", correo: "manicurista@spa.co", nombre_completo: "Diana Pérez", rol: "MANICURISTA", activo: true, creado_en: "2026-10-02T08:00:00-05:00" };
const CARLOS = { id: "u3", correo: "gerente@spa.co", nombre_completo: "Carlos Rojas", rol: "GERENTE", activo: false, creado_en: "2026-10-03T08:00:00-05:00" };

function renderizar({ usuarios = [LAURA, DIANA, CARLOS], total = usuarios.length, ...props } = {}) {
  identidad.listarUsuarios.mockResolvedValue({ items: usuarios, total, page: 1, size: 10 });
  identidad.listarRoles.mockResolvedValue(ROLES);
  return render(
    <AuthContext.Provider value={{ usuario: { id: "u1", permisos: ["usuario.gestionar"] } }}>
      <UsuariosPage {...props} />
    </AuthContext.Provider>,
  );
}

const fila = (nombre) => screen.getByRole("row", { name: new RegExp(nombre) });

function llenarFormulario({ nombre, correo, rol, contrasena }) {
  fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: nombre } });
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: correo } });
  fireEvent.change(screen.getByLabelText("Rol"), { target: { value: rol } });
  fireEvent.change(screen.getByLabelText("Contraseña temporal"), { target: { value: contrasena } });
}

describe("UsuariosPage · lista", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra cargando y luego la tabla con nombre, usuario, rol y estado", async () => {
    renderizar();
    expect(screen.getByRole("heading", { name: "Usuarios" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando usuarios");
    expect(await screen.findByRole("table", { name: "Usuarios del sistema" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").map((c) => c.textContent)).toEqual([
      "Nombre",
      "Usuario",
      "Rol",
      "Estado",
      "Acciones",
    ]);
    expect(within(fila("Diana Pérez")).getByText("manicurista@spa.co")).toBeInTheDocument();
    expect(within(fila("Diana Pérez")).getByText("Manicurista")).toBeInTheDocument();
    expect(within(fila("Diana Pérez")).getByText("Activo")).toBeInTheDocument();
    expect(within(fila("Carlos Rojas")).getByText("Desactivado")).toBeInTheDocument();
    expect(identidad.listarUsuarios).toHaveBeenCalledWith({ page: 1, size: 10 });
  });

  it("muestra el estado de cada cuenta en un interruptor", async () => {
    renderizar();
    await screen.findByRole("table");
    expect(screen.getByRole("switch", { name: "Cuenta de Diana Pérez" })).toBeChecked();
    expect(screen.getByRole("switch", { name: "Cuenta de Carlos Rojas" })).not.toBeChecked();
  });

  it("muestra un mensaje cuando no hay usuarios", async () => {
    renderizar({ usuarios: [] });
    expect(await screen.findByText("No hay usuarios registrados.")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("si falla la carga muestra el error y permite reintentar", async () => {
    identidad.listarUsuarios.mockRejectedValueOnce(new ErrorApi({ code: "SIN_CONEXION" }));
    identidad.listarRoles.mockResolvedValue(ROLES);
    render(
      <AuthContext.Provider value={{ usuario: { id: "u1" } }}>
        <UsuariosPage />
      </AuthContext.Provider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");
    identidad.listarUsuarios.mockResolvedValue({ items: [LAURA], total: 1, page: 1, size: 10 });
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Laura Gómez")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("usa un mensaje genérico cuando el code no es conocido", async () => {
    identidad.listarUsuarios.mockRejectedValue(new ErrorApi({ code: "RARO" }));
    identidad.listarRoles.mockResolvedValue(ROLES);
    render(
      <AuthContext.Provider value={{ usuario: { id: "u1" } }}>
        <UsuariosPage />
      </AuthContext.Provider>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("No fue posible cargar los usuarios.");
  });
});

describe("UsuariosPage · paginación", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra anterior, siguiente y números de página, y navega entre páginas", async () => {
    renderizar({ usuarios: [LAURA], total: 25 });
    expect(await screen.findByText("25 usuarios")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Página 3" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Siguiente" }));
    await waitFor(() => expect(identidad.listarUsuarios).toHaveBeenCalledWith({ page: 2, size: 10 }));
    expect(await screen.findByRole("button", { name: "Página 2" })).toHaveAttribute("aria-current", "page");

    fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
    await waitFor(() => expect(identidad.listarUsuarios).toHaveBeenLastCalledWith({ page: 3, size: 10 }));
    expect(await screen.findByRole("button", { name: "Siguiente" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
    await waitFor(() => expect(identidad.listarUsuarios).toHaveBeenLastCalledWith({ page: 2, size: 10 }));
  });

  it("permite elegir 10, 25 o 50 registros por página y vuelve a la primera", async () => {
    renderizar({ usuarios: [LAURA], total: 60 });
    const selector = await screen.findByLabelText("Registros por página");
    expect([...selector.options].map((o) => o.value)).toEqual(["10", "25", "50"]);

    fireEvent.click(screen.getByRole("button", { name: "Página 2" }));
    await waitFor(() => expect(identidad.listarUsuarios).toHaveBeenLastCalledWith({ page: 2, size: 10 }));

    fireEvent.change(await screen.findByLabelText("Registros por página"), { target: { value: "25" } });
    await waitFor(() => expect(identidad.listarUsuarios).toHaveBeenLastCalledWith({ page: 1, size: 25 }));
    expect(await screen.findByRole("button", { name: "Página 3" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Página 4" })).not.toBeInTheDocument();
  });
});

describe("UsuariosPage · alta", () => {
  beforeEach(() => vi.resetAllMocks());

  async function abrirAlta() {
    renderizar();
    await screen.findByRole("table");
    fireEvent.click(screen.getByRole("button", { name: "Nuevo usuario" }));
    return screen.findByRole("dialog", { name: "Nuevo usuario" });
  }

  it("valida los campos y no llama a la API si hay errores", async () => {
    await abrirAlta();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByLabelText("Nombre completo")).toHaveAccessibleDescription("Ingresa el nombre completo.");
    expect(screen.getByLabelText("Correo")).toHaveAccessibleDescription("Ingresa el correo.");
    expect(screen.getByLabelText("Rol")).toHaveAccessibleDescription("Selecciona un rol.");
    expect(screen.getByLabelText("Contraseña temporal")).toHaveAccessibleDescription(/Mínimo 8 caracteres\./);
    expect(screen.getByLabelText("Nombre completo")).toHaveFocus();
    expect(identidad.crearUsuario).not.toHaveBeenCalled();
  });

  it("al escribir en un campo se limpia su error", async () => {
    await abrirAlta();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Camila" } });
    expect(screen.getByLabelText("Nombre completo")).not.toHaveAttribute("aria-invalid");
    expect(screen.getByLabelText("Correo")).toHaveAttribute("aria-invalid", "true");
  });

  it("crea el usuario, lo muestra en la lista, avisa y cierra el modal", async () => {
    await abrirAlta();
    const NUEVA = { id: "u9", correo: "camila@spa.co", nombre_completo: "Camila Rojas", rol: "MANICURISTA", activo: true, creado_en: "2026-11-01T08:00:00-05:00" };
    identidad.crearUsuario.mockResolvedValue(NUEVA);
    llenarFormulario({ nombre: "  Camila Rojas ", correo: " camila@spa.co ", rol: "MANICURISTA", contrasena: "Temporal-2026" });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Usuario creado.")).toBeInTheDocument();
    expect(identidad.crearUsuario).toHaveBeenCalledWith({
      correo: "camila@spa.co",
      nombre_completo: "Camila Rojas",
      rol: "MANICURISTA",
      contrasena_temporal: "Temporal-2026",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(fila("Camila Rojas")).getByText("camila@spa.co")).toBeInTheDocument();
  });

  it("muestra el aviso del servidor cuando el correo ya existe y deja abierto el modal", async () => {
    await abrirAlta();
    identidad.crearUsuario.mockRejectedValue(new ErrorApi({ status: 409, code: "CODIGO_DUPLICADO" }));
    llenarFormulario({ nombre: "Camila Rojas", correo: "admin@spa.co", rol: "GERENTE", contrasena: "Temporal-2026" });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un usuario con ese correo.");
    expect(screen.getByRole("dialog", { name: "Nuevo usuario" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  });

  it("muestra los errores por campo que devuelve el servidor (422)", async () => {
    await abrirAlta();
    identidad.crearUsuario.mockRejectedValue(
      new ErrorApi({ status: 422, code: "DATOS_INVALIDOS", errors: [{ campo: "contrasena_temporal", mensaje: "Contraseña muy débil" }] }),
    );
    llenarFormulario({ nombre: "Camila Rojas", correo: "camila@spa.co", rol: "GERENTE", contrasena: "Temporal-2026" });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(screen.getByLabelText("Contraseña temporal")).toHaveAccessibleDescription(/Contraseña muy débil/));
    expect(screen.getByLabelText("Contraseña temporal")).toHaveFocus();
  });

  it("avisa cuando la función aún no está disponible en el servidor (501)", async () => {
    await abrirAlta();
    identidad.crearUsuario.mockRejectedValue(new ErrorApi({ status: 501, code: "NO_IMPLEMENTADO" }));
    llenarFormulario({ nombre: "Camila Rojas", correo: "camila@spa.co", rol: "GERENTE", contrasena: "Temporal-2026" });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("aún no está disponible en el servidor");
  });

  it("usa un mensaje genérico si el error no tiene mensaje propio", async () => {
    await abrirAlta();
    identidad.crearUsuario.mockRejectedValue(new ErrorApi({ code: "RARO" }));
    llenarFormulario({ nombre: "Camila Rojas", correo: "camila@spa.co", rol: "GERENTE", contrasena: "Temporal-2026" });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No fue posible guardar el usuario.");
  });

  it("cancelar cierra el modal sin llamar a la API", async () => {
    await abrirAlta();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(identidad.crearUsuario).not.toHaveBeenCalled();
  });
});

describe("UsuariosPage · edición", () => {
  beforeEach(() => vi.resetAllMocks());

  it("edita nombre y rol, con el correo bloqueado, y actualiza la fila", async () => {
    renderizar();
    await screen.findByRole("table");
    fireEvent.click(screen.getByRole("button", { name: "Editar a Diana Pérez" }));
    expect(await screen.findByRole("dialog", { name: "Editar usuario" })).toBeInTheDocument();
    expect(screen.getByLabelText("Correo")).toBeDisabled();
    expect(screen.getByLabelText("Correo")).toHaveValue("manicurista@spa.co");
    expect(screen.queryByLabelText("Contraseña temporal")).not.toBeInTheDocument();

    identidad.actualizarUsuario.mockResolvedValue({ ...DIANA, nombre_completo: "Diana P. Ruiz", rol: "GERENTE" });
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "Diana P. Ruiz" } });
    fireEvent.change(screen.getByLabelText("Rol"), { target: { value: "GERENTE" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Usuario actualizado.")).toBeInTheDocument();
    expect(identidad.actualizarUsuario).toHaveBeenCalledWith("u2", { nombre_completo: "Diana P. Ruiz", rol: "GERENTE" });
    expect(within(fila("Diana P. Ruiz")).getByText("Gerente")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("valida el nombre al editar", async () => {
    renderizar();
    await screen.findByRole("table");
    fireEvent.click(screen.getByRole("button", { name: "Editar a Diana Pérez" }));
    await screen.findByRole("dialog");
    fireEvent.change(screen.getByLabelText("Nombre completo"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(screen.getByLabelText("Nombre completo")).toHaveAccessibleDescription("Ingresa el nombre completo.");
    expect(identidad.actualizarUsuario).not.toHaveBeenCalled();
  });
});

describe("UsuariosPage · activar y desactivar", () => {
  beforeEach(() => vi.resetAllMocks());

  it("desactiva a un usuario con el interruptor, sin ventana de confirmación", async () => {
    renderizar();
    await screen.findByRole("table");
    identidad.cambiarEstadoUsuario.mockResolvedValue({ ...DIANA, activo: false });
    fireEvent.click(screen.getByRole("switch", { name: "Cuenta de Diana Pérez" }));
    expect(await screen.findByText("Usuario desactivado.")).toBeInTheDocument();
    expect(identidad.cambiarEstadoUsuario).toHaveBeenCalledWith("u2", false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Cuenta de Diana Pérez" })).not.toBeChecked();
    expect(within(fila("Diana Pérez")).getByText("Desactivado")).toBeInTheDocument();
  });

  it("activa a un usuario desactivado con el interruptor", async () => {
    renderizar();
    await screen.findByRole("table");
    identidad.cambiarEstadoUsuario.mockResolvedValue({ ...CARLOS, activo: true });
    fireEvent.click(screen.getByRole("switch", { name: "Cuenta de Carlos Rojas" }));
    expect(await screen.findByText("Usuario activado.")).toBeInTheDocument();
    expect(identidad.cambiarEstadoUsuario).toHaveBeenCalledWith("u3", true);
    expect(screen.getByRole("switch", { name: "Cuenta de Carlos Rojas" })).toBeChecked();
    expect(within(fila("Carlos Rojas")).getByText("Activo")).toBeInTheDocument();
  });

  it("mientras guarda el cambio, bloquea ese interruptor", async () => {
    renderizar();
    await screen.findByRole("table");
    let resolver;
    identidad.cambiarEstadoUsuario.mockReturnValue(new Promise((r) => (resolver = r)));
    fireEvent.click(screen.getByRole("switch", { name: "Cuenta de Diana Pérez" }));
    await waitFor(() => expect(screen.getByRole("switch", { name: "Cuenta de Diana Pérez" })).toBeDisabled());
    resolver({ ...DIANA, activo: false });
    await waitFor(() => expect(screen.getByRole("switch", { name: "Cuenta de Diana Pérez" })).toBeEnabled());
  });

  it.each([
    ["Diana Pérez", "No fue posible desactivar al usuario."],
    ["Carlos Rojas", "No fue posible activar al usuario."],
  ])("si falla el cambio de %s, muestra el error, deja el estado y permite cerrar el aviso", async (nombre, texto) => {
    renderizar();
    await screen.findByRole("table");
    identidad.cambiarEstadoUsuario.mockRejectedValue(new ErrorApi({ code: "RARO" }));
    fireEvent.click(screen.getByRole("switch", { name: `Cuenta de ${nombre}` }));
    expect(await screen.findByRole("alert")).toHaveTextContent(texto);
    fireEvent.click(screen.getByRole("button", { name: "Cerrar alerta" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("muestra el mensaje por code cuando el servidor rechaza el cambio", async () => {
    renderizar();
    await screen.findByRole("table");
    identidad.cambiarEstadoUsuario.mockRejectedValue(new ErrorApi({ code: "SIN_PERMISO" }));
    fireEvent.click(screen.getByRole("switch", { name: "Cuenta de Diana Pérez" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso");
  });

  it("no deja desactivar la propia cuenta", async () => {
    renderizar();
    await screen.findByRole("table");
    const propio = screen.getByRole("switch", { name: "Cuenta de Laura Gómez" });
    expect(propio).toBeDisabled();
    expect(propio).toHaveAttribute("title", "No puedes desactivar tu propia cuenta");
    expect(screen.getByRole("switch", { name: "Cuenta de Diana Pérez" })).toBeEnabled();
  });
});

describe("UsuariosPage · avisos de 4 segundos", () => {
  beforeEach(() => vi.resetAllMocks());

  it("el aviso de éxito se cierra solo", async () => {
    renderizar({ duracionAviso: 30 });
    await screen.findByRole("table");
    identidad.cambiarEstadoUsuario.mockResolvedValue({ ...CARLOS, activo: true });
    fireEvent.click(screen.getByRole("switch", { name: "Cuenta de Carlos Rojas" }));
    expect(await screen.findByText("Usuario activado.")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Usuario activado.")).not.toBeInTheDocument());
  });

  it("el aviso de error se queda hasta que se cierra a mano", async () => {
    renderizar({ duracionAviso: 30 });
    await screen.findByRole("table");
    identidad.cambiarEstadoUsuario.mockRejectedValue(new ErrorApi({ code: "SIN_CONEXION" }));
    fireEvent.click(screen.getByRole("switch", { name: "Cuenta de Diana Pérez" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await new Promise((resolver) => setTimeout(resolver, 120));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
