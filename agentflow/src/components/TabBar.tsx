"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface Tab {
  id: string;
  title: string;
  breadcrumb?: string[];
}

interface Avatar {
  id: string;
  name: string;
  image?: string;
  online?: boolean;
}

interface TabBarProps {
  initialTabs?: Tab[];
  avatars?: Avatar[];
}

export default function TabBar({
  initialTabs = [{ id: "1", title: "Untitled" }],
  avatars = [],
}: TabBarProps) {
  const [tabs, setTabs] = useState<Tab[]>(initialTabs);
  const [activeId, setActiveId] = useState<string>(initialTabs[0]?.id);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "var(--space-xl)",
    padding: `0 var(--space-sm)`,
    background: "var(--figma-surface)",
    borderBottom: "1px solid var(--figma-border)",
  };

  const tabsWrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-xs)",
    overflow: "hidden",
  };

  const tabStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    height: "var(--space-lg)",
    padding: `0 var(--space-sm)`,
    cursor: "pointer",
    userSelect: "none",
    fontSize: "var(--fs-sm)",
  };

  const addTab = () => {
    const id = Date.now().toString();
    setTabs([...tabs, { id, title: `Untitled ${tabs.length + 1}` }]);
    setActiveId(id);
  };

  const closeTab = (id: string) => {
    const next = tabs.filter((t) => t.id !== id);
    setTabs(next);
    if (id === activeId && next.length) setActiveId(next[0].id);
  };

  return (
    <div style={containerStyle}>
      <div style={tabsWrapperStyle}>
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              style={{
                ...tabStyle,
                color: isActive
                  ? "var(--figma-text)"
                  : "var(--figma-text-secondary)",
                background: isActive ? "var(--figma-bg)" : "transparent",
                borderBottom: `2px solid ${
                  isActive ? "var(--figma-accent)" : "transparent"
                }`,
              }}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {tab.title}
                {tab.breadcrumb && (
                  <span
                    style={{
                      marginLeft: "var(--space-xs)",
                      fontSize: "var(--fs-xs)",
                      color: "var(--figma-text-secondary)",
                    }}
                  >
                    /{tab.breadcrumb.join("/")}
                  </span>
                )}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                style={{
                  marginLeft: "var(--space-sm)",
                  color: "var(--figma-text-secondary)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
        <button
          onClick={addTab}
          title="New file"
          style={{
            marginLeft: "var(--space-xs)",
            width: "var(--space-lg)",
            height: "var(--space-lg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--figma-text-secondary)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Plus size={16} />
        </button>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--space-xs)",
        }}
      >
        {avatars.map((a) => (
          <UserAvatar key={a.id} name={a.name} image={a.image} online={a.online} />
        ))}
      </div>
    </div>
  );
}

