"use client";

import React from "react";
import dynamic from 'next/dynamic';

const TesterV2 = dynamic(() => import('@/components/canvas/tester/TesterV2'), {
  ssr: false,
});

export default function TesterPage() {
  // Standalone entry: until we wire project state here, show an empty harness
  return (
    <div className="p-6">
      <TesterV2 nodes={[]} connections={[]} onClose={() => { window.history.back(); }} />
      <div className="mt-3 text-xs text-gray-600">
        This standalone Tester page is a scaffold. Open the Designer and click Test
        to run against the current canvas. When project state is available here,
        this page will auto-load the active flow.
      </div>
    </div>
  );
}
