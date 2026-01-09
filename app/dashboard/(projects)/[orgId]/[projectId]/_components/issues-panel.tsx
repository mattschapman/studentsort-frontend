// app/dashboard/(projects)/[orgId]/[projectId]/_components/issues-panel.tsx
"use client";

import { useState } from "react";
import { X, ChevronRight, ChevronLeft, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
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

// Type definition
type IssueType = "error" | "warning" | "info";

interface Issue {
  id: string;
  type: IssueType;
  title: string;
  description: string;
  details: string;
}

// Dummy data
const DUMMY_ISSUES: Issue[] = [
  {
    id: "1",
    type: "error",
    title: "Auth RLS Initialization Plan",
    description: "public.orgs_memberships",
    details: "The Row Level Security (RLS) policy for the orgs_memberships table has not been properly initialized. This could lead to unauthorized access to organization membership data.\n\nRecommended action: Review and apply the initialization plan in the security configuration panel.",
  },
  {
    id: "2",
    type: "error",
    title: "Auth RLS Initialization Plan",
    description: "public.orgs",
    details: "Missing RLS policies on the organizations table. All rows are currently accessible without proper authorization checks.\n\nRecommended action: Enable RLS and create appropriate policies for organization access control.",
  },
];

type TabType = "errors" | "warnings" | "info";

export default function IssuesPanel() {
  const { closePanel } = useInsights();
  const [activeTab, setActiveTab] = useState<TabType>("errors");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Navigation items for tabs
  const navItems = [
    { 
      name: `Errors${DUMMY_ISSUES.filter(i => i.type === "error").length > 0 ? ` (${DUMMY_ISSUES.filter(i => i.type === "error").length})` : ''}`, 
      value: "errors" 
    },
    { 
      name: `Warnings${DUMMY_ISSUES.filter(i => i.type === "warning").length > 0 ? ` (${DUMMY_ISSUES.filter(i => i.type === "warning").length})` : ''}`, 
      value: "warnings" 
    },
    { 
      name: `Info${DUMMY_ISSUES.filter(i => i.type === "info").length > 0 ? ` (${DUMMY_ISSUES.filter(i => i.type === "info").length})` : ''}`, 
      value: "info" 
    },
  ];

  // Filter issues by type
  const filteredIssues = DUMMY_ISSUES.filter((issue) => {
    if (activeTab === "errors") return issue.type === "error";
    if (activeTab === "warnings") return issue.type === "warning";
    if (activeTab === "info") return issue.type === "info";
    return false;
  });

  const getIcon = (type: IssueType) => {
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
    setSelectedIssue(null); // Reset selection when switching tabs
  };

  if (selectedIssue) {
    // Detail view
    return (
      <div className="w-110 border-l bg-white flex flex-col h-full">
        {/* Detail Header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedIssue(null)}
            className="h-8 w-8 -ml-2"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          {getIcon(selectedIssue.type)}
          <h2 className="font-semibold text-sm flex-1 truncate">{selectedIssue.title}</h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={closePanel}
            className="h-8 w-8"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Detail Content */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-4">
            <div className="prose prose-xs max-w-none">
              <p className="text-xs whitespace-pre-line">{selectedIssue.details}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="w-110 border-l bg-white flex flex-col h-full">
      {/* Header with Tabs */}
      <div className="border-b px-4">
        <div className="flex items-center justify-between">
          <ClientSideHorizontalNavTabs
            items={navItems}
            activeValue={activeTab}
            onTabChange={handleTabChange}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={closePanel}
            className="h-8 w-8 ml-2"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
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
          <div className="divide-y">
            {filteredIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="mt-0.5">
                  {getIcon(issue.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-xs mb-0.5 truncate">{issue.title}</h3>
                  <p className="text-xs text-muted-foreground truncate">{issue.description}</p>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0 mr-2" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Export function to get issue counts for header indicator
export function useIssueStatus() {
  const errorCount = DUMMY_ISSUES.filter(i => i.type === "error").length;
  const warningCount = DUMMY_ISSUES.filter(i => i.type === "warning").length;
  
  return {
    hasErrors: errorCount > 0,
    hasWarnings: warningCount > 0,
    errorCount,
    warningCount,
  };
}