// app/dashboard/(projects)/[orgId]/[projectId]/timetable/page.tsx
"use client";

import { useVersionData } from "@/lib/contexts/version-data-context";
import { ScheduleGrid } from "./_components/schedule-grid";
import { Stats } from "./_components/stats";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, ArrowDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TimetablePage() {
  const { versionData, isLoading, error } = useVersionData();
  const [viewMode, setViewMode] = useState<'bands' | 'teachers'>('bands');

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !versionData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          {error || "No version data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">

      {/* Page content */}
      <div className="w-full h-full grid grid-cols-5">
        {/* Schedule grid section */}
        <div className="col-span-4 min-h-120 border-r border-b flex flex-col gap-4">
          <div className="flex w-full justify-between items-center">
            <div className="flex gap-0.5 items-center">
              <h2 className="text-lg font-medium">Schedule</h2>
              <Button size="icon" variant="ghost">
                <Pencil className="size-4" />
              </Button>
            </div>
            <div className="flex gap-3 items-center">
              <p className="text-muted-foreground text-sm">View by</p>
              <Select 
                value={viewMode} 
                onValueChange={(value) => setViewMode(value as 'bands' | 'teachers')}
              >
                <SelectTrigger className="w-28 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bands">Bands</SelectItem>
                  <SelectItem value="teachers">Teachers</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="w-full flex-1 min-h-0 overflow-hidden">
            <ScheduleGrid viewMode={viewMode} />
          </div>
        </div>

        {/* Stats section */}
        <Stats />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      <div className="sticky top-0 z-50 border-b bg-white">
        <div className="px-4 py-3 flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      <div className="w-full h-full grid grid-cols-5">
        <div className="col-span-4 min-h-120 border-r border-b flex flex-col gap-4 p-6 relative">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading version...</p>
            </div>
          </div>
        </div>

        <div className="col-span-1 h-full min-h-120 flex flex-col">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-6 py-5 border-b flex flex-col gap-4 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}