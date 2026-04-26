import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Gallery from "./Gallery";
import { mockGalleryItems } from "./test/mocks";

describe("Gallery", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("muestra spinner mientras carga", () => {
    vi.spyOn(global, "fetch").mockImplementation(
      () => new Promise(() => {}) // nunca resuelve
    );
    render(<Gallery />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("muestra estado vacío cuando no hay avatares", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    render(<Gallery />);
    await waitFor(() => {
      expect(screen.getByText("La galería está vacía")).toBeInTheDocument();
    });
  });

  it("renderiza avatares de la galería", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGalleryItems),
    });
    render(<Gallery />);
    await waitFor(() => {
      expect(screen.getByText("Avatar Test")).toBeInTheDocument();
      expect(screen.getByText("Avatar Dos")).toBeInTheDocument();
    });
  });

  it("muestra imágenes con src correcto", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGalleryItems),
    });
    render(<Gallery />);
    await waitFor(() => {
      const images = screen.getAllByRole("img");
      expect(images[0]).toHaveAttribute(
        "src",
        "/api/avatar?eyes=DEFAULT&mouth=SMILE"
      );
    });
  });

  it("maneja errores de fetch mostrando galería vacía", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));
    render(<Gallery />);
    await waitFor(() => {
      expect(screen.getByText("La galería está vacía")).toBeInTheDocument();
    });
  });
});
