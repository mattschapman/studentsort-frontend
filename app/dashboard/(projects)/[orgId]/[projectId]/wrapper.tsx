// app/dashboard/(projects)/[orgId]/[projectId]/wrapper.tsx
"use client";

import { useInsights } from "@/lib/contexts/insights-context";
import InsightsPanel from "./_components/insights-panel";

interface ProjectContentWrapperProps {
  children: React.ReactNode;
}

export default function ProjectContentWrapper({ 
  children
}: ProjectContentWrapperProps) {
  const { isInsightsOpen } = useInsights();

  return (
    <>
      {/* Main content area - make it horizontally scrollable when insights panel is open */}
      <main className={`flex-1 overflow-auto min-h-0 ${isInsightsOpen ? 'overflow-x-auto' : ''}`}>
        {children}
      </main>

      {/* Insights panel */}
      {isInsightsOpen && <InsightsPanel />}
    </>
  );
}