import axios from "axios";
import { ErrorApi } from "./cliente";
import { cambiarContrasena } from "./supabase";

const URL = "https://proyecto.supabase.co";
const CLAVE = "sb_publishable_prueba";

describe("cambiarContrasena", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("modo simulado", () => {
    it("acepta cualquier token y no sale a la red", async () => {
      const put = vi.spyOn(axios, "put");
      await expect(cambiarContrasena("token", "Clave-2026", { simulado: true })).resolves.toEqual({});
      expect(put).not.toHaveBeenCalled();
    });

    it("sin token responde como un enlace inválido", async () => {
      await expect(cambiarContrasena("", "Clave-2026", { simulado: true })).rejects.toMatchObject({ status: 401 });
    });
  });

  describe("contra Supabase", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_SUPABASE_URL", `${URL}/`);
      vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", CLAVE);
    });

    it("hace PUT /auth/v1/user con la clave pública y el token del enlace", async () => {
      const put = vi.spyOn(axios, "put").mockResolvedValue({ data: { id: "u1" } });
      await expect(cambiarContrasena("tok.en", "Clave-2026", { simulado: false })).resolves.toEqual({ id: "u1" });
      expect(put).toHaveBeenCalledWith(
        `${URL}/auth/v1/user`,
        { password: "Clave-2026" },
        { timeout: 15000, headers: { apikey: CLAVE, Authorization: "Bearer tok.en" } },
      );
    });

    it("convierte el error de Supabase en ErrorApi con su code", async () => {
      vi.spyOn(axios, "put").mockRejectedValue({
        response: { status: 422, data: { error_code: "same_password", msg: "New password should be different" } },
      });
      const error = await cambiarContrasena("t", "x", { simulado: false }).catch((e) => e);
      expect(error).toBeInstanceOf(ErrorApi);
      expect(error).toMatchObject({ status: 422, code: "same_password", message: "New password should be different" });
    });

    it("lee el code también del formato anterior y usa un code genérico si falta", async () => {
      vi.spyOn(axios, "put").mockRejectedValueOnce({ response: { status: 401, data: { code: "bad_jwt" } } });
      await expect(cambiarContrasena("t", "x", { simulado: false })).rejects.toMatchObject({ code: "bad_jwt" });
      vi.spyOn(axios, "put").mockRejectedValueOnce({ response: { status: 500 } });
      await expect(cambiarContrasena("t", "x", { simulado: false })).rejects.toMatchObject({ code: "ERROR_HTTP" });
    });

    it("sin respuesta del servidor falla con SIN_CONEXION", async () => {
      vi.spyOn(axios, "put").mockRejectedValue(new Error("Network Error"));
      await expect(cambiarContrasena("t", "x", { simulado: false })).rejects.toMatchObject({ code: "SIN_CONEXION" });
    });
  });

  it("sin configurar Supabase falla con SIN_CONFIGURAR sin salir a la red", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    const put = vi.spyOn(axios, "put");
    await expect(cambiarContrasena("t", "x", { simulado: false })).rejects.toMatchObject({ code: "SIN_CONFIGURAR" });
    expect(put).not.toHaveBeenCalled();
  });
});
