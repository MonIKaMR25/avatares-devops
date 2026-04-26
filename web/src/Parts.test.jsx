import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Parts from "./Parts";
import { mockSpec } from "./test/mocks";

describe("Parts", () => {
  const defaultChoices = {
    eyebrows: "DEFAULT",
    eyes: "DEFAULT",
    mouth: "SMILE",
    skin_color: "#FBD2C7",
    top: "BUN",
    hair_color: "#262E33",
    facial_hair: "NONE",
    facial_hair_color: "#262E33",
  };

  it("renderiza null cuando no hay spec", () => {
    const { container } = render(
      <Parts spec={null} choices={{}} onChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renderiza los grupos de partes", () => {
    render(
      <Parts spec={mockSpec} choices={defaultChoices} onChange={() => {}} />
    );
    expect(screen.getByText("facial features")).toBeInTheDocument();
    expect(screen.getByText("hair")).toBeInTheDocument();
  });

  it("renderiza selectores para partes no-color", () => {
    render(
      <Parts spec={mockSpec} choices={defaultChoices} onChange={() => {}} />
    );
    // Debe haber selects para eyebrows, eyes, mouth, top, facial_hair
    const selects = screen.getAllByRole("combobox");
    expect(selects.length).toBeGreaterThanOrEqual(3);
  });

  it("renderiza color swatches para partes de color", () => {
    render(
      <Parts spec={mockSpec} choices={defaultChoices} onChange={() => {}} />
    );
    // Debe haber radio buttons para los colores
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBeGreaterThan(0);
  });

  it("llama onChange al cambiar un select", () => {
    const onChange = vi.fn();
    render(
      <Parts spec={mockSpec} choices={defaultChoices} onChange={onChange} />
    );
    const select = screen.getAllByRole("combobox")[0];
    fireEvent.change(select, { target: { value: "UP_DOWN" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("renderiza color swatches con el seleccionado marcado", () => {
    const onChange = vi.fn();
    render(
      <Parts spec={mockSpec} choices={defaultChoices} onChange={onChange} />
    );
    const radios = screen.getAllByRole("radio");
    // Al menos un radio debe estar checked (el color seleccionado)
    const checked = radios.filter((r) => r.checked);
    expect(checked.length).toBeGreaterThan(0);
  });
});
