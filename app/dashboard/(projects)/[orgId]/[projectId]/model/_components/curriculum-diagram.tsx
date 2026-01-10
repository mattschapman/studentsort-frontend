// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/curriculum-diagram.tsx

import { useState } from "react";
import type { Block } from "./types";
import type { Subject, FormGroup, Band } from "@/lib/contexts/version-data-context";
import { getTailwindColorValue } from "./utils";
import { useVersionData } from "@/lib/contexts/version-data-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

interface CurriculumDiagramProps {
  blocks: Block[];
  formGroups: FormGroup[];
  bands: Band[];
  subjects: Subject[];
  onBlockClick?: (blockId: string) => void;
}

export function CurriculumDiagram({ 
  blocks, 
  formGroups, 
  bands,
  subjects,
  onBlockClick 
}: CurriculumDiagramProps) {
  const { deleteBlock } = useVersionData();
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [blockToDelete, setBlockToDelete] = useState<Block | null>(null);

  if (formGroups.length === 0) {
    return (
      <div className="w-full h-96 flex items-center justify-center border-b border-r border-l-0 border-t-0">
        <p className="text-sm text-muted-foreground text-center">
          No form groups found for this year group. Create form groups to start building your curriculum diagram.
        </p>
      </div>
    );
  }

  // Group form groups by band
  const formGroupsByBand = formGroups.reduce((acc, fg) => {
    const bandId = fg.band_id || 'no-band';
    const band = bands.find(b => b.id === bandId);
    const bandTitle = band?.name || 'No Band';
    
    if (!acc[bandId]) {
      acc[bandId] = {
        bandTitle,
        formGroups: []
      };
    }
    acc[bandId].formGroups.push(fg);
    return acc;
  }, {} as Record<string, { bandTitle: string; formGroups: FormGroup[] }>);

  // Sort form groups within each band by name
  Object.values(formGroupsByBand).forEach(band => {
    band.formGroups.sort((a, b) => a.name.localeCompare(b.name));
  });

  // Create a flat list of form groups with their row numbers and band end markers
  const formGroupsWithRows: Array<FormGroup & { row: number; isBandEnd: boolean }> = [];
  let currentRow = 1;

  const bandEntries = Object.entries(formGroupsByBand);
  bandEntries.forEach(([bandId, band], bandIndex) => {
    band.formGroups.forEach((fg, fgIndex) => {
      const isLastInBand = fgIndex === band.formGroups.length - 1;
      const isLastBand = bandIndex === bandEntries.length - 1;
      
      formGroupsWithRows.push({
        ...fg,
        row: currentRow,
        isBandEnd: isLastInBand && !isLastBand
      });
      
      currentRow++;
    });
  });

  const totalRows = currentRow - 1;
  
  // Create array of column numbers (1-25 for the 25 data columns)
  const columns = Array.from({ length: 25 }, (_, i) => i + 1);

  // Create band rows info for rendering band cells with rowspan
  const bandRows: Array<{ bandId: string; bandTitle: string; startRow: number; rowSpan: number }> = [];
  let rowCounter = 1;
  
  bandEntries.forEach(([bandId, band]) => {
    const rowSpan = band.formGroups.length;
    bandRows.push({
      bandId,
      bandTitle: band.bandTitle,
      startRow: rowCounter,
      rowSpan
    });
    rowCounter += rowSpan;
  });

  const handleDeleteConfirm = () => {
    if (blockToDelete) {
      deleteBlock(blockToDelete.id);
      setBlockToDelete(null);
      setOpenPopoverId(null);
    }
  };

  const handleBlockClick = (block: Block, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenPopoverId(block.id);
  };

  return (
    <>
      <div className="w-full min-h-0">
        {/* Header Row */}
        <div 
          className="grid bg-gray-50 border-b"
          style={{ 
            gridTemplateColumns: '6.5rem 6.5rem repeat(25, 6.5rem)',
          }}
        >
          <div className="border-r px-4 py-2 text-left font-semibold text-xs">
            Band
          </div>
          <div className="border-r px-4 py-2 text-left font-semibold text-xs">
            Form Group
          </div>
          {columns.map(col => (
            <div key={col} className="border-r px-1 py-2 text-center text-xs font-medium">
              {col}
            </div>
          ))}
        </div>

        {/* Grid container with borders */}
        <div 
          className="grid"
          style={{ 
            gridTemplateColumns: '6.5rem 6.5rem repeat(25, 6.5rem)',
            gridTemplateRows: `repeat(${totalRows}, 2.25rem)`
          }}
        >
          {/* Band cells - each with rowspan for multiple form groups */}
          {bandRows.map((bandRow, idx) => (
            <div
              key={`band-${idx}`}
              className="col-start-1 border-r border-b px-4 py-2 flex items-center justify-start text-xs bg-gray-50 font-medium"
              style={{ 
                gridRow: `${bandRow.startRow} / span ${bandRow.rowSpan}`
              }}
            >
              <span>{bandRow.bandTitle}</span>
            </div>
          ))}

          {/* Form groups - each as a direct grid child with borders */}
          {formGroupsWithRows.map((group, idx) => (
            <div
              key={`form-group-${idx}`}
              className="col-start-2 border-r border-b px-4 py-2 flex items-center justify-start text-xs bg-gray-50 font-medium"
              style={{ gridRow: group.row }}
            >
              <span>{group.name}</span>
            </div>
          ))}

          {/* Background grid cells for columns 3-27 */}
          {Array.from({ length: totalRows }).map((_, rowIdx) => (
            Array.from({ length: 25 }).map((_, colIdx) => (
              <div
                key={`cell-${rowIdx}-${colIdx}`}
                className="border-r border-b bg-white"
                style={{
                  gridRow: rowIdx + 1,
                  gridColumn: colIdx + 3
                }}
              />
            ))
          ))}

          {/* Blocks */}
          {blocks.map((block) => {
            // Find the subject color from the first teaching group's first class
            const firstClass = block.teaching_groups[0]?.classes[0];
            const subject = subjects.find(s => s.id === firstClass?.subject);
            const bgColor = getTailwindColorValue(subject?.color_scheme || block.color_scheme);
            
            // Calculate max classes across all teaching groups
            const maxClasses = Math.max(...block.teaching_groups.map(tg => tg.classes.length), 1);
            
            // Map max classes to column span
            const getColumnSpan = (maxClasses: number): number => {
              if (maxClasses === 1) return 1;
              if (maxClasses === 2) return 2;
              if (maxClasses === 3) return 2;
              if (maxClasses === 4) return 3;
              if (maxClasses === 5) return 3;
              if (maxClasses === 6) return 4;
              if (maxClasses === 7) return 5;
              return maxClasses;
            };
            
            const colSpan = getColumnSpan(maxClasses);
            
            // Add 2 to start_col to account for the "Band" and "Form Group" columns
            const actualStartCol = block.start_col ? block.start_col + 2 : 3;
            
            return (
              <Popover 
                key={block.id} 
                open={openPopoverId === block.id}
                onOpenChange={(open) => {
                  if (!open) setOpenPopoverId(null);
                }}
              >
                <PopoverTrigger asChild>
                  <div
                    className="border border-gray-300 rounded flex flex-col justify-evenly items-center m-1 cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      gridRow: `${block.start_row} / ${(block.end_row || 0) + 1}`,
                      gridColumn: `${actualStartCol} / span ${colSpan}`,
                      backgroundColor: bgColor
                    }}
                    onClick={(e) => handleBlockClick(block, e)}
                  >
                    {block.teaching_groups.map((tg, idx) => (
                      <div 
                        key={idx} 
                        className={`w-full flex justify-center items-center gap-3 py-2 px-1 ${
                          idx < block.teaching_groups.length - 1 ? 'border-b border-white/50' : ''
                        }`}
                      >
                        {tg.classes.map((cls, cidx) => (
                          <div key={cidx} className="flex gap-1 items-baseline">
                            <span className="text-[11px] font-medium">{cls.title}</span>
                            <span className="text-[6px] align-sub">{cls.total_periods}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-30 p-1" align="center">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="justify-start gap-2 font-normal text-xs"
                      disabled
                    >
                      <Pencil className="size-3" />
                      Edit block
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="justify-start gap-2 font-normal text-red-600 hover:text-red-600 hover:bg-red-50 text-xs"
                      onClick={() => {
                        setBlockToDelete(block);
                        setOpenPopoverId(null);
                      }}
                    >
                      <Trash2 className="size-3" />
                      Delete block
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            );
          })}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={blockToDelete !== null} onOpenChange={(open) => {
        if (!open) setBlockToDelete(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete block?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this block from your curriculum model. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}