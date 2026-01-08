// components/color-picker.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Palette } from "lucide-react"

// Tailwind color definitions
const colors = [
  { name: "slate", label: "Slate" },
  { name: "red", label: "Red" },
  { name: "orange", label: "Orange" },
  { name: "yellow", label: "Yellow" },
  { name: "lime", label: "Lime" },
  { name: "green", label: "Green" },
  { name: "blue", label: "Blue" },
  { name: "purple", label: "Purple" },
  { name: "pink", label: "Pink" },
]

// Only light shades 100-400
const shades = [100, 200, 300, 400]

// Color class mappings for consistent rendering (including 500 for hover states)
const colorClasses: Record<string, Record<number, string>> = {
  slate: {
    100: "bg-slate-100", 200: "bg-slate-200", 300: "bg-slate-300", 400: "bg-slate-400", 500: "bg-slate-500"
  },
  red: {
    100: "bg-red-100", 200: "bg-red-200", 300: "bg-red-300", 400: "bg-red-400", 500: "bg-red-500"
  },
  orange: {
    100: "bg-orange-100", 200: "bg-orange-200", 300: "bg-orange-300", 400: "bg-orange-400", 500: "bg-orange-500"
  },
  yellow: {
    100: "bg-yellow-100", 200: "bg-yellow-200", 300: "bg-yellow-300", 400: "bg-yellow-400", 500: "bg-yellow-500"
  },
  lime: {
    100: "bg-lime-100", 200: "bg-lime-200", 300: "bg-lime-300", 400: "bg-lime-400", 500: "bg-lime-500"
  },
  green: {
    100: "bg-green-100", 200: "bg-green-200", 300: "bg-green-300", 400: "bg-green-400", 500: "bg-green-500"
  },
  blue: {
    100: "bg-blue-100", 200: "bg-blue-200", 300: "bg-blue-300", 400: "bg-blue-400", 500: "bg-blue-500"
  },
  purple: {
    100: "bg-purple-100", 200: "bg-purple-200", 300: "bg-purple-300", 400: "bg-purple-400", 500: "bg-purple-500"
  },
  pink: {
    100: "bg-pink-100", 200: "bg-pink-200", 300: "bg-pink-300", 400: "bg-pink-400", 500: "bg-pink-500"
  },
}

// Hover background classes (one shade darker)
const hoverBgClasses: Record<string, Record<number, string>> = {
  slate: {
    100: "hover:bg-slate-200", 200: "hover:bg-slate-300", 300: "hover:bg-slate-400", 400: "hover:bg-slate-500"
  },
  red: {
    100: "hover:bg-red-200", 200: "hover:bg-red-300", 300: "hover:bg-red-400", 400: "hover:bg-red-500"
  },
  orange: {
    100: "hover:bg-orange-200", 200: "hover:bg-orange-300", 300: "hover:bg-orange-400", 400: "hover:bg-orange-500"
  },
  yellow: {
    100: "hover:bg-yellow-200", 200: "hover:bg-yellow-300", 300: "hover:bg-yellow-400", 400: "hover:bg-yellow-500"
  },
  lime: {
    100: "hover:bg-lime-200", 200: "hover:bg-lime-300", 300: "hover:bg-lime-400", 400: "hover:bg-lime-500"
  },
  green: {
    100: "hover:bg-green-200", 200: "hover:bg-green-300", 300: "hover:bg-green-400", 400: "hover:bg-green-500"
  },
  blue: {
    100: "hover:bg-blue-200", 200: "hover:bg-blue-300", 300: "hover:bg-blue-400", 400: "hover:bg-blue-500"
  },
  purple: {
    100: "hover:bg-purple-200", 200: "hover:bg-purple-300", 300: "hover:bg-purple-400", 400: "hover:bg-purple-500"
  },
  pink: {
    100: "hover:bg-pink-200", 200: "hover:bg-pink-300", 300: "hover:bg-pink-400", 400: "hover:bg-pink-500"
  },
}

// Hover border classes (one shade darker)
const hoverBorderClasses: Record<string, Record<number, string>> = {
  slate: {
    100: "hover:border-slate-200", 200: "hover:border-slate-300", 300: "hover:border-slate-400", 400: "hover:border-slate-500"
  },
  red: {
    100: "hover:border-red-200", 200: "hover:border-red-300", 300: "hover:border-red-400", 400: "hover:border-red-500"
  },
  orange: {
    100: "hover:border-orange-200", 200: "hover:border-orange-300", 300: "hover:border-orange-400", 400: "hover:border-orange-500"
  },
  yellow: {
    100: "hover:border-yellow-200", 200: "hover:border-yellow-300", 300: "hover:border-yellow-400", 400: "hover:border-yellow-500"
  },
  lime: {
    100: "hover:border-lime-200", 200: "hover:border-lime-300", 300: "hover:border-lime-400", 400: "hover:border-lime-500"
  },
  green: {
    100: "hover:border-green-200", 200: "hover:border-green-300", 300: "hover:border-green-400", 400: "hover:border-green-500"
  },
  blue: {
    100: "hover:border-blue-200", 200: "hover:border-blue-300", 300: "hover:border-blue-400", 400: "hover:border-blue-500"
  },
  purple: {
    100: "hover:border-purple-200", 200: "hover:border-purple-300", 300: "hover:border-purple-400", 400: "hover:border-purple-500"
  },
  pink: {
    100: "hover:border-pink-200", 200: "hover:border-pink-300", 300: "hover:border-pink-400", 400: "hover:border-pink-500"
  },
}

