// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/unsaved-changes-dialog.tsx
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndContinue: () => void;
  onContinueWithoutSaving: () => void;
  actionName: string; // e.g., "auto-scheduling" or "diagnostics"
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSaveAndContinue,
  onContinueWithoutSaving,
  actionName,
}: UnsavedChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Unsaved Changes
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span>
              You have unsaved changes in your current version. {actionName} will use the{" "}
              <strong>last saved version</strong>, not your current changes.
            </span>
            <span> Would you like to save your changes first?</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="outline"
            onClick={onContinueWithoutSaving}
          >
            Continue Without Saving
          </Button>
          <AlertDialogAction onClick={onSaveAndContinue}>
            Save & Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}