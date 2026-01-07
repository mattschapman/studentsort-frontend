// app/dashboard/[orgId]/_components/project-cards-grid.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ArrowUpDown, Filter, Search, FolderOpen } from "lucide-react"
import { ProjectCard } from "./project-card"
import { CreateProjectDialog } from "./create-project-dialog"

interface Project {
  id: string
  org_id: string
  title: string
  description: string | null
  status: string
  created_at: string
  updated_at: string
  created_by: string | null
}

interface Version {
  id: string
  version: number
  project_id: string
  org_id: string
  file_id: string | null
  created_at: string
  updated_at: string
}

interface ProjectCardsGridProps {
  projects: Project[]
  versions: Version[]
  orgId: string
  orgTitle: string
}

type SortOption =
  | "title_asc"
  | "title_desc"
  | "status_asc"
  | "status_desc"
  | "created_at_desc"
  | "created_at_asc"
  | "updated_at_desc"
  | "updated_at_asc"

type FilterState = {
  statuses: string[]
}

export function ProjectCardsGrid({ projects, versions, orgId, orgTitle }: ProjectCardsGridProps) {
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("created_at_desc")
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
  })

  const projectStatuses = [
    { value: "draft", label: "Draft" },
    { value: "published", label: "Published" },
    { value: "archived", label: "Archived" },
  ]

  const sortOptions = [
    { value: "title_asc", label: "Title (A-Z)" },
    { value: "title_desc", label: "Title (Z-A)" },
    { value: "status_asc", label: "Status (A-Z)" },
    { value: "status_desc", label: "Status (Z-A)" },
    { value: "created_at_desc", label: "Newest First" },
    { value: "created_at_asc", label: "Oldest First" },
    { value: "updated_at_desc", label: "Recently Updated" },
    { value: "updated_at_asc", label: "Least Recently Updated" },
  ]

  // Helper function to get latest version for a project
  const getLatestVersionId = (projectId: string) => {
    const projectVersions = versions
      .filter((version) => version.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
    return projectVersions[0]?.id
  }

  // Apply search, sorting, and filtering
  useEffect(() => {
    let filtered = [...projects]

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((p) =>
        p.title.toLowerCase().includes(query) ||
        (p.description?.toLowerCase().includes(query) ?? false)
      )
    }

    // Apply status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter((p) => filters.statuses.includes(p.status))
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title_asc":
          return a.title.localeCompare(b.title)
        case "title_desc":
          return b.title.localeCompare(a.title)
        case "status_asc":
          return a.status.localeCompare(b.status)
        case "status_desc":
          return b.status.localeCompare(a.status)
        case "created_at_desc":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "created_at_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "updated_at_desc":
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case "updated_at_asc":
          return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
        default:
          return 0
      }
    })

    setFilteredProjects(filtered)
  }, [projects, searchQuery, sortBy, filters])

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      statuses: checked
        ? [...prev.statuses, status]
        : prev.statuses.filter((s) => s !== status),
    }))
  }

  const clearFilters = () => {
    setFilters({
      statuses: [],
    })
    setSearchQuery("")
  }

  const hasActiveFilters =
    filters.statuses.length > 0 || searchQuery.trim() !== ""

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pt-5 lg:pt-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Projects</h1>

        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial flex flex-row items-center bg-gray-50">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-7 w-full sm:w-62.5 placeholder-xs! text-xs! h-7"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-0">
              {/* Sort */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="gap-2 rounded-sm text-muted-foreground"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-xs">Sort by</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setSortBy(option.value as SortOption)}
                      className={sortBy === option.value ? "bg-accent text-xs" : "text-xs"}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="gap-2 rounded-sm text-muted-foreground"
                  >
                    <Filter
                      className={`h-4 w-4 ${hasActiveFilters ? "text-primary" : ""}`}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs">Filter by</DropdownMenuLabel>
                  <DropdownMenuSeparator />

                  <DropdownMenuLabel className="text-xs font-medium text-gray-500 uppercase">
                    Status
                  </DropdownMenuLabel>
                  {projectStatuses.map((status) => (
                    <DropdownMenuCheckboxItem
                      key={status.value}
                      checked={filters.statuses.includes(status.value)}
                      onCheckedChange={(checked) =>
                        handleStatusFilterChange(status.value, checked)
                      }
                      className="text-xs"
                    >
                      {status.label}
                    </DropdownMenuCheckboxItem>
                  ))}

                  {hasActiveFilters && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearFilters} className="text-xs">
                        Clear Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* New Project Dialog */}
          <CreateProjectDialog orgId={orgId} orgTitle={orgTitle} />
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mt-3 flex flex-col gap-3">
        {filteredProjects.length === 0 && !hasActiveFilters ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No Projects Yet</EmptyTitle>
              <EmptyDescription>
                Get started by creating your first project.
              </EmptyDescription>
            </EmptyHeader>
            {/* <EmptyContent>
              <CreateProjectDialog orgId={orgId} orgTitle={orgTitle} />
            </EmptyContent> */}
          </Empty>
        ) : filteredProjects.length === 0 && hasActiveFilters ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No projects match your search</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search or filters to see more results.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="xs" variant="outline" onClick={clearFilters} className="text-xs">
                Clear Search & Filters
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => {
              const latestVersionId = getLatestVersionId(project.id)
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  latestVersionId={latestVersionId}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}