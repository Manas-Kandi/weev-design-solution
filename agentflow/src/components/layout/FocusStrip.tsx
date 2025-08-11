"use client";

const items = ["Recent", "Pinned", "Shared", "Templates"];

export function FocusStrip() {
  return (
    <div className="flex gap-2 p-2 border-b">
      {items.map((item) => (
        <button
          key={item}
          className="px-3 py-1 text-sm rounded-full bg-muted hover:bg-muted/70"
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export default FocusStrip;
