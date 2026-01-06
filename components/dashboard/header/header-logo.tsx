// components/dashboard/header/header-logo.tsx
import Link from "next/link"
import { cn } from "@/lib/utils"
import type { Organization } from "@/app/dashboard/_actions/get-orgs-projects"

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTitle?: boolean
  organizations: Organization[]
  currentOrgId?: string
}

const sizeVariants = {
  sm: {
    container: "text-sm font-bold",
    gap: "gap-2",
    iconSize: "w-5 h-5",
    iconText: "text-md",
    textSize: "text-sm"
  },
  md: {
    container: "text-xl font-bold",
    gap: "gap-3",
    iconSize: "w-6 h-6",
    iconText: "text-lg",
    textSize: "text-xl"
  },
  lg: {
    container: "text-2xl font-bold",
    gap: "gap-4",
    iconSize: "w-8 h-8",
    iconText: "text-xl",
    textSize: "text-2xl"
  }
}

export function Logo({ size = 'md', showTitle = true, organizations, currentOrgId }: LogoProps) {
    const variant = sizeVariants[size]
    
    // Determine the href based on current org or fallback
    const getHref = () => {
        // Fallback to dashboard root
        return '/dashboard'
    }
    
    return (
        <Link
            href={getHref()}
            className={cn("flex items-center", variant.container, showTitle && variant.gap)}
        >
            <div className="inline-block">
                <div className={cn("relative", variant.iconSize)}>
                    {/* main tile */}
                    <div className={cn(
                        "relative z-10 w-full h-full rounded-xs bg-emerald-600 flex items-center justify-center font-semibold text-white",
                        variant.iconText
                    )}>
                        S
                    </div>
                </div>
            </div>
            {showTitle && (
                <span className={cn("truncate font-semibold", variant.textSize)}>StudentSort</span>
            )}
        </Link>
    )
}