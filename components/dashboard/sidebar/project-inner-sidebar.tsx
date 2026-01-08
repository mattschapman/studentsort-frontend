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
  const addParamsToHref = (href: string, includeYearGroup?: string) => {
    const params = new URLSearchParams()
    if (version) {
      params.set('version', version)
    }
    if (includeYearGroup) {
      params.set('yearGroup', includeYearGroup)
    }
    const queryString = params.toString()
    return queryString ? `${href}?${queryString}` : href
  }

  // Build dynamic Model section data
  const getModelSectionData = (): SectionData | null => {
    // If loading, return structure with empty items (skeleton will be shown)
    if (isLoading) {
      return {
        title: "Model",
        sections: [
          {
            label: "CURRICULUM MODEL",
            items: []
          },
          {
            label: "OTHER",
            items: [
              {
                label: "Other Activities",
                href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/other-activities`,
              },
            ]
          }
        ]
      }
    }

    if (!versionData?.data?.year_groups) {
      return {
        title: "Model",
        sections: [
          {
            label: "CURRICULUM MODEL",
            items: []
          },
          {
            label: "OTHER",
            items: [
              {
                label: "Other Activities",
                href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/other-activities`,
              },
            ]
          }
        ]
      }
    }

    // Sort year groups by order
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
          label: "OTHER",
          items: [
            {
              label: "Other Activities",
              href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/other-activities`,
            },
          ]
        }
      ]
    }
  }

  // Get section data based on active section
  const sectionData = activeSection === 'model' 
    ? getModelSectionData()
    : (activeSection ? innerNavigationItems[activeSection] : null)

  // Don't render inner sidebar if no active section
  if (!activeSection || !sectionData) {
    return null
  }

  const isActive = (item: any, sectionIndex: number, itemIndex: number) => {
    const baseHref = item.href(orgId, projectId)
    
    // Special handling for Model section with year groups
    if (activeSection === 'model' && sectionIndex === 0 && item.yearGroupId) {
      // Check if we're on the model page (not other-activities)
      const isOnModelPage = pathname === `/dashboard/${orgId}/${projectId}/model`
      
      if (!isOnModelPage) return false
      
      // If there's a yearGroup param, check if it matches
      if (yearGroupParam) {
        return yearGroupParam === item.yearGroupId
      }
      
      // If no yearGroup param, the first item should be active
      return itemIndex === 0
    }
    
    // For other-activities or non-model sections
    if (pathname === baseHref) {
      return true
    }
    
    // Check if we're on the base section path and this is the first item
    if (itemIndex === 0 && activeSection && !item.yearGroupId) {
      const basePath = `/dashboard/${orgId}/${projectId}/${activeSection}`
      return pathname === basePath
    }
    
    return false
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

        {/* Sectioned Navigation */}
        <nav className="space-y-0">
          {activeSection === 'model' && isLoading ? (
            /* Show loading skeleton for Curriculum Model section only */
            <>
              <div>
                <div className="pt-4 pb-2 px-4.5">
                  <h3 className="text-xs text-muted-foreground/80 tracking-wide">
                    CURRICULUM MODEL
                  </h3>
                </div>
                <div className="space-y-0.5 px-2 mb-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="py-1.5 px-2.5">
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
                <Separator className="my-2" />
              </div>
              
              {/* Always show Other Activities section */}
              <div>
                <div className="pt-4 pb-2 px-4.5">
                  <h3 className="text-xs text-muted-foreground/80 tracking-wide">
                    OTHER
                  </h3>
                </div>
                <div className="space-y-0.5 px-2 mb-4">
                  <Link
                    href={addVersionToHref(`/dashboard/${orgId}/${projectId}/model/other-activities`)}
                    className={cn(
                      "group flex items-center py-1.5 px-2.5 text-xs rounded-sm transition-colors",
                      "hover:bg-accent hover:text-black",
                      pathname === `/dashboard/${orgId}/${projectId}/model/other-activities`
                        ? "font-bold text-black bg-accent" 
                        : "font-medium text-muted-foreground"
                    )}
                  >
                    <span className="truncate">
                      Other Activities
                    </span>
                  </Link>
                </div>
              </div>
            </>
          ) : (
            /* Normal rendering when not loading */
            sectionData.sections.map((section, sectionIndex) => {
              let itemIndex = 0
              // Calculate the global index for this section's first item
              for (let i = 0; i < sectionIndex; i++) {
                itemIndex += sectionData.sections[i].items.length
              }

              return (
                <div key={section.label || `section-${sectionIndex}`}>
                  {/* Section Header - only render if label exists */}
                  {section.label && (
                    <div className="pt-4 pb-2 px-4.5">
                      <h3 className="text-xs text-muted-foreground/80 tracking-wide">
                        {section.label}
                      </h3>
                    </div>
                  )}
                  
                  {/* Section Items */}
                  <div className={cn(
                    "space-y-0.5 px-2 mb-4",
                    // Add top padding if no label (to maintain spacing)
                    !section.label && "pt-4"
                  )}>
                    {section.items.map((item: any, localIndex) => {
                      const globalIndex = itemIndex + localIndex
                      const baseHref = item.href(orgId, projectId)
                      
                      // Add appropriate params based on item type
                      const hrefWithParams = item.yearGroupId
                        ? addParamsToHref(baseHref, item.yearGroupId)
                        : addVersionToHref(baseHref)
                      
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
                          <span className="truncate">
                            {item.label}
                          </span>
                        </Link>
                      )
                    })}
                  </div>

                  {/* Add separator after each section except the last one */}
                  {sectionIndex < sectionData.sections.length - 1 && (
                    <Separator className="my-2" />
                  )}
                </div>
              )
            })
          )}
        </nav>
      </div>
    </div>
  )
}