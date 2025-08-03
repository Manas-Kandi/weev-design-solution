// VS Code-style form components for AgentFlow properties panels
import React from "react";
import {
  figmaPropertiesTheme as theme,
  themeHelpers,
} from "./propertiesPanelTheme";

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
      fontFamily: "Menlo, monospace",
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
      fontFamily: "Menlo, monospace",
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
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium";
}
export const VSCodeButton: React.FC<VSCodeButtonProps> = ({
  variant = "primary",
  size = "medium",
  style,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  // Use theme helper for consistency
  const baseStyle = themeHelpers.getButtonStyle(
    variant === "danger" ? "secondary" : variant
  );
  // Override colors for danger variant using theme
  const variantStyle: React.CSSProperties =
    variant === "danger"
      ? {
          backgroundColor: theme.colors.error,
          border: `1px solid ${theme.colors.error}`,
          color: "white",
        }
      : {};
  // Size adjustments using theme tokens
  const sizeStyle: React.CSSProperties =
    size === "small"
      ? {
          height: theme.spacing.buttonHeight,
          fontSize: theme.typography.fontSize.xs,
          padding: `0 ${theme.spacing.sm}`,
        }
      : {};
  // Hover effects
  const hoverStyle: React.CSSProperties = isHovered
    ? {
        filter: "brightness(0.96)",
        boxShadow: theme.shadows.subtle,
      }
    : {};
  return (
    <button
      {...props}
      style={{
        ...baseStyle,
        ...variantStyle,
        ...sizeStyle,
        ...hoverStyle,
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    />
  );
};
