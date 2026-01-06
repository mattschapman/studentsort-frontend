// components/dashboard/header/header.tsx
"use client";

import React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Logo } from "./header-logo";
import OrgSwitcher from "./org-switcher";
import ProjectSwitcher from "./project-switcher";
import VersionSwitcher from "./version-switcher";
import type { Organization, Project, Version } from "@/app/dashboard/_actions/get-orgs-projects";
import type { UserProfile } from "@/app/dashboard/_actions/get-user-profile";
import { UserDropdown } from "./user-dropdown";
import { Button } from "@/components/ui/button";

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
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();

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

  return (
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
        <UserDropdown 
          user={{
            name: user.name,
            email: user.email,
            avatar: user.avatar || "/avatars/shadcn.jpg", // fallback avatar
          }} 
        />
      </div>
    </header>
  );
}