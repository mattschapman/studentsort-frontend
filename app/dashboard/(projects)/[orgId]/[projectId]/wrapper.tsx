// app/dashboard/(projects)/[orgId]/[projectId]/wrapper.tsx
"use client";

import { useInsights } from "@/lib/contexts/insights-context";
import InsightsPanel from "./_components/insights-panel";
import IssuesPanel from "./_components/issues-panel";

interface ProjectContentWrapperProps {
  children: React.ReactNode;
}

export default function ProjectContentWrapper({ 
  children
}: ProjectContentWrapperProps) {
  const { activePanelType } = useInsights();
  const isPanelOpen = activePanelType !== null;

  return (
    <>
      {/* Main content area - make it horizontally scrollable when a panel is open */}
      <main className={`flex-1 overflow-auto min-h-0 ${isPanelOpen ? 'overflow-x-auto' : ''}`}>
        {children}
      </main>

      {/* Panels */}
      {activePanelType === 'issues' && <IssuesPanel />}
      {activePanelType === 'insights' && <InsightsPanel />}
    </>
  );
}