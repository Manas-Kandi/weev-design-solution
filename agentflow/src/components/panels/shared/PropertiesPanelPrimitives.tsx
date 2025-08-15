/**
 * Unified Properties Panel Primitives
 * Shared components for consistent liquid-glass design across all Properties panels
 */

import React from 'react';
import { figmaPropertiesTheme as theme, themeHelpers } from '../propertiesPanelTheme';

// Unified Section Card
interface PanelSectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}

export const PanelSection: React.FC<PanelSectionProps> = ({
  title,
  subtitle,
  children,
  className = '',
}) => {
  return (
    <div
      className={`panel-section ${className}`}
      style={{
        ...theme.section,
        marginBottom: theme.spacing.md,
      }}
    >
      {(title || subtitle) && (
        <div
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
            borderBottom: `1px solid ${theme.colors.borderLight}`,
            backgroundColor: theme.colors.backgroundSecondary,
            borderTopLeftRadius: theme.borderRadius.xl,
            borderTopRightRadius: theme.borderRadius.xl,
          }}
        >
          {title && (
            <h3
              style={{
                ...themeHelpers.getSectionHeaderStyle(),
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.semibold,
                margin: 0,
                padding: 0,
                height: 'auto',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'default',
              }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textMuted,
                margin: title ? `${theme.spacing.xs} 0 0 0` : '0',
                lineHeight: theme.typography.lineHeight.normal,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div
        style={{
          padding: theme.spacing.lg,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Unified Form Field
interface FormFieldProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  help?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  required = false,
  error,
  help,
}) => {
  return (
    <div style={{ marginBottom: theme.spacing.fieldGap }}>
      <label style={theme.label}>
        {label}
        {required && (
          <span style={{ color: theme.colors.error, marginLeft: '2px' }}>*</span>
        )}
      </label>
      {children}
      {error && (
        <div
          style={{
            ...theme.helpText,
            color: theme.colors.error,
            marginTop: theme.spacing.xs,
          }}
        >
          {error}
        </div>
      )}
      {help && !error && (
        <div
          style={{
            ...theme.helpText,
            marginTop: theme.spacing.xs,
          }}
        >
          {help}
        </div>
      )}
    </div>
  );
};

// Unified Input Components
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'number' | 'email' | 'url';
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  type = 'text',
}) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        ...theme.input,
        ...(disabled && theme.states.disabled),
      }}
      onFocus={(e) => {
        Object.assign(e.target.style, theme.states.focus);
      }}
      onBlur={(e) => {
        Object.assign(e.target.style, theme.states.default);
      }}
    />
  );
};

interface TextAreaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
}

export const TextArea: React.FC<TextAreaProps> = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  rows = 4,
}) => {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      rows={rows}
      style={{
        ...theme.textarea,
        minHeight: `${rows * 1.4 + 1}em`,
        resize: 'vertical',
        ...(disabled && theme.states.disabled),
      }}
      onFocus={(e) => {
        Object.assign(e.target.style, theme.states.focus);
      }}
      onBlur={(e) => {
        Object.assign(e.target.style, theme.states.default);
      }}
    />
  );
};

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  disabled = false,
}) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        ...theme.select,
        ...(disabled && theme.states.disabled),
      }}
      onFocus={(e) => {
        Object.assign(e.target.style, theme.states.focus);
      }}
      onBlur={(e) => {
        Object.assign(e.target.style, theme.states.default);
      }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'secondary',
  disabled = false,
  size = 'md',
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...themeHelpers.getButtonStyle(variant),
        ...(size === 'sm' && {
          height: '24px',
          fontSize: theme.typography.fontSize.xs,
          padding: `0 ${theme.spacing.sm}`,
        }),
        ...(disabled && theme.states.disabled),
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign((e.target as HTMLButtonElement).style, theme.states.hover);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign((e.target as HTMLButtonElement).style, themeHelpers.getButtonStyle(variant));
        }
      }}
    >
      {children}
    </button>
  );
};

// Unified Panel Container
interface PanelContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`panel-container ${className}`} style={theme.content}>
      {children}
    </div>
  );
};
