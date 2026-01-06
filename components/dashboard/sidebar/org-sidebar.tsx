// components/dashboard/sidebar/org-sidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FolderOpen, Users, Zap, Settings, PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useSidebarState } from "@/hooks/use-sidebar-state"
import { Separator } from "@/components/ui/separator"

interface OrganizationsOuterSidebarProps {
  orgId: string
}

const navigationItems = [
  {
    label: "Projects",
    icon: FolderOpen,
    href: (orgId: string) => `/dashboard/${orgId}`,
    exactMatch: true, // Only active on exact route
  },
  {
    label: "Team",
    icon: Users,
    href: (orgId: string) => `/dashboard/${orgId}/team`,
    exactMatch: false,
  },
  {
    label: "Integrations", 
    icon: Zap,
    href: (orgId: string) => `/dashboard/${orgId}/integrations`,
    exactMatch: false,
  },
  {
    label: "Organisation settings",
    icon: Settings,
    href: (orgId: string) => `/dashboard/${orgId}/settings`,
    exactMatch: false,
  },
]

const sidebarOptions = [
  { value: "expanded", label: "Expanded" },
  { value: "collapsed", label: "Collapsed" },
  { value: "hover", label: "Expand on hover" },
] as const

export default function OrganizationsOuterSidebar({ orgId }: OrganizationsOuterSidebarProps) {
  const pathname = usePathname()
  const {
    sidebarState,
    setSidebarState,
    isExpanded,
    setIsHovered,
  } = useSidebarState()

  const isActive = (item: typeof navigationItems[0]) => {
    const href = item.href(orgId)
    if (item.exactMatch) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div 
      className={cn(
        "h-full border-r bg-white shrink-0 transition-all duration-300 ease-in-out relative",
        isExpanded ? "w-48" : "w-12"
      )}
      onMouseEnter={() => sidebarState === "hover" && setIsHovered(true)}
      onMouseLeave={() => sidebarState === "hover" && setIsHovered(false)}
    >
      <div className="p-2 h-full flex flex-col">
        {/* Navigation Items */}
        <nav className="space-y-0.5 flex-1">
          {navigationItems.map((item) => {
            const active = isActive(item)
            const Icon = item.icon
            
            return (
              <Link
                key={item.label}
                href={item.href(orgId)}
                className={cn(
                  "group flex items-center gap-2 p-1.5 text-xs rounded-sm transition-colors relative",
                  "hover:bg-accent hover:text-black",
                  active 
                    ? "font-bold text-black bg-accent" 
                    : "font-medium text-muted-foreground"
                )}
                title={!isExpanded ? item.label : undefined}
              >
                <Icon 
                  className={cn(
                    "h-4 w-4 shrink-0 group-hover:text-black transition-colors",
                    active ? "text-black" : "text-gray-500",
                  )} 
                />
                <span 
                  className={cn(
                    "truncate transition-all duration-300 ease-in-out",
                    isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 overflow-hidden"
                  )}
                >
                  {item.label}
                </span>

                {/* Tooltip for collapsed state */}
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Controls - Fixed at bottom */}
        <div className="mt-auto">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 transition-all duration-300",
                  !isExpanded && "w-8"
                )}
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