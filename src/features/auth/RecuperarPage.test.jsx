import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import * as identidad from "../../api/identidad";
import * as supabase from "../../api/supabase";
import { ErrorApi } from "../../api/cliente";
import { RecuperarPage } from "./RecuperarPage";

vi.mock("../../api/identidad");
vi.mock("../../api/supabase");

const MENSAJE = "Si el correo está registrado, recibirá un enlace para restablecer la contraseña.";
const ENLACE = "/recuperar#access_token=tok.en&expires_in=3600&type=recovery";

function Ubicacion() {
  const { pathname, hash } = useLocation();
  return <output data-testid="ubicacion">{pathname + hash}</output>;
}

function renderizar(entrada = "/recuperar") {
  render(
    <MemoryRouter initialEntries={[entrada]}>
      <Routes>
        <Route path="/recuperar" element={<><RecuperarPage /><Ubicacion /></>} />
        <Route path="/login" element={<p>Pantalla de login</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

// La tarjeta también se llama "Nueva contraseña": se pide el <input>.
const campo = (etiqueta) => screen.getByLabelText(etiqueta, { selector: "input" });
const escribir = (etiqueta, valor) => fireEvent.change(campo(etiqueta), { target: { value: valor } });
const boton = (nombre) => screen.getByRole("button", { name: nombre });

describe("RecuperarPage · solicitud", () => {
  beforeEach(() => vi.resetAllMocks());

  it("muestra el formulario y el enlace para volver a ingresar", () => {
    renderizar();
    expect(screen.getByRole("heading", { name: "Recuperar contraseña" })).toBeInTheDocument();
    expect(campo("Correo")).toHaveAttribute("type", "email");
    expect(screen.getByRole("link", { name: "Volver a ingresar" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("no llama a la API con el correo vacío o mal escrito y deja el foco en el campo", () => {
    renderizar();
    fireEvent.click(boton("Enviar enlace"));
    expect(screen.getByText("Ingresa tu correo.")).toBeInTheDocument();
    expect(campo("Correo")).toHaveFocus();
    escribir("Correo", "ana@");
    fireEvent.click(boton("Enviar enlace"));
    expect(screen.getByText(/correo válido/)).toBeInTheDocument();
    expect(identidad.recuperarContrasena).not.toHaveBeenCalled();
  });

  it("envía el correo sin espacios y muestra el mensaje de la API en lugar del formulario", async () => {
    identidad.recuperarContrasena.mockResolvedValue({ mensaje: MENSAJE });
    renderizar();
    escribir("Correo", "  ana@spa.co ");
    fireEvent.click(boton("Enviar enlace"));
    expect(boton("Enviando…")).toBeDisabled();
    expect(await screen.findByText(MENSAJE)).toBeInTheDocument();
    expect(identidad.recuperarContrasena).toHaveBeenCalledWith("ana@spa.co");
    expect(screen.queryByLabelText("Correo")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a ingresar" })).toBeInTheDocument();
  });

  it("explica la falta de conexión y deja volver a intentar", async () => {
    identidad.recuperarContrasena.mockRejectedValueOnce(new ErrorApi({ status: 0, code: "SIN_CONEXION" }));
    renderizar();
    escribir("Correo", "ana@spa.co");
    fireEvent.click(boton("Enviar enlace"));
    expect(await screen.findByRole("alert")).toHaveTextContent("No hay conexión con el servidor");
    identidad.recuperarContrasena.mockResolvedValueOnce({ mensaje: MENSAJE });
    fireEvent.click(boton("Enviar enlace"));
    expect(await screen.findByText(MENSAJE)).toBeInTheDocument();
  });

  it("ante cualquier otro error muestra un mensaje genérico", async () => {
    identidad.recuperarContrasena.mockRejectedValue(new ErrorApi({ status: 500, code: "ERROR_INTERNO" }));
    renderizar();
    escribir("Correo", "ana@spa.co");
    fireEvent.click(boton("Enviar enlace"));
    expect(await screen.findByRole("alert")).toHaveTextContent("No fue posible enviar la solicitud");
  });

  it("si el enlace del correo venció, avisa y deja pedir otro", () => {
    renderizar("/recuperar#error=access_denied&error_code=otp_expired");
    expect(screen.getByRole("alert")).toHaveTextContent("ya venció");
    expect(campo("Correo")).toBeInTheDocument();
  });
});

describe("RecuperarPage · nueva contraseña", () => {
  beforeEach(() => vi.resetAllMocks());

  it("con el enlace del correo muestra los dos campos y borra el token de la dirección", async () => {
    renderizar(ENLACE);
    expect(screen.getByRole("heading", { name: "Nueva contraseña" })).toBeInTheDocument();
    expect(campo("Nueva contraseña")).toHaveAttribute("type", "password");
    expect(campo("Repite la contraseña")).toHaveAttribute("autocomplete", "new-password");
    await waitFor(() => expect(screen.getByTestId("ubicacion")).toHaveTextContent(/^\/recuperar$/));
    expect(screen.getByRole("heading", { name: "Nueva contraseña" })).toBeInTheDocument();
  });

  it("valida longitud y coincidencia sin llamar a Supabase", () => {
    renderizar(ENLACE);
    fireEvent.click(boton("Guardar contraseña"));
    expect(screen.getByText("Escribe la nueva contraseña.")).toBeInTheDocument();
    expect(campo("Nueva contraseña")).toHaveFocus();
    escribir("Nueva contraseña", "Clave-2026");
    escribir("Repite la contraseña", "Clave-2027");
    fireEvent.click(boton("Guardar contraseña"));
    expect(screen.getByText("Las contraseñas no coinciden.")).toBeInTheDocument();
    expect(campo("Repite la contraseña")).toHaveFocus();
    expect(supabase.cambiarContrasena).not.toHaveBeenCalled();
  });

  it("cambia la contraseña con el token del enlace y ofrece ir a ingresar", async () => {
    supabase.cambiarContrasena.mockResolvedValue({});
    renderizar(ENLACE);
    escribir("Nueva contraseña", "Clave-2026");
    escribir("Repite la contraseña", "Clave-2026");
    fireEvent.click(boton("Guardar contraseña"));
    expect(boton("Guardando…")).toBeDisabled();
    expect(await screen.findByText(/Ya puedes ingresar con tu nueva contraseña/)).toBeInTheDocument();
    expect(supabase.cambiarContrasena).toHaveBeenCalledWith("tok.en", "Clave-2026");
    expect(screen.getByRole("link", { name: "Ir a ingresar" })).toHaveAttribute("href", "/login");
  });

  it("muestra el motivo cuando Supabase rechaza la contraseña", async () => {
    supabase.cambiarContrasena.mockRejectedValue(new ErrorApi({ status: 422, code: "same_password" }));
    renderizar(ENLACE);
    escribir("Nueva contraseña", "Clave-2026");
    escribir("Repite la contraseña", "Clave-2026");
    fireEvent.click(boton("Guardar contraseña"));
    expect(await screen.findByRole("alert")).toHaveTextContent("distinta de la actual");
    expect(screen.queryByRole("button", { name: "Pedir otro enlace" })).not.toBeInTheDocument();
  });

  it("si el enlace venció ofrece pedir otro y vuelve a la solicitud con el aviso", async () => {
    supabase.cambiarContrasena.mockRejectedValue(new ErrorApi({ status: 401, code: "bad_jwt" }));
    renderizar(ENLACE);
    escribir("Nueva contraseña", "Clave-2026");
    escribir("Repite la contraseña", "Clave-2026");
    fireEvent.click(boton("Guardar contraseña"));
    fireEvent.click(await screen.findByRole("button", { name: "Pedir otro enlace" }));
    expect(screen.getByRole("heading", { name: "Recuperar contraseña" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("ya venció");
    expect(campo("Correo")).toBeInTheDocument();
  });
});
