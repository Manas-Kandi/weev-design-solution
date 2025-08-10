"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FolderPlus, Plus, Import, Star } from "lucide-react";

interface FolderItem {
  id: string;
  name: string;
  children?: FolderItem[];
}

const sampleFolders: FolderItem[] = [
  { id: "1", name: "Favorites", children: [{ id: "p1", name: "Project A" }] },
  { id: "2", name: "Shared with me" },
  { id: "3", name: "All Folders" },
];

function FolderNode({ item }: { item: FolderItem }) {
  const [open, setOpen] = useState(true);
  const hasChildren = item.children && item.children.length > 0;
  return (
    <div className="ml-2">
      <div
        className="flex items-center gap-1 cursor-pointer hover:text-accent"
        onClick={() => setOpen(!open)}
      >
        {hasChildren && (
          open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        )}
        <span>{item.name}</span>
      </div>
      {hasChildren && open && (
        <div className="ml-4 mt-1 space-y-1">
          {item.children!.map((child) => (
            <div key={child.id} className="text-sm text-muted-foreground">
              {child.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderPanel() {
  return (
    <aside className="w-56 border-r p-2 space-y-2">
      <div className="flex gap-2 text-sm">
        <button className="flex-1 flex items-center gap-1 px-2 py-1 rounded hover:bg-muted">
          <FolderPlus className="w-4 h-4" /> New Folder
        </button>
        <button className="flex-1 flex items-center gap-1 px-2 py-1 rounded hover:bg-muted">
          <Plus className="w-4 h-4" /> Project
        </button>
        <button className="flex-1 flex items-center gap-1 px-2 py-1 rounded hover:bg-muted">
          <Import className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1 text-sm">
        {sampleFolders.map((item) => (
          <FolderNode key={item.id} item={item} />
        ))}
      </div>
    </aside>
  );
}

export default FolderPanel;
