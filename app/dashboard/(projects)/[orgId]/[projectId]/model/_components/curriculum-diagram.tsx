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
      <div className="p-6 border border-dashed border-gray-300 rounded-lg">
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

  return (
    <div className="w-full min-h-0">
      <div className="overflow-x-auto border rounded-md min-h-50">
        <div className="inline-block min-w-max w-full bg-stone-50">
          {/* Grid container with fixed-width columns and explicit rows */}
          <div 
            className="grid gap-x-2" 
            style={{ 
              gridTemplateColumns: 'repeat(24, 6.5rem)',
              gridTemplateRows: `repeat(${totalRows}, minmax(0, 1fr))`
            }}
          >
            {/* Form groups - each as a direct grid child */}
            {formGroupsWithRows.map((group, idx) => (
              <div
                key={`form-group-${idx}`}
                className="col-start-1 border-r p-3 flex justify-center gap-1 text-xs bg-white"
                style={{ gridRow: group.row }}
              >
                <span>{group.name}</span>
              </div>
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
                  className={`border rounded-sm flex flex-col justify-evenly items-center my-2 ${
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
                        idx < block.teaching_groups.length - 1 ? 'border-b border-white' : ''
                      }`}
                    >
                      {tg.classes.map((cls, cidx) => (
                        <div key={cidx} className="flex gap-1 items-baseline">
                          <span className="text-[11px]">{cls.id}</span>
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
      </div>
    </div>
  );
}