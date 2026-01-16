// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/autoscheduling-progress-overlay.tsx
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, X, CheckCircle2, XCircle } from "lucide-react";
import { useAutoSchedulingJob } from "../_hooks/use-autoscheduling-job";

interface AutoSchedulingProgressOverlayProps {
  orgId: string;
  projectId: string;
  activeJobId: string | null;
  onClose: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  initialising: "Initializing solver",
  constructing_blocks: "Constructing lesson blocks",
  scheduling_lessons: "Scheduling lessons",
  finding_teachers: "Assigning teachers",
  checking_everything: "Finalizing solution",
};

export function AutoSchedulingProgressOverlay({
  orgId,
  projectId,
  activeJobId,
  onClose,
}: AutoSchedulingProgressOverlayProps) {
  const { jobStatus, cancelJob, isActive } = useAutoSchedulingJob(
    orgId,
    projectId,
    activeJobId
  );

  // Don't show overlay if no active job
  if (!jobStatus) {
    return null;
  }

  const isCompleted = jobStatus.status === "completed";
  const isFailed = jobStatus.status === "failed";
  const isCancelled = jobStatus.status === "cancelled";
  const showCloseButton = isCompleted || isFailed || isCancelled;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {isActive && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {isFailed && <XCircle className="h-5 w-5 text-red-600" />}
              <CardTitle>
                {isActive && "Auto-Scheduling in Progress"}
                {isCompleted && "Auto-Scheduling Complete"}
                {isFailed && "Auto-Scheduling Failed"}
                {isCancelled && "Auto-Scheduling Cancelled"}
              </CardTitle>
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {jobStatus.stage && (
            <CardDescription>
              {STAGE_LABELS[jobStatus.stage] || jobStatus.stage}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isActive && (
            <>
              <Progress value={jobStatus.progress} className="w-full" />
              <div className="text-sm text-muted-foreground text-center">
                {jobStatus.progress}% complete
              </div>
            </>
          )}

          {isCompleted && (
            <div className="text-sm text-muted-foreground text-center">
              Your new timetable has been generated successfully. Click "View Result" in the notification to see it.
            </div>
          )}

          {isFailed && jobStatus.error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {jobStatus.error}
            </div>
          )}

          {isActive && (
            <Button
              variant="outline"
              onClick={cancelJob}
              className="w-full"
            >
              Cancel Auto-Scheduling
            </Button>
          )}

          {showCloseButton && (
            <Button
              variant="default"
              onClick={onClose}
              className="w-full"
            >
              Close
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}