/**
 * Unified Properties Panel Primitives
 * Shared components for consistent liquid-glass design across all Properties panels
 */

import React from 'react';
import { figmaPropertiesTheme as theme, themeHelpers } from '../propertiesPanelTheme';

// Unified Section - Airy layout without nested boxes
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
        marginBottom: '32px', // Generous spacing between sections
      }}
    >
      {(title || subtitle) && (
        <div
          style={{
            marginBottom: '20px',
            paddingBottom: '12px',
            borderBottom: '1px solid rgba(255,255,255,0.06)', // Subtle divider
          }}
        >
          {title && (
            <h3
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.92)',
                margin: 0,
                padding: 0,
                fontFamily: theme.typography.fontFamily,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h3>
          )}
          {subtitle && (
            <p
              style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.55)',
                margin: title ? '4px 0 0 0' : '0',
                lineHeight: 1.4,
                fontFamily: theme.typography.fontFamily,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
};

// Unified Form Field - Spacious and clean
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
    <div style={{ marginBottom: '24px' }}> {/* Generous field spacing */}
      <label 
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 500,
          color: 'rgba(255,255,255,0.75)',
          marginBottom: '8px',
          fontFamily: theme.typography.fontFamily,
          letterSpacing: '-0.005em',
        }}
      >
        {label}
        {required && (
          <span style={{ color: '#FF6B6B', marginLeft: '2px' }}>*</span>
        )}
      </label>
      {children}
      {error && (
        <div
          style={{
            fontSize: '12px',
            color: '#FF6B6B',
            marginTop: '6px',
            fontFamily: theme.typography.fontFamily,
          }}
        >
          {error}
        </div>
      )}
      {help && !error && (
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(255,255,255,0.45)',
            marginTop: '6px',
            lineHeight: 1.4,
            fontFamily: theme.typography.fontFamily,
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
        width: '100%',
        height: '36px',
        padding: '0 14px',
        fontSize: '14px',
        fontFamily: theme.typography.fontFamily,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        color: 'rgba(255,255,255,0.92)',
        outline: 'none',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(8px)',
        ...(disabled && {
          opacity: 0.5,
          cursor: 'not-allowed',
        }),
      }}
      onFocus={(e) => {
        Object.assign((e.target as HTMLInputElement).style, {
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(90,167,255,0.4)',
          boxShadow: '0 0 0 3px rgba(90,167,255,0.08)',
        });
      }}
      onBlur={(e) => {
        Object.assign((e.target as HTMLInputElement).style, {
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'none',
        });
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
        width: '100%',
        minHeight: `${rows * 20 + 24}px`,
        padding: '12px 14px',
        fontSize: '14px',
        fontFamily: theme.typography.fontFamily,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        color: 'rgba(255,255,255,0.92)',
        outline: 'none',
        resize: 'vertical',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(8px)',
        lineHeight: 1.5,
        ...(disabled && {
          opacity: 0.5,
          cursor: 'not-allowed',
        }),
      }}
      onFocus={(e) => {
        Object.assign((e.target as HTMLTextAreaElement).style, {
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(90,167,255,0.4)',
          boxShadow: '0 0 0 3px rgba(90,167,255,0.08)',
        });
      }}
      onBlur={(e) => {
        Object.assign((e.target as HTMLTextAreaElement).style, {
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'none',
        });
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
        width: '100%',
        height: '36px',
        padding: '0 14px',
        fontSize: '14px',
        fontFamily: theme.typography.fontFamily,
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '10px',
        color: 'rgba(255,255,255,0.92)',
        outline: 'none',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(8px)',
        ...(disabled && {
          opacity: 0.5,
          cursor: 'not-allowed',
        }),
      }}
      onFocus={(e) => {
        Object.assign((e.target as HTMLSelectElement).style, {
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(90,167,255,0.4)',
          boxShadow: '0 0 0 3px rgba(90,167,255,0.08)',
        });
      }}
      onBlur={(e) => {
        Object.assign((e.target as HTMLSelectElement).style, {
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'none',
        });
      }}
    >
      {options.map((option) => (
        <option 
          key={option.value} 
          value={option.value}
          style={{
            background: '#1a1a1c',
            color: 'rgba(255,255,255,0.92)',
          }}
        >
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
  const isPrimary = variant === 'primary';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: size === 'sm' ? '28px' : '36px',
        padding: size === 'sm' ? '0 12px' : '0 16px',
        fontSize: size === 'sm' ? '12px' : '13px',
        fontWeight: 500,
        fontFamily: theme.typography.fontFamily,
        background: isPrimary 
          ? 'linear-gradient(135deg, #5AA7FF 0%, #4A90E2 100%)'
          : 'rgba(255,255,255,0.06)',
        border: isPrimary 
          ? '1px solid rgba(90,167,255,0.3)'
          : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: isPrimary ? 'white' : 'rgba(255,255,255,0.85)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        outline: 'none',
        transition: 'all 0.2s ease',
        backdropFilter: 'blur(8px)',
        ...(disabled && {
          opacity: 0.4,
        }),
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign((e.target as HTMLButtonElement).style, {
            background: isPrimary 
              ? 'linear-gradient(135deg, #6BB6FF 0%, #5BA0F2 100%)'
              : 'rgba(255,255,255,0.08)',
            transform: 'translateY(-1px)',
          });
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          Object.assign((e.target as HTMLButtonElement).style, {
            background: isPrimary 
              ? 'linear-gradient(135deg, #5AA7FF 0%, #4A90E2 100%)'
              : 'rgba(255,255,255,0.06)',
            transform: 'translateY(0)',
          });
        }
      }}
    >
      {children}
    </button>
  );
};

// Unified Panel Container - Spacious and breathable
interface PanelContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  children,
  className = '',
}) => {
  return (
    <div 
      className={`panel-container ${className}`} 
      style={{
        padding: '24px 20px', // Generous padding for breathing room
        minWidth: '280px', // Ensure comfortable width
      }}
    >
      {children}
    </div>
  );
};
