"use client";

import { useState } from "react";
import { LayoutGrid, Table } from "lucide-react";

const sampleProjects = [
  { id: "p1", name: "Email Bot", updated: "2d ago" },
  { id: "p2", name: "Marketing Flow", updated: "5d ago" },
];

export function ContentView() {
  const [view, setView] = useState<"grid" | "table">("grid");

  return (
    <div className="flex-1 overflow-auto">
      <div className="flex justify-end gap-2 p-2 border-b">
        <button
          className={`p-1 rounded ${view === "grid" ? "bg-muted" : ""}`}
          onClick={() => setView("grid")}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          className={`p-1 rounded ${view === "table" ? "bg-muted" : ""}`}
          onClick={() => setView("table")}
        >
          <Table className="w-4 h-4" />
        </button>
      </div>
      {view === "grid" ? (
        <div className="p-4 grid grid-cols-2 gap-4">
          {sampleProjects.map((p) => (
            <div key={p.id} className="border rounded p-4 shadow-sm">
              <div className="h-24 bg-muted mb-2" />
              <div className="font-medium">{p.name}</div>
              <div className="text-sm text-muted-foreground">{p.updated}</div>
            </div>
          ))}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Last Edited</th>
            </tr>
          </thead>
          <tbody>
            {sampleProjects.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ContentView;
