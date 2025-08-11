// Simplified Message Properties Panel with floating, minimal design
import React, { useEffect, useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";

interface MessagePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

interface MessageNodeData {
  message?: string;  // Main message content
  role?: "System" | "User" | "Assistant";  // Message role
  passThrough?: boolean;  // Pass through mode
  // Legacy fields for backward compatibility
  title?: string;
  content?: string;
  messageType?: "System" | "User" | "Assistant";
  [key: string]: unknown;
}

// Helper function to migrate legacy config to new format
function migrateLegacyMessageConfig(data: MessageNodeData): { message: string; role: "System" | "User" | "Assistant" } {
  // Get message content
  let message = "";
  if (data.message) {
    message = data.message;
  } else if (data.content) {
    message = data.content;
  }
  
  // Get role
  let role: "System" | "User" | "Assistant" = "User";
  if (data.role) {
    role = data.role;
  } else if (data.messageType) {
    role = data.messageType;
  }
  
  return { message, role };
}

export default function MessagePropertiesPanel({
  node,
  onChange,
}: MessagePropertiesPanelProps) {
  const data = node.data as MessageNodeData;
  
  // Initialize state from existing data or migrate legacy config
  const { message: initialMessage, role: initialRole } = migrateLegacyMessageConfig(data);
  const [message, setMessage] = useState<string>(initialMessage);
  const [role, setRole] = useState<"System" | "User" | "Assistant">(initialRole);
  const [passThrough, setPassThrough] = useState<boolean>(data.passThrough || false);
  
  // Update node data when fields change
  useEffect(() => {
    const updatedData = { 
      ...data, 
      message, 
      role, 
      passThrough 
    };
    onChange({ ...node, data: updatedData });
  }, [message, role, passThrough]);
  
  // Update local state if node changes externally
  useEffect(() => {
    const { message: newMessage, role: newRole } = migrateLegacyMessageConfig(data);
    if (newMessage !== message) setMessage(newMessage);
    if (newRole !== role) setRole(newRole);
    if ((data.passThrough || false) !== passThrough) setPassThrough(data.passThrough || false);
  }, [node.id]);

  // Styles
  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
    height: "100%",
  };
  
  const titleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  };
  
  const subtitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  };
  
  const textAreaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "120px",
    maxHeight: "300px",
    padding: theme.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    lineHeight: theme.typography.lineHeight.relaxed,
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  };
  
  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  };
  
  const labelStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  };
  
  const switchContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.sm,
  };
  
  const switchStyle: React.CSSProperties = {
    width: "16px",
    height: "16px",
    accentColor: theme.colors.buttonPrimary,
  };
  
  const switchLabelStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
    cursor: "pointer",
  };
  
  const switchSubtextStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    fontFamily: theme.typography.fontFamily,
    marginTop: theme.spacing.xs,
  };

  return (
    <div style={containerStyle}>
      {/* Title */}
      <h3 style={titleStyle}>Message</h3>
      
      {/* Subtitle */}
      <p style={subtitleStyle}>
        Enter the message this node will send
      </p>
      
      {/* Message Content Textarea */}
      <div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message here..."
          style={textAreaStyle}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.buttonPrimary;
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border;
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
          }}
        />
      </div>
      
      {/* Role Dropdown */}
      <div>
        <label style={labelStyle}>Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as "System" | "User" | "Assistant")}
          style={selectStyle}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.buttonPrimary;
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border;
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
          }}
        >
          <option value="System">System</option>
          <option value="User">User</option>
          <option value="Assistant">Assistant</option>
        </select>
      </div>
      
      {/* Pass Through Toggle */}
      <div style={switchContainerStyle}>
        <input
          type="checkbox"
          id="passThrough"
          checked={passThrough}
          onChange={(e) => setPassThrough(e.target.checked)}
          style={switchStyle}
        />
        <div>
          <label htmlFor="passThrough" style={switchLabelStyle}>
            Pass Through Mode
          </label>
          <div style={switchSubtextStyle}>
            Pass input through instead of using the message content
          </div>
        </div>
      </div>
    </div>
  );
}
