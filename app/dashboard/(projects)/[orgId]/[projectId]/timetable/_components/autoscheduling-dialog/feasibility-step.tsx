// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/autoscheduling-dialog/feasibility-step.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { submitDiagnosticsJob, checkDiagnosticsStatus } from "../../_actions/submit-diagnostics-job";

type FeasibilityStatus = 'idle' | 'checking' | 'passed' | 'failed';

interface FeasibilityStepProps {
  versionData: any;
  orgId: string;
  projectId: string;
  feasibilityStatus: FeasibilityStatus;
  feasibilityError: string | null;
  onStatusChange: (status: FeasibilityStatus) => void;
  onErrorChange: (error: string | null) => void;
}

export function FeasibilityStep({
  versionData,
  orgId,
  projectId,
  feasibilityStatus,
  feasibilityError,
  onStatusChange,
  onErrorChange,
}: FeasibilityStepProps) {
  const handleCheckFeasibility = async () => {
    onStatusChange('checking');
    onErrorChange(null);

    try {
      // Submit diagnostics job
      const result = await submitDiagnosticsJob({
        versionData,
        orgId,
        projectId,
        maxTimeSeconds: 30,
      });

      if (!result.success) {
        onStatusChange('failed');
        onErrorChange(result.error || 'Failed to start feasibility check');
        return;
      }

      const taskId = result.taskId!;

      // Poll for status
      const pollInterval = setInterval(async () => {
        const statusResult = await checkDiagnosticsStatus(taskId);

        if (!statusResult.success) {
          clearInterval(pollInterval);
          onStatusChange('failed');
          onErrorChange('Failed to check task status');
          return;
        }

        const status = statusResult.status;

        if (status === 'completed') {
          clearInterval(pollInterval);
          // Check if overall feasible
          const overallFeasible = statusResult.result?.overall_feasible;
          if (overallFeasible) {
            onStatusChange('passed');
          } else {
            onStatusChange('failed');
            onErrorChange('The timetable configuration is not feasible with the current constraints.');
          }
        } else if (status === 'failed') {
          clearInterval(pollInterval);
          onStatusChange('failed');
          onErrorChange(statusResult.error || 'Feasibility check failed');
        }
      }, 2000);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (feasibilityStatus === 'checking') {
          onStatusChange('failed');
          onErrorChange('Feasibility check timed out');
        }
      }, 300000);
    } catch (error: any) {
      onStatusChange('failed');
      onErrorChange(error.message || 'An unexpected error occurred');
      console.error('Feasibility check error:', error);
    }
  };

  const handleRunDiagnostics = () => {
    // Placeholder for diagnostics - could open a separate dialog or navigate to a page
    console.log('Run full diagnostics');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Feasibility Status Display */}
        {feasibilityStatus === 'idle' && (
          <div className="border border-dashed rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Click the button below to check if your configuration is feasible
            </p>
            <Button
              type="button"
              onClick={handleCheckFeasibility}
            >
              Check Feasibility
            </Button>
          </div>
        )}

        {feasibilityStatus === 'checking' && (
          <div className="border rounded-lg p-6 text-center bg-muted/50">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-primary" />
            <p className="text-sm font-medium">Checking feasibility...</p>
            <p className="text-xs text-muted-foreground mt-1">
              This may take a few moments
            </p>
          </div>
        )}

        {feasibilityStatus === 'passed' && (
          <div className="border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 rounded-lg p-6 text-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-green-900 dark:text-green-100">
              Feasibility check passed!
            </p>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              Your configuration can be scheduled successfully
            </p>
          </div>
        )}

        {feasibilityStatus === 'failed' && (
          <div className="border border-destructive/50 bg-destructive/10 rounded-lg p-6 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-3" />
            <p className="text-sm font-medium text-destructive">
              Feasibility check failed
            </p>
            {feasibilityError && (
              <p className="text-xs text-destructive/80 mt-2">
                {feasibilityError}
              </p>
            )}
            <div className="flex gap-2 justify-center mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCheckFeasibility}
              >
                Try Again
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRunDiagnostics}
              >
                Run Diagnostics
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}