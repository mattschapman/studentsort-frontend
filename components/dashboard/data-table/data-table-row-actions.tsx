// components/data-table/data-table-row-actions.tsx
"use client"

import { Row } from "@tanstack/react-table"
import { MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Import labels but make it optional with a fallback
const defaultLabels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
]
interface DataTableRowActionsProps<TData> {
  row: Row<TData>
  // Define optional props for customization
  labels?: Array<{ value: string; label: string }>
  labelField?: string
  hideEdit?: boolean
  hideCopy?: boolean
  hideFavorite?: boolean
  hideLabels?: boolean
  hideDelete?: boolean
  onEdit?: (row: TData) => void
  onCopy?: (row: TData) => void
  onFavorite?: (row: TData) => void
  onLabelChange?: (row: TData, label: string) => void
  onDelete?: (row: TData) => void
  // Optional schema validator function
  validateSchema?: (data: any) => any
}

export function DataTableRowActions<TData>({
  row,
  labels = defaultLabels,
  labelField = "label",
  hideEdit = false,
  hideCopy = true,
  hideFavorite = true,
  hideLabels = true,
  hideDelete = false,
  onEdit,
  onCopy,
  onFavorite,
  onLabelChange,
  onDelete,
  validateSchema,
}: DataTableRowActionsProps<TData>) {
  // Get the original data
  const originalData = row.original
  
  // Apply schema validation if provided, otherwise use original data directly
  const data = validateSchema ? validateSchema(originalData) : originalData
  
  // Get the current label value safely
  const currentLabel = data && typeof data === 'object' && labelField in data 
    ? (data as any)[labelField] 
    : undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <MoreHorizontal />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {!hideEdit && (
          <DropdownMenuItem onClick={() => onEdit?.(data)}>
            Edit
          </DropdownMenuItem>
        )}
        {!hideCopy && (
          <DropdownMenuItem onClick={() => onCopy?.(data)}>
            Make a copy
          </DropdownMenuItem>
        )}
        {!hideFavorite && (
          <DropdownMenuItem onClick={() => onFavorite?.(data)}>
            Favorite
          </DropdownMenuItem>
        )}
        
        {((!hideEdit || !hideCopy || !hideFavorite) && (!hideLabels || !hideDelete)) && (
          <DropdownMenuSeparator />
        )}
        
        {!hideLabels && labels.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Labels</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={currentLabel}>
                {labels.map((label) => (
                  <DropdownMenuRadioItem 
                    key={label.value} 
                    value={label.value}
                    onClick={() => onLabelChange?.(data, label.value)}
                  >
                    {label.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        
        {!hideDelete && (
  <>
    {!hideLabels && <DropdownMenuSeparator />}
    <DropdownMenuItem
      className="group text-white hover:text-destructive focus:text-destructive"
      onClick={() => onDelete?.(data)}
    >
      <span>Delete</span>
    </DropdownMenuItem>
  </>
)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}