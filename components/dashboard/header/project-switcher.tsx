// components/dashboard/header/project-switcher.tsx
"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronsUpDown, Building2, FolderOpen, Plus } from "lucide-react";
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
import type { Organization, Project } from "@/app/dashboard/_actions/get-orgs-projects";

interface ProjectSwitcherProps {
  organizations: Organization[];
  projects: Project[];
  currentOrgId?: string;
  currentProjectId?: string;
}

export default function ProjectSwitcher({
  organizations,
  projects,
  currentOrgId,
  currentProjectId,
}: ProjectSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const [hoveredColumn, setHoveredColumn] = React.useState<"organizations" | "projects">("projects");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Track which org is being hovered for dynamic project filtering
  const [hoveredOrgId, setHoveredOrgId] = React.useState<string | null>(currentOrgId || null);

  // Reset hover states when popover opens
  React.useEffect(() => {
    if (open) {
      setHoveredColumn("projects");
      setHoveredOrgId(currentOrgId || null);
    }
  }, [open, currentOrgId]);

  // Get current project
  const currentProject = projects.find((project) => project.id === currentProjectId);

  // Get projects for the hovered organization
  const filteredProjects = hoveredOrgId
    ? projects.filter((project) => project.org_id === hoveredOrgId)
    : [];

  // Handle organization selection
  const handleOrgSelect = (orgId: string) => {
    router.push(`/dashboard/${orgId}`);
    setOpen(false);
  };

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      // Preserve version query param if it exists
      const version = searchParams.get('version');
      const url = version 
        ? `/dashboard/${project.org_id}/${projectId}?version=${version}`
        : `/dashboard/${project.org_id}/${projectId}`;
      router.push(url);
      setOpen(false);
    }
  };

  // Handle create actions (placeholder for now)
  const handleCreateOrg = () => {
    // TODO: Implement create organization logic
    setOpen(false);
  };

  const handleCreateProject = () => {
    // TODO: Implement create project logic
    setOpen(false);
  };

  // Get the URL for the current project link
  const getCurrentProjectUrl = () => {
    if (!currentProject || !currentOrgId) return '#';
    
    // Preserve version query param if it exists
    const version = searchParams.get('version');
    return version 
      ? `/dashboard/${currentOrgId}/${currentProject.id}?version=${version}`
      : `/dashboard/${currentOrgId}/${currentProject.id}`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="flex items-center gap-1">
        {currentProject ? (
          <Link 
            href={getCurrentProjectUrl()}
            className="text-xs font-medium tracking-wide text-gray-900 hover:text-gray-700 transition-colors flex flex-row items-center gap-2"
          >
            {/* <FolderOpen className="w-3 h-3" /> */}
            {currentProject.title}
          </Link>
        ) : (
          <span className="text-xs font-medium tracking-wide text-gray-900">
            Select Project
          </span>
        )}
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-gray-50"
          >
            <ChevronsUpDown className="text-gray-500" style={{ width: '14px', height: '14px' }} />
            <span className="sr-only">Switch project</span>
          </Button>
        </PopoverTrigger>
      </div>

      <PopoverContent className="w-125 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            <div className="flex">
              {/* Organizations Column */}
              <div 
                className={`flex-1 border-r transition-colors ${
                  hoveredColumn === "organizations" ? "bg-white" : "bg-gray-50"
                }`}
                onMouseEnter={() => setHoveredColumn("organizations")}
              >
                <CommandGroup heading="Organizations">
                  {organizations.map((org) => (
                    <CommandItem
                      key={org.id}
                      value={`org-${org.id}`}
                      onSelect={() => handleOrgSelect(org.id)}
                      onMouseEnter={() => setHoveredOrgId(org.id)}
                      className={`flex items-center gap-2 cursor-pointer mb-1 hover:bg-accent ${
                        org.id === currentOrgId ? 'bg-accent' : ''
                      }`}
                    >
                      <Building2 className="h-3 w-3 text-gray-500" />
                      <span className="flex-1 text-xs">{org.title}</span>
                      {org.id === currentOrgId && (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </CommandItem>
                  ))}
                  
                  {/* Create Organization Button */}
                  {/* <div className="py-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleCreateOrg}
                      className="text-xs w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-accent"
                    >
                      <Plus className="h-3 w-3" />
                      Create Organisation
                    </Button>
                  </div> */}
                </CommandGroup>
              </div>

              {/* Projects Column */}
              <div 
                className={`flex-1 transition-colors ${
                  hoveredColumn === "projects" ? "bg-white" : "bg-gray-50"
                }`}
                onMouseEnter={() => setHoveredColumn("projects")}
              >
                <CommandGroup heading="Projects">
                  {hoveredOrgId ? (
                    filteredProjects.length > 0 ? (
                      <>
                        {filteredProjects.map((project) => (
                          <CommandItem
                            key={project.id}
                            value={`project-${project.id}`}
                            onSelect={() => handleProjectSelect(project.id)}
                            className={`flex items-center gap-2 cursor-pointer mb-1 hover:bg-accent ${
                              project.id === currentProjectId ? 'bg-accent' : ''
                            }`}
                          >
                            {/* <FolderOpen className="h-3 w-3 text-gray-500" /> */}
                            <span className="flex-1 text-xs">{project.title}</span>
                            {project.id === currentProjectId && (
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </CommandItem>
                        ))}
                        
                        {/* Create Project Button */}
                        {/* <div>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={handleCreateProject}
                            className="text-xs w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-accent"
                          >
                            <Plus className="h-3 w-3" />
                            Create Project
                          </Button>
                        </div> */}
                      </>
                    ) : (
                      <>
                        <div className="px-2 py-6 text-center text-xs text-gray-500">
                          No projects in this organization
                        </div>
                        
                        {/* Create Project Button */}
                        {/* <div>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={handleCreateProject}
                            className="text-xs w-full justify-start text-gray-600 hover:text-gray-900 hover:bg-accent"
                          >
                            <Plus className="h-3 w-3" />
                            Create Project
                          </Button>
                        </div> */}
                      </>
                    )
                  ) : (
                    <div className="px-2 py-6 text-center text-xs text-gray-500">
                      Select an organization to view projects
                    </div>
                  )}
                </CommandGroup>
              </div>
            </div>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}