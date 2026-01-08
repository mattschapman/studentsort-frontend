// components/data-table/data-table-loading.tsx
import React from 'react'
import { Skeleton } from "@/components/ui/skeleton"

export default function DataTableLoading() {
  // Create an array of 10 items to match the table rows
  const skeletonRows = Array.from({ length: 10 }, (_, i) => i)
  
  return (
    <div className="space-y-4 w-full lg:w-[90%] max-w-7xl">
      {/* Search and filter bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <Skeleton className="h-8 w-24" /> {/* New button */}
        <Skeleton className="h-8 w-75" /> {/* Search input */}
        <Skeleton className="h-8 w-28" /> {/* Class button */}
        <Skeleton className="h-8 w-28" /> {/* Level button */}
        <div className="ml-auto">
          <Skeleton className="h-8 w-20" /> {/* View button */}
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md">
        {/* Table header */}
        <div className="flex items-center p-3 border-b gap-4">
          <div className="w-8">
            <Skeleton className="h-5 w-5" /> {/* Checkbox */}
          </div>
          <div className="flex-1 flex gap-8">
            <div className="w-[15%]">
              <Skeleton className="h-5" /> {/* Name */}
            </div>
            <div className="w-[45%]">
              <Skeleton className="h-5" /> {/* Level1 */}
            </div>
            <div className="w-[30%]">
              <Skeleton className="h-5" /> {/* Level2 */}
            </div>
            <div className="w-[10%]">
              {/* Empty space for the actions column */}
            </div>
          </div>
        </div>

        {/* Table rows */}
        {skeletonRows.map((row) => (
          <div key={row} className="flex items-center p-3 border-b last:border-b-0 gap-4">
            <div className="w-8">
              <Skeleton className="h-5 w-5" /> {/* Checkbox */}
            </div>
            <div className="flex-1 flex gap-8">
              <div className="w-[15%]">
                <Skeleton className="h-5" /> {/* Student name */}
              </div>
              <div className="w-[45%]">
                <Skeleton className="h-5" /> {/* Class */}
              </div>
              <div className="w-[30%]">
                <Skeleton className="h-5" /> {/* Year level */}
              </div>
              <div className="w-[10%] flex justify-end">
                <Skeleton className="h-5" /> {/* Actions button */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" /> {/* Rows selected info */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-32" /> {/* Rows per page */}
          <Skeleton className="h-8 w-40" /> {/* Page navigation */}
        </div>
      </div>
    </div>
  )
}