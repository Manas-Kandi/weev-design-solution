"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import UserAvatar from "@/components/layout/UserAvatar";

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
  onTest?: () => void;
  testButtonDisabled?: boolean;
}

export default function TabBar({
  initialTabs = [{ id: "1", title: "Untitled" }],
  avatars = [],
  onTest,
  testButtonDisabled = false,
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

  // IMPORTANT: To avoid a black bar, ensure the parent layout has no margin/padding/gap above or below this TabBar.
  // The background here should match the main app background.
  return (
    <div
      className="flex items-center w-full shadow-xl"
      style={{
        height: 44,
        background: "rgba(17,17,17,0.9)", // 90% opacity
        backdropFilter: "blur(12px)", // background blur for glassy effect
        WebkitBackdropFilter: "blur(12px)", // Safari support
        padding: "0 16px",
        gap: 12,
        border: "none",
        minHeight: 0,
        maxHeight: 44,
        zIndex: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginRight: 5,
          height: 20,
        }}
      >
        <img
          src="/weave%20icon%20no%20background.png"
          alt="AgentFlow"
          style={{
            width: 28,
            height: 28,
            objectFit: "contain",
            display: "block",
            marginTop: 2,
            marginBottom: 2,
          }}
        />
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-1 flex-1 overflow-x-auto"
        style={{ minHeight: 0 }}
      >
        {tabs.map((tab) => {
          const isActive = activeId === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => setActiveId(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2 text-sm font-medium cursor-pointer select-none transition-all duration-150
                ${
                  isActive
                    ? "bg-[#18191b] text-white z-10"
                    : "bg-transparent text-gray-400 hover:bg-[#232a36]/40 hover:text-gray-100 z-0"
                }
              `}
              style={{
                borderRadius: isActive ? 12 : 12,
                marginTop: 2,
                marginBottom: 2,
                height: 31,
                paddingTop: 0,
                paddingBottom: 0,
                boxShadow: isActive ? "inset 0 4px 12px 0 #222222" : "none",
                minWidth: 56,
                maxWidth: 140,
                minHeight: 0,
                marginRight: 6,
                marginLeft: 0,
                border: "0px solid rgba(255,255,255,0.05)",
                position: "relative",
                zIndex: isActive ? 2 : 2,
                outline: "none",
                background: isActive ? "#000000" : undefined,
                display: "flex",
                alignItems: "center",
              }}
              tabIndex={0}
              aria-selected={isActive}
              role="tab"
            >
              <span className="truncate max-w-[110px] font-medium tracking-tight">
                {tab.title}
              </span>
              <button
                type="button"
                aria-label="Close tab"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="opacity-0 group-hover:opacity-100 ml-1 rounded-full p-0.5 bg-transparent hover:bg-[#2a222a]/60 focus:bg-[#2a222a]/70 transition-all text-gray-500 hover:text-red-400 focus:text-red-500 shadow-none"
                tabIndex={-1}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          aria-label="Add tab"
          onClick={addTab}
          className="w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-white ml-1 transition-all duration-150 border-none bg-transparent focus:bg-[#232a36]/40 hover:bg-[#232a36]/40"
          style={{
            background: "transparent",
            border: "none",
            boxShadow: "none",
            outline: "none",
          }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 tracking-tight mr-1">100%</span>
        <button
          type="button"
          className="px-3 py-1.5 bg-[#232a36] hover:bg-[#2a3646] text-white text-xs rounded-full font-semibold transition-all duration-150"
          onClick={onTest}
          disabled={testButtonDisabled}
          style={{ opacity: testButtonDisabled ? 0.6 : 1, cursor: testButtonDisabled ? "not-allowed" : "pointer" }}
        >
          Test
        </button>
        <button
          type="button"
          className="px-3 py-1.5 border border-[#232323]/70 hover:border-[#1e90ff88] hover:bg-[#181b22] text-gray-200 hover:text-[#4faaff] text-xs rounded-full font-semibold shadow-none transition-all duration-150"
        >
          Share
        </button>
        {avatars.length > 0 && (
          <>
            <div className="w-px h-4 bg-[#232a36] mx-1" />
            <div className="flex items-center gap-1">
              {avatars.map((a) => (
                <UserAvatar
                  key={a.id}
                  name={a.name}
                  image={a.image}
                  online={a.online}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
