import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InfoButton } from "./info-button";

describe("InfoButton", () => {
  it("renders info icon button", () => {
    render(<InfoButton title="Title" description="Desc" ariaLabel="Test info" />);
    expect(screen.getByRole("button", { name: "Test info" })).toBeInTheDocument();
  });

  it("opens dialog when clicked", () => {
    render(<InfoButton title="My Title" description="My description" ariaLabel="Open" />);
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("My description")).toBeInTheDocument();
  });

  it("renders children inside dialog", () => {
    render(
      <InfoButton title="T" description="D" ariaLabel="Open">
        <p>Extra content</p>
      </InfoButton>
    );
    fireEvent.click(screen.getByRole("button", { name: "Open" }));
    expect(screen.getByText("Extra content")).toBeInTheDocument();
  });
});
