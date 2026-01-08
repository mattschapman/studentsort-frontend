// components/data-table/data-table.tsx
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { DataTablePagination } from "./data-table-pagination"
import { DataTableToolbar, FilterConfig, ActionButtonConfig, BulkDeleteConfig } from "./data-table-toolbar"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
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
  onSelectionChange?: (selectedRowIds: string[]) => void
  // Action button configuration
  actionButton?: ActionButtonConfig
  // Bulk delete configuration
  bulkDeleteConfig?: BulkDeleteConfig
  // Add mode control
  mode?: 'full' | 'view-only'
  // Row selection options
  enableRowSelection?: boolean
  // Width param
  width?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchColumn = "title",
  searchPlaceholder = "Search...",
  filters = [],
  showSearch = true,
  showFilters = true,
  showViewOptions = true,
  showResetButton = true,
  onResetFilters,
  onSelectionChange,
  actionButton,
  bulkDeleteConfig,
  mode = 'full',
  enableRowSelection,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  
  // Use a ref to directly access the latest rowSelection in effects
  const rowSelectionRef = React.useRef(rowSelection);
  
  // Update the ref whenever rowSelection changes
  React.useEffect(() => {
    rowSelectionRef.current = rowSelection;
  }, [rowSelection]);
  
  // Create a separate effect to notify parent of selection changes
  React.useEffect(() => {
    if (onSelectionChange) {
      const selectedKeys = Object.keys(rowSelection);
      console.log("[DataTable] useEffect: Selection changed, keys:", selectedKeys);
      onSelectionChange(selectedKeys);
    }
  }, [rowSelection, onSelectionChange]);
  
  // Handler for row selection changes - this is called by TanStack Table
  const handleRowSelectionChange = React.useCallback(
    (value: {}) => {
      console.log("[DataTable] handleRowSelectionChange called with:", value);
      // Just update the local state, the useEffect above will notify the parent
      setRowSelection(value);
    },
    []
  );

  // Determine if row selection should be enabled
  const shouldEnableRowSelection = 
    enableRowSelection !== undefined 
      ? enableRowSelection 
      : (mode === 'full' && !!bulkDeleteConfig);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: shouldEnableRowSelection,
    onRowSelectionChange: handleRowSelectionChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

    // ✅ Set default page size to 20 instead of 10
  React.useEffect(() => {
    table.setPageSize(20)
  }, [table])

  // Conditionally pass action button and bulk delete config based on mode
  const effectiveActionButton = mode === 'view-only' ? undefined : actionButton;
  const effectiveBulkDeleteConfig = mode === 'view-only' ? undefined : bulkDeleteConfig;

  return (
    <div className="h-full w-full flex flex-col justify-between">
      <div className="flex flex-col bg-white border-b">
        <DataTableToolbar 
          table={table} 
          searchColumn={searchColumn}
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          showSearch={showSearch}
          showFilters={showFilters}
          showViewOptions={showViewOptions}
          showResetButton={showResetButton}
          onResetFilters={onResetFilters}
          actionButton={effectiveActionButton}
          bulkDeleteConfig={effectiveBulkDeleteConfig}
        />
        <div className="relative w-full">
          <div className="overflow-x-auto">
            <Table className="w-full text-xs">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="bg-gray-50">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell 
                          key={cell.id}
                          className="py-0.5"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}