// components/dashboard/sidebar/project-outer-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { 
  Home, 
  Database, 
  Users,
  Settings,
  Calendar,
  Grid,
  Box,
  PanelLeft,
  Lightbulb,
  TriangleAlert,
  CheckSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSidebarState } from "@/hooks/use-sidebar-state"
import { Separator } from "@/components/ui/separator"

interface ProjectOuterSidebarProps {
  orgId: string
  projectId: string
}

export const navigationSections = [
  {
    items: [
      {
        label: "Project Overview",
        icon: Home,
        href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}`,
        exactMatch: true,
        hasInnerSidebar: false,
        isBackButton: false,
        preserveVersion: true,
      },
    ]
  },
  {
    items: [
      {
        label: "Data",
        icon: Database,
        href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/data`,
        exactMatch: false,
        hasInnerSidebar: true,
        isBackButton: false,
        preserveVersion: true,
      },
      {
        label: "Model",
        icon: Box,
        href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/model`,
        exactMatch: false,
        hasInnerSidebar: true,
        isBackButton: false,
        preserveVersion: true,
      },
      // {
      //   label: "Checks",
      //   icon: CheckSquare,
      //   href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/checks`,
      //   exactMatch: false,
      //   hasInnerSidebar: false,
      //   isBackButton: false,
      //   preserveVersion: true,
      // },
      // {
      //   label: "Staffing",
      //   icon: Users,
      //   href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/staffing`,
      //   exactMatch: false,
      //   hasInnerSidebar: false,
      //   isBackButton: false,
      //   preserveVersion: true,
      // },
      {
        label: "Timetable",
        icon: Calendar,
        href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/timetable`,
        exactMatch: false,
        hasInnerSidebar: false,
        isBackButton: false,
        preserveVersion: true,
      },
      // {
      //   label: "Analysis",
      //   icon: Lightbulb,
      //   href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/analysis`,
      //   exactMatch: false,
      //   hasInnerSidebar: false,
      //   isBackButton: false,
      //   preserveVersion: true,
      // },
    ]
  },
  {
    items: [
      {
        label: "Project Settings",
        icon: Settings,
        href: (orgId: string, projectId: string) => `/dashboard/${orgId}/${projectId}/settings`,
        exactMatch: false,
        hasInnerSidebar: false,
        isBackButton: false,
        preserveVersion: true,
      },
    ]
  },
]

const sidebarOptions = [
  { value: "expanded", label: "Expanded" },
  { value: "collapsed", label: "Collapsed" },
  { value: "hover", label: "Expand on hover" },
] as const

export default function ProjectOuterSidebar({ orgId, projectId }: ProjectOuterSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const version = searchParams.get('version')
  const insights = searchParams.get('insights')
  
  const {
    sidebarState,
    setSidebarState,
    isExpanded,
    setIsHovered,
    isHydrated,
  } = useSidebarState()
  
  const getHrefWithVersion = (item: typeof navigationSections[0]['items'][0]) => {
    const baseHref = item.href(orgId, projectId)
    const params = new URLSearchParams()
    
    // Preserve version if applicable
    if (item.preserveVersion && version) {
      params.set('version', version)
    }
    
    // Preserve insights param if it's open
    if (insights === 'open') {
      params.set('insights', 'open')
    }
    
    const queryString = params.toString()
    return queryString ? `${baseHref}?${queryString}` : baseHref
  }
  
  const isActive = (item: typeof navigationSections[0]['items'][0]) => {
    const href = item.href(orgId, projectId)
    
    // Return to Org should never be active
    if (item.isBackButton) {
      return false
    }
    
    if (item.exactMatch) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div 
      className={cn(
        "h-full border-r bg-white shrink-0 relative transition-all duration-300 ease-in-out",
        isHydrated 
          ? (isExpanded ? "w-48" : "w-12")
          : "w-48"
      )}
      onMouseEnter={() => sidebarState === "hover" && setIsHovered(true)}
      onMouseLeave={() => sidebarState === "hover" && setIsHovered(false)}
    >
      <div className="p-2 h-full flex flex-col">
        {/* Navigation Items - Now with overflow handling */}
        <nav className="space-y-0 flex-1 overflow-y-auto">
          {navigationSections.map((section, sectionIndex) => (
            <div 
              key={sectionIndex}
              className={cn(
                sectionIndex === 0 ? "pb-2" : "py-2",
                sectionIndex < navigationSections.length - 1 && "border-b border-b-gray-100"
              )}
            >
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item)
                  const Icon = item.icon
                  
                  return (
                    <Link
                      key={item.label}
                      href={getHrefWithVersion(item)}
                      className={cn(
                        "group flex items-center gap-2 p-1.5 text-xs rounded-sm transition-colors relative",
                        "hover:bg-accent hover:text-black",
                        active 
                          ? "font-bold text-black bg-accent" 
                          : "font-medium text-muted-foreground"
                      )}
                      title={(!isHydrated || !isExpanded) ? item.label : undefined}
                    >
                      <Icon 
                        className={cn(
                          "h-4 w-4 shrink-0 group-hover:text-black transition-colors",
                          active ? "text-black" : "text-gray-500"
                        )} 
                      />
                      <span 
                        className={cn(
                          "truncate",
                          isHydrated && "transition-all duration-300 ease-in-out",
                          isHydrated 
                            ? (isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden")
                            : "opacity-100 w-auto"
                        )}
                      >
                        {item.label}
                      </span>

                      {/* Tooltip for collapsed state */}
                      {isHydrated && !isExpanded && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Controls - Fixed at bottom */}
        <div className="mt-auto pt-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                // match org behaviour: show tooltip/title when collapsed (not rely on hydration)
                title={!isExpanded ? "Sidebar options" : undefined}
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent 
              side="right" 
              align="end"
              className="w-40 p-0"
            >
              <div>
                <div className="px-1 pt-1">
                  <div className="p-1 pb-1.5 text-xs font-medium text-muted-foreground">
                    Sidebar control
                  </div>
                </div>
                <Separator />
                <div className="p-1 space-y-1">
                  {sidebarOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={sidebarState === option.value ? "secondary" : "ghost"}
                      size="xs"
                      className="w-full justify-start text-xs relative"
                      onClick={() => setSidebarState(option.value)}
                    >
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 shrink-0">
                          {sidebarState === option.value && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                        </div>
                        {option.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  )
}