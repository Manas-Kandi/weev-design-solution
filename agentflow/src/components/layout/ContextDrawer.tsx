"use client";

import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ContextDrawer({ open, onClose }: Props) {
  if (!open) return null;
  return (
    <div className="w-64 border-l p-4 space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="font-semibold">Details</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-muted-foreground">
        Select a project to see details.
      </p>
    </div>
  );
}

export default ContextDrawer;
