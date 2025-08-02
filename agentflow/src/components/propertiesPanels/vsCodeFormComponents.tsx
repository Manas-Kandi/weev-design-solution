// VS Code-style form components for AgentFlow properties panels
import React, { useState, useRef } from "react";
import {
  ChevronDown,
  Check,
  X,
  Plus,
  Minus,
  Info,
  AlertCircle,
} from "lucide-react";
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
      ...themeHelpers.getInputStyle(),
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
      ...themeHelpers.getInputStyle(),
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
  const buttonVariant = variant === "danger" ? "primary" : variant;
  const baseStyle = themeHelpers.getButtonStyle(buttonVariant);
  // Adjust size if needed
  const sizeStyle =
    size === "small"
      ? {
          height: "24px",
          fontSize: theme.typography.fontSize.sm,
          padding: `0 ${theme.spacing.sm}`,
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
