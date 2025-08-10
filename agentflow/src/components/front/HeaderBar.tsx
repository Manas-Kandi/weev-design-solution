"use client";

import { Bell, ChevronDown, Search, Plus } from "lucide-react";

export function HeaderBar() {
  return (
    <header className="flex items-center justify-between gap-4 border-b p-2">
      <div className="flex items-center gap-2 flex-1">
        <Search className="w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search projects, nodes, people"
          className="flex-1 bg-transparent outline-none"
        />
        <div className="flex gap-2 text-sm">
          <span className="px-2 py-1 bg-muted rounded-full">Owner</span>
          <span className="px-2 py-1 bg-muted rounded-full">Type</span>
          <span className="px-2 py-1 bg-muted rounded-full">Updated</span>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="flex items-center gap-1 px-3 py-1 bg-accent text-accent-foreground rounded">
          <Plus className="w-4 h-4" /> Create
        </button>
        <Bell className="w-5 h-5" />
        <div className="w-8 h-8 bg-muted rounded-full" />
      </div>
    </header>
  );
}

export default HeaderBar;
