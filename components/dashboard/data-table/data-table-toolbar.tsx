// components/data-table/data-table-toolbar.tsx
"use client"

import React from "react"
import { Table } from "@tanstack/react-table"
import { ChevronDown, X, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableViewOptions } from "./data-table-view-options"
import { DataTableFacetedFilter, FilterOption } from "./data-table-faceted-filter"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Export FilterOption for ease of use
export type { FilterOption } from "./data-table-faceted-filter"

// Interface for filter configuration
export interface FilterConfig {
  columnId: string
  title: string
  options: FilterOption[]
}

// Interface for action button configuration
export interface ActionButtonConfig {
  label: string
  onClick: () => void
  dropdownItems?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }[]
}

// Interface for bulk delete functionality
export interface BulkDeleteConfig {
  onDelete: (selectedRowIds: string[]) => Promise<void>
  idField?: string
  deleteButtonText?: string
  confirmMessage?: string // Added confirmMessage property
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  // Search configuration
  searchColumn?: string
  searchPlaceholder?: string
  // Custom filters
  filters?: FilterConfig[]
  // Optional show/hide controls
  showSearch?: boolean
  showFilters?: boolean
  showViewOptions?: boolean
  showResetButton?: boolean
  // Optional callbacks
  onResetFilters?: () => void
  // Action button configuration
  actionButton?: ActionButtonConfig
  // Bulk delete configuration
  bulkDeleteConfig?: BulkDeleteConfig
}

export function DataTableToolbar<TData>({
  table,
  searchColumn = "title",
  searchPlaceholder = "Filter...",
  filters = [],
  showSearch = true,
  showFilters = true,
  showViewOptions = true,
  showResetButton = true,
  onResetFilters,
  actionButton,
  bulkDeleteConfig,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [isDeleting, setIsDeleting] = React.useState(false)
  
  // Calculate the number of selected rows using the filtered selected row model
  const selectedRowCount = table.getFilteredSelectedRowModel().rows.length
  const hasSelection = selectedRowCount > 0

  // For debugging - add this to check values in your browser console
  React.useEffect(() => {
    console.log("Selected row count:", selectedRowCount);
    console.log("hasSelection:", hasSelection);
    console.log("bulkDeleteConfig present:", !!bulkDeleteConfig);
  }, [selectedRowCount, hasSelection, bulkDeleteConfig]);

  // Handle reset filters
  const handleResetFilters = () => {
    table.resetColumnFilters()
    if (onResetFilters) onResetFilters()
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!bulkDeleteConfig || isDeleting) return

    // Get selected row ids from ALL pages using the filtered selected row model
    const selectedRowIds = table.getFilteredSelectedRowModel().rows
      .map(row => {
        // Use the specified idField or default to 'id'
        const idField = bulkDeleteConfig.idField || 'id';
        
        // Check if the ID field exists in the row data
        if (!(idField in (row.original as any))) {
          console.warn(`Selected row is missing ID field "${idField}"`, row.original);
          return null;
        }
        
        return (row.original as any)[idField];
      })
      .filter((id): id is string => id !== null);

    // Log selected IDs for debugging
    console.log("Selected IDs for deletion:", selectedRowIds);
    
    if (selectedRowIds.length === 0) return;
    
    // Confirmation dialog before deletion
    const confirmMessage = bulkDeleteConfig.confirmMessage || 
      `Are you sure you want to delete ${selectedRowIds.length} selected item${selectedRowIds.length > 1 ? 's' : ''}? Note: This will also delete downstream records (e.g., it will delete any timetabling constraints associated with these records).`;
    
    const confirmDelete = window.confirm(confirmMessage);
    
    if (!confirmDelete) return;
    
    try {
      setIsDeleting(true);
      
      // Call the delete function
      await bulkDeleteConfig.onDelete(selectedRowIds);
      
      // Reset selection after successful delete
      table.resetRowSelection();
    } catch (error) {
      console.error("Error during bulk delete:", error);
      alert(`Error during deletion: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex items-center justify-between px-4 min-h-12 border-b">
      <div className="flex flex-1 items-center space-x-2">
        {/* IMPORTANT: DEBUG - Always render this to check if component works */}
        {/*
        <div className="bg-amber-100 p-1 text-xs">
          Selected: {selectedRowCount}, hasSelection: {String(hasSelection)}, bulkConfig: {String(!!bulkDeleteConfig)}
        </div>
        */}

        {/* Bulk Delete Button - with loading state */}
        {selectedRowCount > 0 && bulkDeleteConfig ? (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleBulkDelete}
            className="h-7 text-white"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                {/* <Trash2 className="h-4 w-4" /> */}
                {bulkDeleteConfig.deleteButtonText || `Delete Selected (${selectedRowCount})`}
              </>
            )}
          </Button>

        ) : null}

        {/* Action Button with Dropdown - only show when no selection */}
        {actionButton && !hasSelection && (
          <div className="flex">
            {/* Primary action button */}
            <Button 
              onClick={actionButton.onClick}
              size="xs"
              className={actionButton.dropdownItems && actionButton.dropdownItems.length > 0 ? "rounded-r-none h-7 text-xs" : "h-7"}
            >
              {actionButton.label}
            </Button>

            {/* Dropdown part (only if dropdown items exist) */}
            {actionButton.dropdownItems && actionButton.dropdownItems.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="default" 
                    size="xs"
                    className="rounded-l-none border-l border-l-white h-7"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actionButton.dropdownItems.map((item, index) => (
                    <DropdownMenuItem key={index} onClick={item.onClick}>
                      {item.icon && (
                        <span className="mr-2">{item.icon}</span>
                      )}
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
        
        {/* Search input */}
        {showSearch && table.getColumn(searchColumn) && (
          <Input
            placeholder={searchPlaceholder}
            value={(table.getColumn(searchColumn)?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn(searchColumn)?.setFilterValue(event.target.value)
            }
            className="w-37.5 lg:w-62.5 h-7 placeholder:text-xs text-xs"
          />
        )}

        {/* Render dynamic filters */}
        {showFilters && filters.map((filter) => {
          const column = table.getColumn(filter.columnId)
          if (!column) return null
          
          return (
            <DataTableFacetedFilter
              key={filter.columnId}
              column={column}
              title={filter.title}
              options={filter.options}
            />
          )
        })}

        {/* Reset button */}
        {showResetButton && isFiltered && (
          <Button
            variant="ghost"
            size="xs"
            onClick={handleResetFilters}
            className="h-7 px-2 lg:px-3 text-xs"
          >
            Reset
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {/* View options */}
      {showViewOptions && <DataTableViewOptions table={table} />}
    </div>
  )
}