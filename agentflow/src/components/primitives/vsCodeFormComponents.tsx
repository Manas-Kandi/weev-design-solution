// VS Code-style form components for AgentFlow properties panels
import React from "react";
import {
  figmaPropertiesTheme as theme,
  themeHelpers,
} from "../panels/propertiesPanelTheme";

// VSCodeInput
interface VSCodeInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  loading?: boolean;
}
export const VSCodeInput: React.FC<VSCodeInputProps> = ({
  style,
  loading = false,
  disabled,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const baseStyle = themeHelpers.getInputStyle(
    isFocused ? "focus" : isHovered ? "hover" : "default"
  );

  const animationStyle: React.CSSProperties = {
    transform: isHovered || isFocused ? "scale(1.01)" : "scale(1)",
    boxShadow: isFocused
      ? theme.shadows.glow
      : isHovered
      ? theme.shadows.subtle
      : undefined,
  };

  const stateStyle: React.CSSProperties =
    loading || disabled
      ? { opacity: theme.states.disabled.opacity, cursor: "not-allowed" }
      : {};

  return (
    <input
      {...props}
      disabled={disabled || loading}
      style={{ ...baseStyle, ...animationStyle, ...stateStyle, ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};

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
  loading?: boolean;
  disabled?: boolean;
}
export const VSCodeSelect: React.FC<VSCodeSelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder,
  style,
  loading = false,
  disabled,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const baseStyle = themeHelpers.getInputStyle(
    isFocused ? "focus" : isHovered ? "hover" : "default"
  );

  const animationStyle: React.CSSProperties = {
    transform: isHovered || isFocused ? "scale(1.01)" : "scale(1)",
    boxShadow: isFocused
      ? theme.shadows.glow
      : isHovered
      ? theme.shadows.subtle
      : undefined,
  };

  const stateStyle: React.CSSProperties =
    loading || disabled
      ? { opacity: theme.states.disabled.opacity, cursor: "not-allowed" }
      : {};

  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      disabled={disabled || loading}
      style={{ ...baseStyle, ...animationStyle, ...stateStyle, ...style }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
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
};

// VSCodeButton
interface VSCodeButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium";
  loading?: boolean;
}
export const VSCodeButton: React.FC<VSCodeButtonProps> = ({
  variant = "primary",
  size = "medium",
  loading = false,
  style,
  disabled,
  children,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const baseStyle = themeHelpers.getButtonStyle(
    variant === "danger" ? "secondary" : variant
  );

  const variantStyle: React.CSSProperties =
    variant === "danger"
      ? {
          backgroundColor: theme.colors.error,
          border: `1px solid ${theme.colors.error}`,
          color: "white",
        }
      : {};

  const sizeStyle: React.CSSProperties =
    size === "small"
      ? {
          height: theme.spacing.buttonHeight,
          fontSize: theme.typography.fontSize.xs,
          padding: `0 ${theme.spacing.sm}`,
        }
      : {};

  const animationStyle: React.CSSProperties = {
    filter: isHovered ? "brightness(0.96)" : undefined,
    transform: isHovered || isFocused ? "scale(1.02)" : "scale(1)",
    boxShadow: isFocused
      ? theme.shadows.glow
      : isHovered
      ? theme.shadows.subtle
      : undefined,
  };

  const stateStyle: React.CSSProperties =
    loading || disabled
      ? { opacity: theme.states.disabled.opacity, cursor: "not-allowed" }
      : {};

  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        ...variantStyle,
        ...sizeStyle,
        ...animationStyle,
        ...stateStyle,
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {loading ? "Loading..." : children}
    </button>
  );
};

// VSCodeTextArea
interface VSCodeTextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  loading?: boolean;
}
export const VSCodeTextArea: React.FC<VSCodeTextAreaProps> = ({
  style,
  loading = false,
  disabled,
  rows = 5,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const baseStyle = themeHelpers.getInputStyle(
    isFocused ? "focus" : isHovered ? "hover" : "default"
  );

  const animationStyle: React.CSSProperties = {
    transform: isHovered || isFocused ? "scale(1.01)" : "scale(1)",
    boxShadow: isFocused
      ? theme.shadows.glow
      : isHovered
      ? theme.shadows.subtle
      : undefined,
    resize: "vertical",
    minHeight: 84,
  };

  const stateStyle: React.CSSProperties =
    loading || disabled
      ? { opacity: theme.states.disabled.opacity, cursor: "not-allowed" }
      : {};

  return (
    <textarea
      {...props}
      rows={rows}
      disabled={disabled || loading}
      style={{
        ...baseStyle,
        // Textareas shouldn't inherit fixed input height
        height: "auto",
        fontFamily: theme.typography.fontMono,
        ...animationStyle,
        ...stateStyle,
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    />
  );
};
