// hooks/use-sidebar-state.ts
"use client"

import { useState, useEffect } from "react"

export type SidebarState = "expanded" | "collapsed" | "hover"

const SIDEBAR_STATE_KEY = "sidebar-state"

export function useSidebarState() {
  const [sidebarState, setSidebarState] = useState<SidebarState>("expanded")
  const [isHovered, setIsHovered] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY) as SidebarState
    if (savedState && ["expanded", "collapsed", "hover"].includes(savedState)) {
      setSidebarState(savedState)
    }
    setIsHydrated(true)
  }, [])

  // Save state to localStorage when it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(SIDEBAR_STATE_KEY, sidebarState)
    }
  }, [sidebarState, isHydrated])

  // Determine if sidebar should be expanded
  const isExpanded = 
    sidebarState === "expanded" || 
    (sidebarState === "hover" && isHovered)

  return {
    sidebarState,
    setSidebarState,
    isExpanded,
    isHovered,
    setIsHovered,
    isHydrated, // Export hydration state
  }
}