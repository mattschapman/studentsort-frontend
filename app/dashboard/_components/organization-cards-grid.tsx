// app/dashboard/_components/organization-cards-grid.tsx
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
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ArrowUpDown, Search, Building2 } from "lucide-react"
import { OrganizationCard } from "./organization-card"

interface Organization {
  id: string
  title: string
  slug: string
  created_at: string
  updated_at: string
}

interface Project {
  id: string
  org_id: string
}

interface OrganizationCardsGridProps {
  organizations: Organization[]
  projects: Project[]
}

type SortOption =
  | "title_asc"
  | "title_desc"
  | "created_at_desc"
  | "created_at_asc"
  | "updated_at_desc"
  | "updated_at_asc"

export function OrganizationCardsGrid({ organizations, projects }: OrganizationCardsGridProps) {
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>(organizations)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("title_asc")

  const sortOptions = [
    { value: "title_asc", label: "Title (A-Z)" },
    { value: "title_desc", label: "Title (Z-A)" },
    { value: "created_at_desc", label: "Newest First" },
    { value: "created_at_asc", label: "Oldest First" },
    { value: "updated_at_desc", label: "Recently Updated" },
    { value: "updated_at_asc", label: "Least Recently Updated" },
  ]

  // Helper function to get project count for an organization
  const getProjectCount = (orgId: string) => {
    return projects.filter((p) => p.org_id === orgId).length
  }

  // Apply search and sorting
  useEffect(() => {
    let filtered = [...organizations]

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((org) =>
        org.title.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "title_asc":
          return a.title.localeCompare(b.title)
        case "title_desc":
          return b.title.localeCompare(a.title)
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

    setFilteredOrganizations(filtered)
  }, [organizations, searchQuery, sortBy])

  const clearSearch = () => {
    setSearchQuery("")
  }

  const hasSearch = searchQuery.trim() !== ""

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6 pt-5 lg:pt-10">
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold tracking-tight">Organizations</h1>

        <div className="flex items-center justify-between gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1">
            {/* Search */}
            <div className="relative flex-1 sm:flex-initial flex flex-row items-center bg-gray-50">
              <Search className="absolute left-2.5 top-2 h-3 w-3 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search organizations..."
                className="pl-7 w-full sm:w-62.5 placeholder-xs! text-xs! h-7"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

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
          </div>
        </div>
      </div>

      {/* Organizations Grid */}
      <div className="mt-3 flex flex-col gap-3">
        {filteredOrganizations.length === 0 && !hasSearch ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No organizations yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Get started by creating your first organization to manage projects and timetables.
            </p>
          </div>
        ) : filteredOrganizations.length === 0 && hasSearch ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Search className="h-6 w-6" />
              </EmptyMedia>
              <EmptyTitle>No organizations match your search</EmptyTitle>
              <EmptyDescription>
                Try adjusting your search to see more results.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="xs" variant="outline" onClick={clearSearch} className="text-xs">
                Clear Search
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizations.map((org) => {
              const projectCount = getProjectCount(org.id)
              return (
                <OrganizationCard
                  key={org.id}
                  organization={org}
                  projectCount={projectCount}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}