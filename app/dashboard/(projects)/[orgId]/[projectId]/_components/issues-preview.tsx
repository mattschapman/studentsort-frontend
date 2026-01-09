// app/dashboard/(projects)/[orgId]/[projectId]/_components/issues-preview.tsx
"use client";

import { useState, useEffect } from "react";
import { AlertCircle, AlertTriangle, Info, ChevronRight } from "lucide-react";
import { useValidation } from "@/lib/contexts/validation-context";
import { useInsights } from "@/lib/contexts/insights-context";
import ClientSideHorizontalNavTabs from "@/components/horizontal-nav-tabs-client";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import type { Issue } from "@/lib/validation/types";

type TabType = "errors" | "warnings" | "info";

export function IssuesPreview() {
  const { getIssuesByType, errorCount, warningCount, infoCount } = useValidation();
  const { toggleIssues, isIssuesOpen } = useInsights();
  const [activeTab, setActiveTab] = useState<TabType>("errors");

  // Navigation items for tabs
  const navItems = [
    { 
      name: 'Errors',
      value: "errors",
      count: errorCount,
      countColor: 'red' as const
    },
    { 
      name: 'Warnings',
      value: "warnings",
      count: warningCount,
      countColor: 'orange' as const
    },
    { 
      name: 'Info',
      value: "info",
      count: infoCount,
      countColor: 'blue' as const
    },
  ];

  // Get filtered issues based on active tab
  const filteredIssues = getIssuesByType(
    activeTab === "errors" ? "error" : activeTab === "warnings" ? "warning" : "info"
  );

  const getIcon = (type: Issue['type']) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value as TabType);
  };

  const handleIssueClick = (issue: Issue) => {
    // Set the hash to the issue ID
    window.location.hash = `issue-${issue.id}`;
    
    // Open the issues panel if it's not already open
    if (!isIssuesOpen) {
      toggleIssues();
    }
  };

  return (
    <div className="border rounded-lg bg-white flex flex-col overflow-hidden">
      {/* Header with Tabs */}
      <div className="border-b px-4">
        <ClientSideHorizontalNavTabs
          items={navItems}
          activeValue={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto max-h-96">
        {filteredIssues.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <Empty className="space-y-2">
              <EmptyHeader>
                <EmptyMedia variant="icon" className="size-7 rounded-sm mb-1">
                  {activeTab === "errors" && <AlertCircle className="size-4" />}
                  {activeTab === "warnings" && <AlertTriangle className="size-4" />}
                  {activeTab === "info" && <Info className="size-4" />}
                </EmptyMedia>
                <EmptyTitle className="text-xs">No {activeTab}</EmptyTitle>
                <EmptyDescription className="text-xs">
                  {activeTab === "errors" && "Great! There are no errors in your project"}
                  {activeTab === "warnings" && "No warnings to display at the moment"}
                  {activeTab === "info" && "No information messages to show"}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        ) : (
          <div>
            {filteredIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => handleIssueClick(issue)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b last:border-b-0"
              >
                <div className="mt-0.5">
                  {getIcon(issue.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs mb-0.5 truncate">{issue.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{issue.description}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Separate component for the heading that uses validation context
export function IssuesHeading() {
  const { errorCount, warningCount } = useValidation();
  const totalIssues = errorCount + warningCount;

  if (totalIssues === 0) {
    return <h2 className="font-semibold text-lg">No issues to address</h2>;
  }

  return (
    <h2 className="font-semibold text-lg">
      {totalIssues} {totalIssues === 1 ? 'issue needs' : 'issues need'} attention
    </h2>
  );
}