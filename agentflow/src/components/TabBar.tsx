"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
// import AgentFlowLogo from "@/components/AgentFlowLogo";

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
    <div
      className="flex items-center justify-between w-full"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "40px",
        background: "#000", // pure black
        borderBottom: "1px solid #181A20",
        boxShadow: "0 2px 8px 0 rgba(0,0,0,0.10)",
        zIndex: 1000,
        paddingLeft: 0,
        paddingRight: 12,
      }}
    >
      <div className="flex items-center min-w-[40px] justify-center" style={{ paddingRight: 8, marginLeft: 4 }}>
        <img src="/weave%20icon%20no%20background.png" alt="weev logo" style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 4, boxShadow: '0 1px 4px rgba(0,0,0,0.10)' }} />
      </div>
      <div className="flex items-center gap-1 overflow-hidden" style={{ marginLeft: 0, marginRight: 'auto', alignItems: 'center', height: 40 }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveId(tab.id)}
            style={{
              background: activeId === tab.id ? "#181A20" : "transparent",
              color: activeId === tab.id ? "#fff" : "#b0b0b0",
              border: activeId === tab.id ? "1.5px solid #222" : "1px solid transparent",
              borderRadius: 6,
              marginRight: 2,
              height: 28,
              padding: '0 10px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontSize: 14,
              minWidth: 56,
              transition: 'border 0.18s, background 0.18s',
              position: 'relative',
            }}
            className={`group select-none ${activeId === tab.id ? '' : 'hover:bg-[#181A20]'}`}
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
              className="ml-2 opacity-0 group-hover:opacity-100 hover:text-white"
              style={{ transition: 'opacity 0.18s', fontSize: 13, color: '#888', background: 'none', border: 'none', padding: 0, marginLeft: 2, cursor: 'pointer' }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        <button
          onClick={addTab}
          className="ml-1 w-6 h-6 flex items-center justify-center text-[var(--figma-text-secondary)] hover:text-white"
          title="New file"
          style={{ background: 'none', border: 'none', borderRadius: 4, color: '#b0b0b0', padding: 0, marginLeft: 2, cursor: 'pointer', transition: 'background 0.18s' }}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center ml-auto" style={{ height: 40, alignItems: 'center', gap: 0 }}>
        {/* Zoom Controls Group */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'none', borderRadius: 6, marginRight: 6 }}>
          <button
            style={{
              width: 36,
              height: 32,
              background: 'none',
              border: '1px solid #232323',
              borderRight: 'none',
              borderRadius: '6px 0 0 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#b0b0b0',
              fontSize: 15,
              fontWeight: 500,
              transition: 'background 0.18s, border 0.18s',
              margin: 0,
              padding: 0,
              cursor: 'pointer',
            }}
            title="Zoom Level"
          >
            100%
          </button>
          <button
            style={{
              width: 32,
              height: 32,
              background: 'none',
              border: '1px solid #232323',
              borderLeft: 'none',
              borderRight: 'none',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#b0b0b0',
              fontSize: 16,
              margin: 0,
              padding: 0,
              cursor: 'pointer',
              transition: 'background 0.18s, border 0.18s',
            }}
            title="Zoom Out"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="#b0b0b0" strokeWidth="1.5"/><path d="M5.5 8H10.5" stroke="#b0b0b0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <button
            style={{
              width: 32,
              height: 32,
              background: 'none',
              border: '1px solid #232323',
              borderLeft: 'none',
              borderRadius: '0 6px 6px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#b0b0b0',
              fontSize: 16,
              margin: 0,
              padding: 0,
              cursor: 'pointer',
              transition: 'background 0.18s, border 0.18s',
            }}
            title="Zoom In"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="#b0b0b0" strokeWidth="1.5"/><path d="M8 5.5V10.5M5.5 8H10.5" stroke="#b0b0b0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        {/* Test Button */}
        <button
          style={{
            width: 70,
            height: 32,
            background: '#2563eb',
            border: 'none',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 6,
            cursor: 'pointer',
            color: '#fff',
            fontWeight: 500,
            fontSize: 15,
            gap: 5,
            transition: 'background 0.18s',
          }}
          title="Test"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 3 }}><path d="M6.5 5.5L12 9L6.5 12.5V5.5Z" fill="white"/></svg>
          Test
        </button>
        {/* Share Button */}
        <button
          style={{
            width: 64,
            height: 32,
            background: 'none',
            border: '1px solid #232323',
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 0,
            cursor: 'pointer',
            color: '#b0b0b0',
            fontWeight: 500,
            fontSize: 15,
            gap: 5,
            transition: 'background 0.18s, border 0.18s',
          }}
          title="Share"
        >
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: 3 }}><path d="M13.5 10.5V12.25C13.5 13.2165 12.7165 14 11.75 14H6.25C5.2835 14 4.5 13.2165 4.5 12.25V10.5" stroke="#b0b0b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 11V4.75M9 4.75L6.5 7.25M9 4.75L11.5 7.25" stroke="#b0b0b0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Share
        </button>
        {avatars.map((a) => (
          <UserAvatar key={a.id} name={a.name} image={a.image} online={a.online} />
        ))}
      </div>
    </div>
  );
}
