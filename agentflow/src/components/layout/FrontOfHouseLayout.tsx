"use client";

import { useState } from "react";
import LeftRail from "./LeftRail";
import FolderPanel from "./FolderPanel";
import HeaderBar from "./HeaderBar";
import FocusStrip from "./FocusStrip";
import ContentView from "./ContentView";
import ContextDrawer from "./ContextDrawer";

export function FrontOfHouseLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <div className="flex h-screen">
      <LeftRail />
      <FolderPanel />
      <div className="flex flex-col flex-1">
        <HeaderBar />
        <FocusStrip />
        <ContentView />
      </div>
      <ContextDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default FrontOfHouseLayout;
