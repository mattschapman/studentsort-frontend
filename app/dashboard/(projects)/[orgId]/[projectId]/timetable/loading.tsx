// app/dashboard/(projects)/[orgId]/[projectId]/timetable/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Sticky header */}
      <div className="sticky top-0 z-50 border-b bg-white">
        <div className="px-4 py-3 flex justify-between items-center">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>

      {/* Page content */}
      <div className="w-full h-full grid grid-cols-5">
        {/* Schedule area */}
        <div className="col-span-4 min-h-120 border-r border-b flex flex-col gap-4 p-6 relative">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading timetable...</p>
            </div>
          </div>
          <div className="flex w-full justify-between items-center">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="w-28 h-8" />
          </div>
          <div className="w-full flex-1 min-h-0 border rounded-sm"></div>
        </div>

        {/* Stats area */}
        <div className="col-span-1 h-full min-h-120 flex flex-col">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-6 py-5 border-b flex flex-col gap-4 flex-1">
              <Skeleton className="h-4 w-24" />
              <div className="flex gap-2 items-center">
                <Skeleton className="h-7 w-20" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>
          ))}
        </div>

        {/* Second row */}
        <div className="col-span-4 min-h-12 border-r border-b flex gap-6 items-center px-6">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>
        <div className="col-span-1 min-h-12 border-b flex gap-6 items-center px-6">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-16 h-4" />
        </div>

        {/* Third row - KPI cards */}
        <div className="col-span-4 border-r border-b grid grid-cols-4 gap-6 p-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64 rounded-md border" />
          ))}
        </div>
        <div className="col-span-1 border-b"></div>
      </div>
    </div>
  );
}