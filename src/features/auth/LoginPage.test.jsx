import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import { LoginPage } from "./LoginPage";
import { validarLogin } from "./validacion";

function renderizar(iniciarSesion = vi.fn().mockResolvedValue({})) {
  render(
    <AuthContext.Provider value={{ iniciarSesion }}>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/inventario" element={<p>Pantalla de inventario</p>} />
          <Route path="/recuperar" element={<p>Pantalla de recuperar</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  );
  return iniciarSesion;
}

const correo = () => screen.getByLabelText("Correo");
const contrasena = () => screen.getByLabelText("Contraseña");
const ingresar = () => screen.getByRole("button", { name: /Ingresar|Ingresando/ });

function completar(valorCorreo, valorContrasena) {
  fireEvent.change(correo(), { target: { value: valorCorreo } });
  fireEvent.change(contrasena(), { target: { value: valorContrasena } });
}

describe("validarLogin", () => {
  it("acepta datos correctos", () => {
    expect(validarLogin({ correo: "admin@spa.co", contrasena: "spa12345" })).toEqual({});
  });

  it("pide correo y contraseña cuando están vacíos", () => {
    expect(validarLogin({ correo: "   ", contrasena: "" })).toEqual({
      correo: "Ingresa tu correo.",
      contrasena: "Ingresa tu contraseña.",
    });
  });

  it("rechaza un correo sin formato válido", () => {
    expect(validarLogin({ correo: "ana@", contrasena: "spa12345" }).correo).toMatch("correo válido");
  });

  it("rechaza una contraseña de menos de 8 caracteres", () => {
    expect(validarLogin({ correo: "admin@spa.co", contrasena: "corta" }).contrasena).toMatch("al menos 8");
  });
});

describe("LoginPage", () => {
  it("muestra la identidad, los campos y el enlace para recuperar la contraseña", () => {
    renderizar();
    expect(screen.getByRole("heading", { name: "Spa de Uñas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Ingresar" })).toBeInTheDocument();
    expect(correo()).toHaveAttribute("type", "email");
    expect(contrasena()).toHaveAttribute("type", "password");
    expect(screen.getByRole("link", { name: "¿Olvidaste tu contraseña?" })).toHaveAttribute("href", "/recuperar");
  });

  it("muestra el logo de la marca como imagen decorativa", () => {
    renderizar();
    const logo = document.querySelector("img");
    expect(logo).toHaveAttribute("src", "/logo.png");
    expect(logo).toHaveAttribute("alt", "");
  });

  it("con el formulario vacío muestra un mensaje por campo, enfoca el primero y no llama a la API", () => {
    const iniciarSesion = renderizar();
    fireEvent.click(ingresar());
    expect(correo()).toHaveAccessibleDescription("Ingresa tu correo.");
    expect(contrasena()).toHaveAccessibleDescription("Ingresa tu contraseña.");
    expect(correo()).toHaveAttribute("aria-invalid", "true");
    expect(correo()).toHaveFocus();
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  it("enfoca la contraseña cuando solo ella tiene error", () => {
    renderizar();
    completar("admin@spa.co", "corta");
    fireEvent.click(ingresar());
    expect(contrasena()).toHaveAccessibleDescription("La contraseña debe tener al menos 8 caracteres.");
    expect(contrasena()).toHaveFocus();
  });

  it("valida el formato del correo", () => {
    const iniciarSesion = renderizar();
    completar("ana@", "spa12345");
    fireEvent.click(ingresar());
    expect(correo()).toHaveAccessibleDescription(/correo válido/);
    expect(iniciarSesion).not.toHaveBeenCalled();
  });

  it("al escribir en un campo se limpia su mensaje de error", () => {
    renderizar();
    fireEvent.click(ingresar());
    fireEvent.change(correo(), { target: { value: "a" } });
    expect(correo()).not.toHaveAttribute("aria-invalid");
    expect(contrasena()).toHaveAttribute("aria-invalid", "true");
  });

  it("con datos válidos inicia sesión (sin espacios en el correo) y va al inventario", async () => {
    const iniciarSesion = renderizar();
    completar("  admin@spa.co  ", "spa12345");
    fireEvent.click(ingresar());
    expect(await screen.findByText("Pantalla de inventario")).toBeInTheDocument();
    expect(iniciarSesion).toHaveBeenCalledWith("admin@spa.co", "spa12345");
  });

  it("mientras envía, desactiva el botón y lo indica", async () => {
    let resolver;
    renderizar(vi.fn(() => new Promise((resolverPromesa) => (resolver = resolverPromesa))));
    completar("admin@spa.co", "spa12345");
    fireEvent.click(ingresar());
    expect(await screen.findByRole("button", { name: "Ingresando…" })).toBeDisabled();
    resolver({});
    expect(await screen.findByText("Pantalla de inventario")).toBeInTheDocument();
  });

  it.each([
    ["CREDENCIALES_INVALIDAS", "Correo o contraseña incorrectos."],
    ["USUARIO_INACTIVO", "Tu cuenta está desactivada. Consulta con la administración."],
    ["SIN_CONEXION", "No hay conexión con el servidor."],
    ["CODIGO_NUEVO", "No fue posible iniciar sesión."],
  ])("muestra el mensaje del code %s", async (code, texto) => {
    renderizar(vi.fn().mockRejectedValue({ code }));
    completar("admin@spa.co", "spa12345");
    fireEvent.click(ingresar());
    expect(await screen.findByText(new RegExp(texto))).toBeInTheDocument();
    await waitFor(() => expect(ingresar()).toBeEnabled());
  });

  it("las credenciales inválidas y el usuario inactivo usan avisos distintos", async () => {
    renderizar(vi.fn().mockRejectedValueOnce({ code: "USUARIO_INACTIVO" }).mockRejectedValueOnce({ code: "CREDENCIALES_INVALIDAS" }));
    completar("admin@spa.co", "spa12345");
    fireEvent.click(ingresar());
    expect(await screen.findByRole("alert")).toHaveTextContent("desactivada");
    fireEvent.click(ingresar());
    expect(await screen.findByRole("alert")).toHaveTextContent("incorrectos");
  });

  it("el aviso se quita al volver a intentar con datos inválidos", async () => {
    renderizar(vi.fn().mockRejectedValue({ code: "CREDENCIALES_INVALIDAS" }));
    completar("admin@spa.co", "spa12345");
    fireEvent.click(ingresar());
    await screen.findByRole("alert");
    fireEvent.change(contrasena(), { target: { value: "x" } });
    fireEvent.click(ingresar());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
