// lib/contexts/insights-context.tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type PanelType = 'insights' | 'issues' | null;

interface InsightsContextType {
  activePanelType: PanelType;
  isInsightsOpen: boolean;
  isIssuesOpen: boolean;
  toggleInsights: () => void;
  toggleIssues: () => void;
  closePanel: () => void;
}

const InsightsContext = createContext<InsightsContextType | undefined>(undefined);

export function InsightsProvider({ children }: { children: ReactNode }) {
  const [activePanelType, setActivePanelType] = useState<PanelType>(null);

  const isInsightsOpen = activePanelType === 'insights';
  const isIssuesOpen = activePanelType === 'issues';

  const toggleInsights = () => {
    setActivePanelType(prev => prev === 'insights' ? null : 'insights');
  };

  const toggleIssues = () => {
    setActivePanelType(prev => prev === 'issues' ? null : 'issues');
  };

  const closePanel = () => setActivePanelType(null);

  return (
    <InsightsContext.Provider 
      value={{ 
        activePanelType,
        isInsightsOpen,
        isIssuesOpen,
        toggleInsights,
        toggleIssues,
        closePanel,
      }}
    >
      {children}
    </InsightsContext.Provider>
  );
}

export function useInsights() {
  const context = useContext(InsightsContext);
  if (context === undefined) {
    throw new Error("useInsights must be used within an InsightsProvider");
  }
  return context;
}