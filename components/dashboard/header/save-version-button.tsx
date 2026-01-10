// components/dashboard/header/save-version-button.tsx
"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVersionData } from "@/lib/contexts/version-data-context";
import { saveAsNewVersion } from "@/app/dashboard/(projects)/[orgId]/[projectId]/_actions/save-as-new-version";
import { toast } from "sonner";

interface SaveVersionButtonProps {
  projectId: string;
  orgId: string;
}

export function SaveVersionButton({ projectId, orgId }: SaveVersionButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSaving, setIsSaving] = useState(false);
  const { versionData, hasUnsavedChanges, getVersionJsonString } = useVersionData();

  // Don't render if no version data is loaded
  if (!versionData) {
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading('Saving new version...');

    try {
      const jsonContent = getVersionJsonString();
      
      const result = await saveAsNewVersion(projectId, orgId, jsonContent);

      if (result.success && result.versionId) {
        toast.success('Version saved successfully!', { id: toastId });
        
        // Redirect to the new version
        router.push(`${pathname}?version=${result.versionId}`);
        
        // Force a refresh to reload the data
        router.refresh();
      } else {
        toast.error(`Failed to save: ${result.error}`, { id: toastId });
      }
    } catch (error) {
      console.error('Error saving version:', error);
      toast.error('An unexpected error occurred while saving', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="xs"
      onClick={handleSave}
      disabled={!hasUnsavedChanges || isSaving}
      className="text-xs"
      title={hasUnsavedChanges ? "Save changes as new version" : "No unsaved changes"}
    >
      {isSaving ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving...
        </>
      ) : hasUnsavedChanges ? (
        <>
          <span className="relative flex size-2 mr-0.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-orange-500"></span>
          </span>
          Save
        </>
      ) : (
        <>
          <span className="relative flex size-2 mr-0.5">
            {/* <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span> */}
            <span className="relative inline-flex size-2 rounded-full bg-primary"></span>
          </span>
          Progress saved
        </>
      )}
    </Button>
  );
}