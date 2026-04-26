import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App";
import { mockSpec } from "./test/mocks";

describe("App", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra loading al inicio", () => {
    vi.spyOn(global, "fetch").mockImplementation(
      () => new Promise(() => {})
    );
    render(<App />);
    expect(
      screen.getByText("Cargando generador de avatares…")
    ).toBeInTheDocument();
  });

  it("muestra error cuando fetch falla", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("fail"));
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("No se pudo conectar")).toBeInTheDocument();
    });
  });

  it("renderiza el editor después de cargar", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSpec),
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Personaliza tu avatar")).toBeInTheDocument();
    });
  });

  it("muestra el header con título", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSpec),
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Avatares")).toBeInTheDocument();
    });
  });

  it("muestra botones de acción", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSpec),
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Aleatorio")).toBeInTheDocument();
      expect(screen.getByText("Descargar")).toBeInTheDocument();
      expect(screen.getByText("Guardar")).toBeInTheDocument();
    });
  });

  it("muestra tabs de navegación", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSpec),
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Editor/)).toBeInTheDocument();
      expect(screen.getByText(/Galería/)).toBeInTheDocument();
    });
  });

  it("muestra el footer", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSpec),
    });
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Avatares v2.0")).toBeInTheDocument();
      expect(screen.getByText("Proyecto DevOps")).toBeInTheDocument();
    });
  });

  it("muestra error con botón de reintentar", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("fail"));
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Reintentar")).toBeInTheDocument();
    });
  });

  it("renderiza imagen del avatar", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSpec),
    });
    render(<App />);
    await waitFor(() => {
      const img = screen.getByAltText("Tu avatar personalizado");
      expect(img).toBeInTheDocument();
      expect(img.src).toContain("/api/avatar?");
    });
  });
});
