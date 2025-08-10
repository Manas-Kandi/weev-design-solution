"use client";

import { Home, FolderKanban, FileStack, Trash2, Settings } from "lucide-react";
import Link from "next/link";

const items = [
  { href: "#", icon: Home, label: "Home" },
  { href: "#", icon: FolderKanban, label: "Projects" },
  { href: "#", icon: FileStack, label: "Templates" },
  { href: "#", icon: Trash2, label: "Trash" },
  { href: "#", icon: Settings, label: "Settings" },
];

export function LeftRail() {
  return (
    <aside className="flex flex-col items-center gap-4 py-4 w-14 border-r bg-background">
      {items.map(({ href, icon: Icon, label }) => (
        <Link key={label} href={href} className="p-2 rounded hover:bg-muted">
          <Icon className="w-5 h-5" aria-label={label} />
        </Link>
      ))}
    </aside>
  );
}

export default LeftRail;
