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
    <div className="flex items-center justify-between h-8 px-2 bg-[var(--figma-surface)] border-b border-[var(--figma-border)]">
      <div className="flex items-center gap-1 overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            className={`group flex items-center h-6 px-2 rounded-t-md cursor-pointer select-none text-sm ${
              activeId === tab.id
                ? "bg-[var(--figma-bg)] text-[var(--figma-text)]"
                : "text-[var(--figma-text-secondary)]"
            }`}
          >
            <span className="truncate">
              {tab.title}
              {tab.breadcrumb && (
                <span className="ml-1 text-xs text-[var(--figma-text-secondary)]">
                  /{tab.breadcrumb.join("/")}
                </span>
              )}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="ml-2 opacity-0 group-hover:opacity-100 hover:text-[var(--figma-text)]"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className="ml-1 w-6 h-6 flex items-center justify-center text-[var(--figma-text-secondary)] hover:text-[var(--figma-text)]"
          title="New file"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center gap-1">
        {avatars.map((a) => (
          <UserAvatar key={a.id} name={a.name} image={a.image} online={a.online} />
        ))}
      </div>
    </div>
  );
}
