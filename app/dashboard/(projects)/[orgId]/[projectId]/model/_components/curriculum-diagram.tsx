// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/curriculum-diagram.tsx

import type { Block } from "./types";
import type { Subject, FormGroup, Band } from "@/lib/contexts/version-data-context";
import { getTailwindColorValue } from "./utils";

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
  
  // Create array of column numbers (1-23 for the 23 data columns)
  const columns = Array.from({ length: 23 }, (_, i) => i + 1);

  return (
    <div className="w-full min-h-0">
      {/* Header Row */}
      <div 
        className="grid bg-gray-50 border-b"
        style={{ 
          gridTemplateColumns: 'repeat(24, 6.5rem)',
        }}
      >
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
          gridTemplateColumns: 'repeat(24, 6.5rem)',
          gridTemplateRows: `repeat(${totalRows}, 2.25rem)`
        }}
      >
        {/* Form groups - each as a direct grid child with borders */}
        {formGroupsWithRows.map((group, idx) => (
          <div
            key={`form-group-${idx}`}
            className="col-start-1 border-r border-b p-2 flex items-center justify-center text-xs bg-gray-50 font-medium"
            style={{ gridRow: group.row }}
          >
            <span>{group.name}</span>
          </div>
        ))}

        {/* Background grid cells for columns 2-24 */}
        {Array.from({ length: totalRows }).map((_, rowIdx) => (
          Array.from({ length: 23 }).map((_, colIdx) => (
            <div
              key={`cell-${rowIdx}-${colIdx}`}
              className="border-r border-b bg-white"
              style={{
                gridRow: rowIdx + 1,
                gridColumn: colIdx + 2
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
          
          return (
            <div
              key={block.id}
              className={`border border-gray-300 rounded flex flex-col justify-evenly items-center m-1 ${
                onBlockClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
              }`}
              style={{
                gridRow: `${block.start_row} / ${(block.end_row || 0) + 1}`,
                gridColumn: `${block.start_col} / span ${colSpan}`,
                backgroundColor: bgColor
              }}
              onClick={() => onBlockClick?.(block.id)}
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
                      <span className="text-[11px] font-medium">{cls.id}</span>
                      <span className="text-[6px] align-sub">{cls.total_periods}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}