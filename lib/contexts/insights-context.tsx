// lib/contexts/insights-context.tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface InsightsContextType {
  isInsightsOpen: boolean;
  toggleInsights: () => void;
  openInsights: () => void;
  closeInsights: () => void;
}

const InsightsContext = createContext<InsightsContextType | undefined>(undefined);

export function InsightsProvider({ children }: { children: ReactNode }) {
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);

  const toggleInsights = () => setIsInsightsOpen(prev => !prev);
  const openInsights = () => setIsInsightsOpen(true);
  const closeInsights = () => setIsInsightsOpen(false);

  return (
    <InsightsContext.Provider 
      value={{ 
        isInsightsOpen, 
        toggleInsights, 
        openInsights, 
        closeInsights 
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