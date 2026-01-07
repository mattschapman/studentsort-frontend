// app/dashboard/(projects)/[orgId]/[projectId]/_components/edit-project-version-data-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getVersionJson } from "../_actions/get-version-json";
import { saveAsNewVersion } from "../_actions/save-as-new-version";

interface EditProjectVersionDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  orgId: string;
  versionId: string;
}

export function EditProjectVersionDataDialog({
  open,
  onOpenChange,
  projectId,
  orgId,
  versionId,
}: EditProjectVersionDataDialogProps) {
  const [originalJson, setOriginalJson] = useState<string>("");
  const [editedJson, setEditedJson] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch JSON when dialog opens
  useEffect(() => {
    if (open && versionId) {
      fetchVersionJson();
    }
  }, [open, versionId]);

  const fetchVersionJson = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getVersionJson(versionId);
      
      if (result.success && result.json) {
        // Pretty print the JSON
        const parsed = JSON.parse(result.json);
        const formatted = JSON.stringify(parsed, null, 2);
        setOriginalJson(formatted);
        setEditedJson(formatted);
      } else {
        setError(result.error || "Failed to load version data");
      }
    } catch (err) {
      setError("Failed to load version data");
    } finally {
      setIsLoading(false);
    }
  };

  const validateJson = (jsonString: string): boolean => {
    try {
      JSON.parse(jsonString);
      setJsonError(null);
      return true;
    } catch (error) {
      setJsonError("Invalid JSON format");
      return false;
    }
  };

  const handleJsonChange = (value: string) => {
    setEditedJson(value);
    // Clear error when user starts typing
    if (error) setError(null);
    // Validate on change but don't show error while typing
    if (value.trim()) {
      try {
        JSON.parse(value);
        setJsonError(null);
      } catch {
        // Don't set error while typing
      }
    }
  };

  const handleSave = async () => {
    // Validate before saving
    if (!validateJson(editedJson)) {
      setError("Please fix the JSON syntax errors before saving");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const result = await saveAsNewVersion(projectId, orgId, editedJson);
      
      if (result.success && result.versionId) {
        toast.success("Success", {
          description: `Version ${result.versionNumber} has been created`,
        });
        
        // Close dialog
        onOpenChange(false);
        
        // Navigate to new version
        router.push(`/dashboard/${orgId}/${projectId}?version=${result.versionId}`);
        router.refresh();
      } else {
        setError(result.error || "Failed to save new version");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = editedJson !== originalJson && editedJson.trim() !== "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Version Data</DialogTitle>
          <DialogDescription>
            Edit the JSON data below. Changes will be saved as a new version.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Textarea
                value={editedJson}
                onChange={(e) => handleJsonChange(e.target.value)}
                className="flex-1 font-mono text-sm resize-none min-h-100"
                placeholder="JSON data will appear here..."
                disabled={isSaving}
              />
              {jsonError && (
                <p className="text-sm text-destructive">{jsonError}</p>
              )}
            </>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setError(null);
              setJsonError(null);
              onOpenChange(false);
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving || isLoading || !!jsonError}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save as New Version"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}