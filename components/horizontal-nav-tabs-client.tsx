// components/horizontal-nav-tabs-client.tsx
'use client'

import { useState, useRef, useEffect } from 'react'

interface NavigationItem {
  name: string
  value: string
}

interface ClientSideHorizontalNavTabsProps {
  items: NavigationItem[]
  activeValue?: string
  defaultActiveIndex?: number
  onTabChange: (value: string, index: number) => void
}

export default function ClientSideHorizontalNavTabs({ 
  items, 
  activeValue,
  defaultActiveIndex = 0,
  onTabChange 
}: ClientSideHorizontalNavTabsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [hoverStyle, setHoverStyle] = useState({})
  const [activeStyle, setActiveStyle] = useState({ left: "0px", width: "0px" })
  const tabRefs = useRef<(HTMLDivElement | null)[]>([])
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  
  // Get the active tab index based on the activeValue prop
  const activeIndex = activeValue 
    ? items.findIndex(item => item.value === activeValue)
    : -1
  
  // Use default active index if no exact match is found
  const currentActiveIndex = activeIndex === -1 ? defaultActiveIndex : activeIndex
  
  // Update hover styles when a tab is hovered
  useEffect(() => {
    if (hoveredIndex !== null) {
      const hoveredElement = tabRefs.current[hoveredIndex]
      if (hoveredElement) {
        const { offsetLeft, offsetWidth } = hoveredElement
        setHoverStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    }
  }, [hoveredIndex])
  
  // Update active tab indicator position
  useEffect(() => {
    const activeElement = tabRefs.current[currentActiveIndex]
    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement
      setActiveStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`,
      })
    }
  }, [currentActiveIndex])
  
  // Initialize active tab indicator position
  useEffect(() => {
    requestAnimationFrame(() => {
      const activeElement = tabRefs.current[currentActiveIndex]
      if (activeElement) {
        const { offsetLeft, offsetWidth } = activeElement
        setActiveStyle({
          left: `${offsetLeft}px`,
          width: `${offsetWidth}px`,
        })
      }
    })
  }, [])

  const handleTabClick = (item: NavigationItem, index: number) => {
    onTabChange(item.value, index)
  }
  
  return (
    <nav className="mt-3 mb-0 pb-2.5">
      <div className="relative inline-block">
        {/* Hover Highlight */}
        <div
          className="absolute h-6.25 transition-all duration-300 ease-out bg-[#0e0f1114] rounded-[6px] flex items-center"
          style={{
            ...hoverStyle,
            opacity: hoveredIndex !== null ? 1 : 0,
          }}
        />
        
        {/* Horizontal line underneath tabs only - static, no animation */}
        {/* <div className="absolute -bottom-1.5 left-0 right-0 h-px bg-[#0e0f1120]" /> */}
        
        {/* Active Indicator */}
        <div
          className="absolute -bottom-2.5 h-0.5 bg-[#0e0f11] transition-all duration-300 ease-out z-10"
          style={activeStyle}
        />
        
        {/* Tabs */}
        <div 
          ref={tabsContainerRef}
          className="relative flex space-x-1.5 items-center"
        >
          {items.map((item, index) => (
            <div
              key={item.value}
              ref={(el) => { tabRefs.current[index] = el }}
              className={`px-2 py-1 cursor-pointer transition-colors duration-300 h-6.25 ${
                currentActiveIndex === index ? 'text-[#0e0e10]' : 'text-[#0e0f1199]'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => handleTabClick(item, index)}
            >
              <div className="text-xs font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full">
                {item.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}