// Text color classes for subject text (all use darker shades since we only have light backgrounds)
const textColorClasses: Record<string, Record<number, string>> = {
  slate: {
    100: "text-slate-700", 200: "text-slate-700", 300: "text-slate-700", 400: "text-slate-700"
  },
  red: {
    100: "text-red-700", 200: "text-red-700", 300: "text-red-700", 400: "text-red-700"
  },
  orange: {
    100: "text-orange-700", 200: "text-orange-700", 300: "text-orange-700", 400: "text-orange-700"
  },
  yellow: {
    100: "text-yellow-800", 200: "text-yellow-800", 300: "text-yellow-800", 400: "text-yellow-800"
  },
  lime: {
    100: "text-lime-700", 200: "text-lime-700", 300: "text-lime-700", 400: "text-lime-700"
  },
  green: {
    100: "text-green-700", 200: "text-green-700", 300: "text-green-700", 400: "text-green-700"
  },
  blue: {
    100: "text-blue-700", 200: "text-blue-700", 300: "text-blue-700", 400: "text-blue-700"
  },
  purple: {
    100: "text-purple-700", 200: "text-purple-700", 300: "text-purple-700", 400: "text-purple-700"
  },
  pink: {
    100: "text-pink-700", 200: "text-pink-700", 300: "text-pink-700", 400: "text-pink-700"
  },
}

interface ColorPickerProps {
  value?: string
  onValueChange: (value: string) => void
  disabled?: boolean
  subjectAbbreviation?: string
}

export function ColorPicker({ 
  value, 
  onValueChange, 
  disabled, 
  subjectAbbreviation = "Ma" 
}: ColorPickerProps) {
  const [open, setOpen] = useState(false)

  const handleColorSelect = (colorClass: string) => {
    onValueChange(colorClass)
    setOpen(false)
  }

  const getColorDisplay = (colorValue?: string) => {
    if (!colorValue) return null
    
    // Extract color name and shade from the value (e.g., "bg-blue-500")
    const match = colorValue.match(/bg-(\w+)-(\d+)/)
    if (!match) return null
    
    return colorValue
  }

  // Get the display text for color boxes - limit to 3 characters and use the provided abbreviation or default to "Ma"
  const getDisplayText = () => {
    if (!subjectAbbreviation || subjectAbbreviation.trim() === "") {
      return "Ma"
    }
    return subjectAbbreviation.trim().slice(0, 3)
  }

  const displayText = getDisplayText()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            {value ? (
              <div className={cn("w-4 h-4 rounded border", getColorDisplay(value))} />
            ) : (
              <Palette className="w-4 h-4" />
            )}
            {value ? value.replace('bg-', '').replace('-', ' ') : "Select a color"}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-70 p-4" align="start">
        <div className="space-y-4">
          <div className="text-sm font-medium">Select a color</div>
          
          {/* Clear selection option */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleColorSelect("")}
            className="w-full"
          >
            Clear selection
          </Button>
          
          {/* Color grid */}
          <div className="space-y-2">
            {/* Header row with shade numbers */}
            <div className="grid grid-cols-6 gap-1 text-xs text-muted-foreground">
              <div className="col-span-2"></div> {/* Empty cell for color names column */}
              {shades.map((shade) => (
                <div key={shade} className="text-start pl-1.5 font-mono">
                  {shade}
                </div>
              ))}
            </div>
            
            {/* Color rows */}
            {colors.map((color) => (
              <div key={color.name} className="grid grid-cols-6 gap-1 items-center">
                <div className="col-span-2 text-xs text-right pr-2 font-medium">
                  {color.label}
                </div>
                {shades.map((shade) => {
                  const colorClass = colorClasses[color.name][shade]
                  const hoverBgClass = hoverBgClasses[color.name][shade]
                  const hoverBorderClass = hoverBorderClasses[color.name][shade]
                  const textColorClass = textColorClasses[color.name][shade]
                  const isSelected = value === colorClass
                  
                  return (
                    <button
                      key={`${color.name}-${shade}`}
                      className={cn(
                        "w-8 h-8 rounded border transition-all duration-150 flex items-center justify-center text-xs font-medium",
                        colorClass,
                        hoverBgClass,
                        hoverBorderClass,
                        textColorClass,
                        isSelected ? "border-black ring-2 ring-black" : "border-transparent",
                        "hover:scale-105"
                      )}
                      onClick={() => handleColorSelect(colorClass)}
                      title={`${color.label} ${shade}`}
                    >
                      {displayText}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}