// components/dashboard/header/version-switcher.tsx
"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronsUpDown, GitBranch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import type { Version } from "@/app/dashboard/_actions/get-orgs-projects";

interface VersionSwitcherProps {
  versions: Version[];
  currentProjectId?: string;
  currentVersionId?: string;
}

// Helper function to format relative time
function getRelativeTime(dateString: string): string {
  const now = new Date();
  const created = new Date(dateString);
  const diffInMs = now.getTime() - created.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return `${diffInDays}d ago`;
  }
}

export default function VersionSwitcher({
  versions,
  currentProjectId,
  currentVersionId,
}: VersionSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

  // Get versions for the current project, sorted by created_at descending (latest first)
  const projectVersions = currentProjectId
    ? versions
        .filter((version) => version.project_id === currentProjectId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : [];

  // Find current version
  const currentVersion = currentVersionId
    ? projectVersions.find((version) => version.id === currentVersionId)
    : null;

  // Check if current version is the latest
  const isLatestVersion = currentVersion && currentVersion.id === projectVersions[0]?.id;

  // Handle version selection
  const handleVersionSelect = (versionId: string) => {
    // Create new URLSearchParams and set the version
    const params = new URLSearchParams(searchParams.toString());
    params.set('version', versionId);
    
    // Navigate to the same path with updated query params
    router.push(`${pathname}?${params.toString()}`);
    setOpen(false);
  };

  // Handle create version (placeholder for now)
  const handleCreateVersion = () => {
    // TODO: Implement create version logic
    console.log("Create version clicked");
    setOpen(false);
  };

  // Don't render if no current project or no versions
  if (!currentProjectId || projectVersions.length === 0) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="h-7 gap-1 px-2 hover:bg-gray-50 text-xs"
        >
          {currentVersion ? (
            <div className="flex items-center gap-2">
              <span>v{currentVersion.version}</span>
              {/* <span className="text-[10px] text-gray-500">
                {getRelativeTime(currentVersion.created_at)}
              </span> */}
              {isLatestVersion ? (
                <span className="text-[10px] text-green-600 px-2 py-1 rounded-full bg-green-50 border border-green-100">
                  Latest
                </span>
              ) : (
                <span className="text-[10px] text-orange-600 px-2 py-1 rounded-full bg-orange-50 border border-orange-100">
                  Old
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs font-medium tracking-wide text-gray-900">
              Select Version
            </span>
          )}
          <ChevronsUpDown className="text-gray-500 ml-1" style={{ width: '14px', height: '14px' }} />
          <span className="sr-only">Switch version</span>
        </Button>
      </PopoverTrigger>

        <PopoverContent className="w-62.5 p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>No versions found.</CommandEmpty>
              
              <CommandGroup heading="Versions">
                {projectVersions.map((version) => {
                  const isLatest = version.id === projectVersions[0]?.id;
                  
                  return (
                    <CommandItem
                      key={version.id}
                      value={`version-${version.id}`}
                      onSelect={() => handleVersionSelect(version.id)}
                      className={`px-2 has-[>svg]:px-1.5 flex items-center gap-2 cursor-pointer hover:bg-accent ${
                        currentVersionId === version.id ? 'bg-accent' : ''
                      }`}
                    >
                      <GitBranch className="h-4 w-4 text-gray-500" />
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-xs">v{version.version}</span>
                        <span className="text-[10px] text-gray-500">
                          {getRelativeTime(version.created_at)}
                        </span>
                      </div>
                      {isLatest && (
                        <span className="text-[8px] text-green-600 px-1.5 py-0.5 rounded-full bg-green-50 border border-green-100">
                          Latest
                        </span>
                      )}
                      {currentVersionId === version.id && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </CommandItem>
                  );
                })}
                
                {/* Create Version Button */}
                {/* <div className="border-t pt-1 mt-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={handleCreateVersion}
                    className="w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-accent text-xs"
                  >
                    <Plus className="h-4 w-4" />
                    Create version
                  </Button>
                </div> */}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
  );
}