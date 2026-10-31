import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("no renderiza nada si está cerrado", () => {
    render(
      <Modal open={false} title="Confirmar">
        Contenido
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("se muestra como diálogo modal con nombre accesible", () => {
    render(
      <Modal open title="Confirmar acción">
        ¿Seguro?
      </Modal>,
    );
    const dialogo = screen.getByRole("dialog", { name: "Confirmar acción" });
    expect(dialogo).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("¿Seguro?")).toBeInTheDocument();
  });

  it("muestra el pie cuando se envía", () => {
    render(
      <Modal open title="Confirmar" footer={<button type="button">Aceptar</button>}>
        Contenido
      </Modal>,
    );
    expect(screen.getByRole("button", { name: "Aceptar" })).toBeInTheDocument();
  });

  it("mueve el foco al diálogo al abrir", () => {
    render(
      <Modal open title="Confirmar">
        Contenido
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("se cierra con Escape", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Confirmar" onClose={onClose}>
        Contenido
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("se cierra con el botón Cerrar", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Confirmar" onClose={onClose}>
        Contenido
      </Modal>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("se cierra al hacer clic en el fondo, pero no dentro del diálogo", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Confirmar" onClose={onClose}>
        Contenido
      </Modal>,
    );
    fireEvent.mouseDown(screen.getByText("Contenido"));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("no falla si no recibe onClose", () => {
    render(
      <Modal open title="Confirmar">
        Contenido
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
    fireEvent.mouseDown(screen.getByRole("dialog").parentElement);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("atrapa el foco: Tab en el último elemento vuelve al primero", () => {
    render(
      <Modal open title="Confirmar" footer={<button type="button">Aceptar</button>}>
        Contenido
      </Modal>,
    );
    screen.getByRole("button", { name: "Aceptar" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveFocus();
  });

  it("atrapa el foco: Shift+Tab desde el diálogo va al último elemento", () => {
    render(
      <Modal open title="Confirmar" footer={<button type="button">Aceptar</button>}>
        Contenido
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(screen.getByRole("button", { name: "Aceptar" })).toHaveFocus();
  });

  it("deja avanzar el foco con normalidad en medio del diálogo", () => {
    render(
      <Modal open title="Confirmar" footer={<button type="button">Aceptar</button>}>
        Contenido
      </Modal>,
    );
    screen.getByRole("button", { name: "Cerrar" }).focus();
    const evento = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(evento);
    expect(evento.defaultPrevented).toBe(false);
  });

  it("ignora otras teclas", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Confirmar" onClose={onClose}>
        Contenido
      </Modal>,
    );
    fireEvent.keyDown(document, { key: "a" });
    expect(onClose).not.toHaveBeenCalled();
  });

  it("bloquea el scroll mientras está abierto y devuelve el foco al cerrar", () => {
    function Ejemplo() {
      const [abierto, setAbierto] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setAbierto(true)}>
            Abrir
          </button>
          <Modal open={abierto} title="Confirmar" onClose={() => setAbierto(false)}>
            Contenido
          </Modal>
        </>
      );
    }
    render(<Ejemplo />);
    const disparador = screen.getByRole("button", { name: "Abrir" });
    disparador.focus();
    fireEvent.click(disparador);
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("dialog")).toHaveFocus();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
    expect(disparador).toHaveFocus();
  });

  it("acepta className adicional", () => {
    render(
      <Modal open title="Confirmar" className="max-w-sm">
        Contenido
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("max-w-sm");
  });
});
