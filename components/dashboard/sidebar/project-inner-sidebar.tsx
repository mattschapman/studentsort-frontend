// components/dashboard/sidebar/project-inner-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
// import { navigationSections } from "./project-outer-sidebar"

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
  data: {
    title: "Data",
    sections: [
      {
        label: "COHORTS",
        items: [
          {
            label: "Bands",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/data/bands`,
          },
          {
            label: "Students",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/data/students`,
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
          {
            label: "Rooms",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/data/rooms`,
          },
        ]
      }
    ]
  },
  model: {
    title: "Model",
    sections: [
      {
        label: "ACADEMIC",
        items: [
          {
            label: "Curriculum Model",
            href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model/curriculum`,
          },
        ]
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
  },
}

export default function ProjectInnerSidebar({ orgId, projectId }: ProjectInnerSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const version = searchParams.get('version')

  // Determine which section is active based on pathname
  const getActiveSection = (): keyof typeof innerNavigationItems | null => {
    if (pathname.includes('/data')) return 'data'
    if (pathname.includes('/model')) return 'model'
    return null
  }

  const activeSection = getActiveSection()
  const sectionData = activeSection ? innerNavigationItems[activeSection] : null

  // Helper to add version to href
  const addVersionToHref = (href: string) => {
    if (version) {
      return `${href}?version=${version}`
    }
    return href
  }

  // Don't render inner sidebar if no active section
  if (!activeSection || !sectionData) {
    return null
  }

  const isActive = (href: string, index: number) => {
    // Check if this specific href matches
    if (pathname === href) {
      return true
    }
    
    // Check if we're on the base section path and this is the first item
    if (index === 0 && activeSection) {
      const basePath = `/dashboard/${orgId}/${projectId}/${activeSection}`
      return pathname === basePath
    }
    
    return false
  }

  return (
    <div className="w-48 h-full border-r bg-white shrink-0">
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
          {sectionData.sections.map((section, sectionIndex) => {
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
                  {section.items.map((item, localIndex) => {
                    const globalIndex = itemIndex + localIndex
                    const baseHref = item.href(orgId, projectId)
                    const hrefWithVersion = addVersionToHref(baseHref)
                    const active = isActive(baseHref, globalIndex)
                    
                    return (
                      <Link
                        key={item.label}
                        href={hrefWithVersion}
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
          })}
        </nav>
      </div>
    </div>
  )
}