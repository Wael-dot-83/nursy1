import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";
import TempPasswordModal from "../components/TempPasswordModal";

describe("TempPasswordModal", () => {
  it("shows temp password and allows reveal/copy", () => {
    render(
      <TempPasswordModal
        open
        onClose={() => {}}
        user={{ email: "manager@example.com" }}
        tempPassword="Abc123XyZ9"
      />
    );

    expect(screen.getByText("تم إنشاء المدير")).toBeInTheDocument();
    expect(screen.getByText("manager@example.com")).toBeInTheDocument();

    const passwordInput = screen.getByDisplayValue("Abc123XyZ9");
    expect(passwordInput).toHaveAttribute("type", "password");

    fireEvent.click(screen.getByText("إظهار"));
    expect(passwordInput).toHaveAttribute("type", "text");

    const writeText = vi.fn();
    Object.assign(navigator, {
      clipboard: { writeText },
    });

    fireEvent.click(screen.getByText("نسخ كلمة المرور"));
    expect(writeText).toHaveBeenCalledWith("Abc123XyZ9");
  });
});
