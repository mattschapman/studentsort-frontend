// components/dashboard/sidebar/project-inner-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useVersionData } from "@/lib/contexts/version-data-context"

interface ProjectInnerSidebarProps {
  orgId: string
  projectId: string
}

interface NavigationItem {
  label: string
  href: (orgId: string, projectId: string) => string
  yearGroupId?: string
}

interface NavigationSection {
  label?: string
  items: NavigationItem[]
}

interface SectionData {
  title: string
  sections: NavigationSection[]
}

const innerNavigationItems: Record<string, SectionData> = {
  cycle: {
    title: "Cycle",
    sections: [
      {
        label: "CONFIGURE",
        items: [
          {
            label: "Periods",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/cycle`
          },
          {
            label: "Timings (Optional)",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/cycle/timings`
          },
          {
            label: "Settings",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/cycle/settings`
          }
        ]
      }
    ]
  },
  data: {
    title: "Data",
    sections: [
      {
        label: "CYCLE",
        items: [
          {
            label: "Periods",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/data`
          },
        ]
      },
      {
        label: "COHORTS",
        items: [
          {
            label: "Bands",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/data/bands`,
          },
        ]
      },
      {
        label: "ACADEMIC",
        items: [
          {
            label: "Departments",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/data/departments`,
          },
          {
            label: "Subjects",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/data/subjects`,
          },
        ]
      },
      {
        label: "RESOURCES",
        items: [
          {
            label: "Teachers",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/data/teachers`,
          },
        ]
      }
    ]
  },
  settings: {
    title: "Project Settings",
    sections: [
      {
        label: "PROJECT",
        items: [
          {
            label: "General",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/settings`
          }
        ]
      },
      {
        label: "TIMETABLE",
        items: [
          {
            label: "Auto-scheduling",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/settings/auto-scheduling`
          },
          {
            label: "Constraints",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/settings/constraints`
          }
        ]
      }
    ]
  },
}

export default function ProjectInnerSidebar({ orgId, projectId }: ProjectInnerSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const version = searchParams.get('version')
  const yearGroupParam = searchParams.get('yearGroup')
  const { versionData, isLoading } = useVersionData()

  // Determine which section is active based on pathname
  const getActiveSection = (): string | null => {
    if (pathname.includes('/cycle')) return 'cycle'
    if (pathname.includes('/data')) return 'data'
    if (pathname.includes('/model')) return 'model'
    if (pathname.includes('/settings')) return 'settings'
    return null
  }

  const activeSection = getActiveSection()

  // Helper to add version to href
  const addVersionToHref = (href: string) => {
    if (version) {
      return `${href}?version=${version}`
    }
    return href
  }

  // Helper to add version and yearGroup to href
  const addParamsToHref = (href: string, yearGroupId?: string) => {
    const params = new URLSearchParams()
    if (version) params.set('version', version)
    if (yearGroupId) params.set('yearGroup', yearGroupId)
    const queryString = params.toString()
    return queryString ? `${href}?${queryString}` : href
  }

  // Build dynamic Model section data
  const getModelSectionData = (): SectionData => {
    const otherActivitiesItems: NavigationItem[] = [
      {
        label: "Staff Meetings",
        href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/staff-meetings`,
      },
      {
        label: "Form Time",
        href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/form-time`,
      },
      {
        label: "Extracurricular",
        href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/extracurricular`,
      },
      {
        label: "Break/Lunch Duty",
        href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/break-duty`,
      },
    ]

    // Loading or no year groups: show empty curriculum + other activities
    if (isLoading || !versionData?.data?.year_groups || versionData.data.year_groups.length === 0) {
      return {
        title: "Model",
        sections: [
          {
            label: "CURRICULUM MODEL",
            items: [] // Will render skeletons if loading
          },
          {
            label: "OTHER ACTIVITIES",
            items: otherActivitiesItems
          },
          {
            label: 'MANAGE',
            items: [
              {
                label: 'Batches',
                href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/batches`,
              }
            ]
          }
        ]
      }
    }

    // Normal case: sort year groups and include other activities
    const sortedYearGroups = [...versionData.data.year_groups].sort((a, b) => a.order - b.order)

    return {
      title: "Model",
      sections: [
        {
          label: "CURRICULUM MODEL",
          items: sortedYearGroups.map(yg => ({
            label: `Year ${yg.name}`,
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model`,
            yearGroupId: yg.id
          }))
        },
        {
          label: "OTHER ACTIVITIES",
          items: otherActivitiesItems
        },
        {
          label: 'MANAGE',
          items: [
            {
              label: 'Batches',
              href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/batches`,
            }
          ]
        }
      ]
    }
  }

  // Get section data based on active section
  const sectionData = activeSection === 'model' 
    ? getModelSectionData()
    : (activeSection ? innerNavigationItems[activeSection] : null)

  // Don't render if no active section
  if (!activeSection || !sectionData) {
    return null
  }

  const isActive = (item: NavigationItem, sectionIndex: number, itemIndex: number) => {
  const baseHref = item.href(orgId, projectId)

  // Special handling for Year Group tabs in Curriculum Model
  if (activeSection === 'model' && sectionIndex === 0 && item.yearGroupId) {
    const isOnModelRoot = pathname === `/dashboard/${orgId}/${projectId}/model`
    if (!isOnModelRoot) return false

    if (yearGroupParam) {
      return yearGroupParam === item.yearGroupId
    }
    // Default: first year group active when no param
    return itemIndex === 0
  }

  // For Model "Other Activities" items, allow child routes
  if (activeSection === 'model') {
    return pathname === baseHref || pathname.startsWith(baseHref + '/')
  }

  // For all other sections (Cycle, Data), use exact matching
  return pathname === baseHref
}

  return (
    <div className="w-56 h-full border-r bg-white shrink-0">
      <div className="h-full">
        {/* Section Title */}
        <div className="py-2 px-4.5">
          <h2 className="text-base font-semibold text-black">
            {sectionData.title}
          </h2>
        </div>
        
        <Separator />

        {/* Navigation */}
        <nav className="space-y-0">
          {sectionData.sections.map((section, sectionIndex) => {
            const hasItems = section.items.length > 0
            const isCurriculumModelLoading = activeSection === 'model' && sectionIndex === 0 && isLoading

            return (
              <div key={section.label || `section-${sectionIndex}`}>
                {/* Section Header */}
                {section.label && (
                  <div className="pt-4 pb-2 px-4.5">
                    <h3 className="text-xs text-muted-foreground/80 tracking-wide">
                      {section.label}
                    </h3>
                  </div>
                )}

                {/* Items or Skeletons */}
                <div className={cn(
                  "space-y-0.5 px-2 mb-4",
                  !section.label && "pt-4"
                )}>
                  {isCurriculumModelLoading ? (
                    // Show skeletons only for Curriculum Model during load
                    [...Array(6)].map((_, i) => (
                      <div key={i} className="py-1.5 px-2.5">
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))
                  ) : hasItems ? (
                    section.items.map((item, localIndex) => {
                      const globalIndex = sectionData.sections
                        .slice(0, sectionIndex)
                        .reduce((acc, s) => acc + s.items.length, 0) + localIndex

                      const hrefWithParams = item.yearGroupId
                        ? addParamsToHref(item.href(orgId, projectId), item.yearGroupId)
                        : addVersionToHref(item.href(orgId, projectId))

                      const active = isActive(item, sectionIndex, globalIndex)

                      return (
                        <Link
                          key={item.label}
                          href={hrefWithParams}
                          className={cn(
                            "group flex items-center py-1.5 px-2.5 text-xs rounded-sm transition-colors",
                            "hover:bg-accent hover:text-black",
                            active
                              ? "font-bold text-black bg-accent"
                              : "font-medium text-muted-foreground"
                          )}
                        >
                          <span className="truncate">{item.label}</span>
                        </Link>
                      )
                    })
                  ) : null}
                </div>

                {/* Separator after section (except last) */}
                {sectionIndex < sectionData.sections.length - 1 && <Separator className="my-2" />}
              </div>
            )
          })}
        </nav>
      </div>
    </div>
  )
}