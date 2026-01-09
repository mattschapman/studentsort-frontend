// components/horizontal-nav-tabs-client.tsx
'use client'

import { useState, useRef, useEffect } from 'react'

interface NavigationItem {
  name: string
  value: string
  count?: number
  countColor?: 'red' | 'orange' | 'blue'
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

  const getCountBadgeColor = (color?: 'red' | 'orange' | 'blue') => {
    switch (color) {
      case 'red':
        return 'bg-red-500'
      case 'orange':
        return 'bg-orange-500'
      case 'blue':
        return 'bg-blue-500'
      default:
        return 'bg-gray-500'
    }
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
              <div className="text-xs font-medium leading-5 whitespace-nowrap flex items-center justify-center h-full gap-1.5">
                {item.name}
                {item.count !== undefined && item.count > 0 && (
                  <span className={`${getCountBadgeColor(item.countColor)} text-white text-[10px] font-semibold px-1.5 py-0.5 rounded min-w-4.5 text-center leading-none`}>
                    {item.count}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </nav>
  )
}