// components/dashboard/header/header.tsx
"use client";

import { useState } from "react";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Telescope, Database, TriangleAlert } from "lucide-react";
import { Logo } from "./header-logo";
import OrgSwitcher from "./org-switcher";
import ProjectSwitcher from "./project-switcher";
import VersionSwitcher from "./version-switcher";
import type { Organization, Project, Version } from "@/app/dashboard/_actions/get-orgs-projects";
import type { UserProfile } from "@/app/dashboard/_actions/get-user-profile";
import { UserDropdown } from "./user-dropdown";
import { Button } from "@/components/ui/button";
import { useInsights } from "@/lib/contexts/insights-context";
import { EditProjectVersionDataDialog } from "@/app/dashboard/(projects)/[orgId]/[projectId]/_components/edit-project-version-data-dialog";
import { SaveVersionButton } from "./save-version-button";
import { useIssueStatus } from "@/lib/contexts/validation-context";

interface DashboardHeaderProps {
  organizations: Organization[];
  projects: Project[];
  versions: Version[];
  user: UserProfile;
}

export default function DashboardHeader({
  organizations,
  projects,
  versions,
  user,
}: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const { isInsightsOpen, isIssuesOpen, toggleInsights, toggleIssues } = useInsights();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { hasErrors, hasWarnings, errorCount, warningCount } = useIssueStatus();

  // Parse /dashboard/{orgId}/{projectId} with optional additional path segments
  const pathSegments = pathname.split('/').filter(Boolean);
  
  let currentOrgId: string | undefined;
  let currentProjectId: string | undefined;
  let currentVersionId: string | undefined;

  // Route structure: /dashboard/{orgId}/{projectId}
  if (pathSegments.length >= 2 && pathSegments[0] === 'dashboard') {
    currentOrgId = pathSegments[1];
    
    if (pathSegments.length >= 3) {
      const thirdSegment = pathSegments[2];
      // Only treat it as a project if it exists in the projects data
      const isValidProject = projects.some(p => p.id === thirdSegment);
      if (isValidProject) {
        currentProjectId = thirdSegment;
      }
    }
  }

  // Get version from query params
  currentVersionId = searchParams.get('version') ?? undefined;

  // Determine what to show
  const showOrgSwitcher = !!currentOrgId;
  const showProjectSwitcher = !!currentProjectId;
  const showVersionSwitcher = !!currentProjectId && versions.some(v => v.project_id === currentProjectId);
  const showPanelButtons = !!currentProjectId;
  const showEditButton = !!currentProjectId && !!currentVersionId;
  const showSaveButton = !!currentProjectId && !!currentVersionId;

  const handleToggleIssues = () => {
    // Clear hash if panel is currently open (about to close)
    if (isIssuesOpen && window.location.hash.startsWith('#issue-')) {
      history.pushState('', document.title, window.location.pathname + window.location.search);
    }
    toggleIssues();
  };

  return (
    <>
      <header className="z-50 w-full h-11 px-3 py-2 border-b flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <Logo 
            size="sm" 
            showTitle={false} 
            organizations={organizations}
            currentOrgId={currentOrgId}
          />

          {/* Show org switcher when on org or project pages */}
          {showOrgSwitcher && (
            <>
              <span className="mx-1 text-md text-gray-400 font-light">/</span>
              <OrgSwitcher
                organizations={organizations}
                projects={projects}
                currentOrgId={currentOrgId}
                currentProjectId={currentProjectId}
              />
            </>
          )}

          {/* Show project switcher only when on project pages */}
          {showProjectSwitcher && (
            <>
              <span className="mr-1 text-md text-gray-400 font-light">/</span>
              <ProjectSwitcher
                organizations={organizations}
                projects={projects}
                currentOrgId={currentOrgId}
                currentProjectId={currentProjectId}
              />
            </>
          )}

          {/* Show version switcher when on project pages with versions */}
          {showVersionSwitcher && (
            <>
              <span className="mr-1 text-md text-gray-400 font-light">/</span>
              <VersionSwitcher
                versions={versions}
                currentProjectId={currentProjectId}
                currentVersionId={currentVersionId}
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Save button - only show on project pages with version selected */}
          {showSaveButton && currentProjectId && currentOrgId && (
            <SaveVersionButton projectId={currentProjectId} orgId={currentOrgId} />
          )}

          {/* Edit version data button - only show when version is selected */}
          {showEditButton && currentOrgId && currentProjectId && currentVersionId && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
              className="rounded-full h-8 w-8"
              title="Edit version data"
            >
              <Database className="h-4 w-4" />
            </Button>
          )}

          {/* Issues button - only show on project pages */}
          {showPanelButtons && (
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleIssues}
                className={`rounded-full h-8 w-8 ${isIssuesOpen ? 'bg-blue-500 hover:bg-blue-600 text-white hover:text-white' : 'hover:bg-blue-500 hover:text-white'}`}
                title={isIssuesOpen ? "Close issues panel" : "Open issues panel"}
              >
                <TriangleAlert className="h-4 w-4" />
              </Button>
              {/* Issue indicator */}
              {(hasErrors || hasWarnings) && (
                <span
                  className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                    hasErrors ? 'bg-red-500' : 'bg-orange-500'
                  }`}
                />
              )}
            </div>
          )}

          {/* Insights button - only show on project pages */}
          {showPanelButtons && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleInsights}
              className={`rounded-full h-8 w-8 ${isInsightsOpen ? 'bg-blue-500 hover:bg-blue-600 text-white hover:text-white' : 'hover:bg-blue-500 hover:text-white'}`}
              title={isInsightsOpen ? "Close insights panel" : "Open insights panel"}
            >
              <Telescope className="h-4 w-4" />
            </Button>
          )}
          
          <UserDropdown 
            user={{
              name: user.name,
              email: user.email,
              avatar: user.avatar || "/avatars/shadcn.jpg", // fallback avatar
            }} 
          />
        </div>
      </header>

      {/* Edit Version Data Dialog */}
      {showEditButton && currentOrgId && currentProjectId && currentVersionId && (
        <EditProjectVersionDataDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          projectId={currentProjectId}
          orgId={currentOrgId}
          versionId={currentVersionId}
        />
      )}
    </>
  );
}