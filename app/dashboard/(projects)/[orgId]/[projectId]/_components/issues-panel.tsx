// app/dashboard/(projects)/[orgId]/[projectId]/_components/issues-panel.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight, ChevronLeft, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInsights } from "@/lib/contexts/insights-context";
import { useValidation } from "@/lib/contexts/validation-context";
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

export default function IssuesPanel() {
  const router = useRouter();
  const { closePanel, isIssuesOpen } = useInsights();
  const { getIssuesByType, errorCount, warningCount, infoCount, issues } = useValidation();
  const [activeTab, setActiveTab] = useState<TabType>("errors");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Check URL hash on mount and when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#issue-')) {
        const issueId = hash.replace('#issue-', '');
        const issue = issues.find(i => i.id === issueId);
        if (issue) {
          setSelectedIssue(issue);
          // Set the active tab based on the issue type
          setActiveTab(issue.type === 'error' ? 'errors' : issue.type === 'warning' ? 'warnings' : 'info');
        }
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [issues]);

  // Clear hash when panel closes
  useEffect(() => {
    if (!isIssuesOpen && window.location.hash.startsWith('#issue-')) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  }, [isIssuesOpen]);

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
  const filteredIssues = getIssuesByType(activeTab === "errors" ? "error" : activeTab === "warnings" ? "warning" : "info");

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
    setSelectedIssue(null); // Reset selection when switching tabs
    // Clear hash when switching tabs
    if (window.location.hash) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  };

  const handleActionClick = (issue: Issue) => {
    if (issue.action) {
      router.push(issue.action.path);
      closePanel(); // Close panel when navigating
    }
  };

  const handleIssueClick = (issue: Issue) => {
    setSelectedIssue(issue);
    // Update hash
    window.location.hash = `issue-${issue.id}`;
  };

  const handleBackClick = () => {
    setSelectedIssue(null);
    // Clear hash
    if (window.location.hash) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
  };

  const handleClose = () => {
    // Clear hash before closing
    if (window.location.hash.startsWith('#issue-')) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    closePanel();
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
            onClick={handleBackClick}
            className="h-8 w-8 -ml-2"
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          {getIcon(selectedIssue.type)}
          <h2 className="font-semibold text-sm flex-1 truncate">{selectedIssue.title}</h2>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="size-3.5" />
          </Button>
        </div>

        {/* Detail Content */}
        <div className="flex-1 overflow-auto px-5 py-3">
          <div className="space-y-6">
            <div className="pt-2 flex flex-col gap-2">
              <h4 className="font-semibold text-sm">Details</h4>
              <div className="prose prose-xs max-w-none">
                <p className="text-xs whitespace-pre-line">{selectedIssue.details}</p>
              </div>
            </div>
            
            <div className="pt-2 flex flex-col gap-2">
              <h4 className="font-semibold text-sm">Recommendation</h4>
              <div className="prose prose-xs max-w-none">
                <p className="text-xs whitespace-pre-line">{selectedIssue.recommendation}</p>
              </div>
            </div>
            
            {/* Action Button */}
            {selectedIssue.action && (
              <div className="pt-2 flex flex-col gap-2">
                <h4 className="font-semibold text-sm">Action</h4>
                <Button
                  size="xs"
                  className="text-xs w-fit"
                  onClick={() => handleActionClick(selectedIssue)}
                >
                  {selectedIssue.action.label}
                </Button>
              </div>
            )}
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
            onClick={handleClose}
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
          <div>
            {filteredIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => handleIssueClick(issue)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-b"
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