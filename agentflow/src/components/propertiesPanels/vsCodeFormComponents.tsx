// VS Code-style form components for AgentFlow properties panels
import React from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";

// ...existing code from your message...

// VSCodeInput
export const VSCodeInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement>
> = ({ style, ...props }) => (
  <input
    {...props}
    style={{
      width: "100%",
      background: theme.colors.backgroundSecondary,
      color: "#f3f3f3",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: "6px",
      padding: "12px",
      fontFamily: 'Menlo, monospace',
      fontSize: "15px",
      outline: "none",
      transition: "border-color 0.15s",
      ...style,
    }}
  />
);

// VSCodeSelect
interface VSCodeSelectOption {
  value: string;
  label: string;
}
interface VSCodeSelectProps {
  value: string;
  onValueChange: (v: string) => void;
  options: VSCodeSelectOption[];
  placeholder?: string;
  style?: React.CSSProperties;
}
export const VSCodeSelect: React.FC<VSCodeSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder,
  style,
}) => (
  <select
    value={value}
    onChange={(e) => onValueChange(e.target.value)}
    style={{
      width: "100%",
      background: theme.colors.backgroundSecondary,
      color: "#f3f3f3",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: "6px",
      padding: "12px",
      fontFamily: 'Menlo, monospace',
      fontSize: "15px",
      outline: "none",
      transition: "border-color 0.15s",
      ...style,
    }}
  >
    {placeholder && (
      <option value="" disabled>
        {placeholder}
      </option>
    )}
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

// VSCodeButton
interface VSCodeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger";
  size?: "small" | "medium";
}
export const VSCodeButton: React.FC<VSCodeButtonProps> = ({
  variant = "primary",
  size = "medium",
  style,
  ...props
}) => {
  // Map "danger" to error color, otherwise use primary
  const background = variant === "danger" ? "#ef4444" : "#2563eb";
  const baseStyle: React.CSSProperties = {
    background,
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    padding: "0 16px",
    height: "32px",
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
    fontSize: "15px",
    cursor: "pointer",
    transition: "background 0.15s, color 0.15s",
    outline: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };
  // Adjust size if needed
  const sizeStyle =
    size === "small"
      ? {
          height: "24px",
          fontSize: "13px",
          padding: "0 8px",
        }
      : {};
  return (
    <button
      {...props}
      style={{
        ...baseStyle,
        ...sizeStyle,
        ...style,
      }}
    />
  );
};
