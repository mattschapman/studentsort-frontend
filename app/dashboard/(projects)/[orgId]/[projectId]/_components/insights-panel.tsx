// app/dashboard/(projects)/[orgId]/[projectId]/_components/insights-panel.tsx
"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInsights } from "@/lib/contexts/insights-context";

export default function InsightsPanel() {
  const { closePanel } = useInsights();

  return (
    <div className="w-110 border-l bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-lg">Insights</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={closePanel}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Overview</h3>
            <p className="text-sm text-muted-foreground">
              This is the insights panel. It will display analytics and insights
              about your project as you work.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Recent Activity</h3>
            <p className="text-sm text-muted-foreground">
              Activity metrics will appear here.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Quick Stats</h3>
            <p className="text-sm text-muted-foreground">
              Project statistics and metrics will be displayed here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}