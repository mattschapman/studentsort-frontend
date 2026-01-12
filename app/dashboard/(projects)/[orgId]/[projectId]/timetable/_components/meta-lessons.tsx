// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/meta-lessons.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Block } from "@/app/dashboard/(projects)/[orgId]/[projectId]/model/_components/types";
import { useVersionData } from "@/lib/contexts/version-data-context";
import { FilterSortGroupControls } from "./filter-sort-group/filter-sort-group-controls";
import { 
  useFilterSortGroup, 
  useMetaLessonsWithBlocks, 
  useProcessedMetaLessons 
} from "./filter-sort-group/filter-sort-group-hooks";
import { 
  sortMetaLessons, 
  groupMetaLessons, 
  getUniqueYearGroups, 
  getUniqueSubjects,
  type OuterGroup,
  type InnerGroup
} from "./filter-sort-group/filter-sort-group-utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface LessonSpan {
  id: string;
  title: string;
  metaPeriodId: string;
  teacherId: string;
}

// Helper function to check if a meta lesson is scheduled
function isMetaLessonScheduled(metaLesson: any): boolean {
  return metaLesson.meta_periods?.some((mp: any) => mp.start_period_id && mp.start_period_id !== "") ?? false;
}

// Helper function to check if a lesson is staffed
function isLessonStaffed(lesson: LessonSpan): boolean {
  return lesson.teacherId !== "";
}

// Helper function to get color classes based on block color
function getColorClasses(blockColor: string | undefined, isScheduled: boolean) {
  // If scheduled, use gray styling regardless of block color
  if (isScheduled) {
    return {
      bg: 'bg-gray-50 text-muted-foreground',
    };
  }
  
  // Extract base color name (e.g., "blue" from "bg-blue-200")
  const colorMatch = blockColor?.match(/(?:bg|border|text)-(\w+)-/);
  const color = colorMatch?.[1] || 'blue';
  
  return {
    bg: `bg-${color}-200`,
  };
}

interface MetaLessonCardProps {
  block: Block;
  metaLesson: any;
  lessonSpans: LessonSpan[];
  isSelected: boolean;
  selectedLessonId: string | null;
  onSelectMetaLesson: (blockId: string, metaLessonId: string) => void;
  onSelectLesson: (blockId: string, metaLessonId: string, lessonId: string) => void;
  isGroupedByBlock: boolean;
  blockColor?: string;
}

function MetaLessonCard({
  block,
  metaLesson,
  lessonSpans,
  isSelected,
  selectedLessonId,
  onSelectMetaLesson,
  onSelectLesson,
  isGroupedByBlock,
  blockColor,
}: MetaLessonCardProps) {
  const lessonIndex = block.meta_lessons.findIndex((ml) => ml.id === metaLesson.id);
  const isScheduled = isMetaLessonScheduled(metaLesson);
  const colors = getColorClasses(blockColor, isScheduled);

  return (
    <div
      className={cn(
        "rounded-sm border flex items-center text-[10px] leading-none h-8 whitespace-nowrap overflow-x-auto overflow-y-hidden",
        isGroupedByBlock ? "w-fit" : "w-full",
        isSelected ? "border-blue-500" : "border-gray-200"
      )}
    >
      {/* Meta Lesson Container (Left) */}
      <button
        onClick={() => onSelectMetaLesson(block.id, metaLesson.id)}
        className={cn(
          "h-full border-r border-gray-200 p-1 flex items-center hover:bg-gray-50"
        )}
      >
        <span className={cn("rounded-xs px-2 py-1 font-medium", colors.bg)}>
          {block.title} L{lessonIndex + 1}
        </span>
      </button>

      {/* Individual Lesson Spans (Right) */}
      <div className="flex items-center gap-1 p-1">
        {lessonSpans.map((lesson) => {
          const staffed = isLessonStaffed(lesson);
          return (
            <button
              key={lesson.id}
              onClick={() => onSelectLesson(block.id, metaLesson.id, lesson.id)}
              className={cn(
                "rounded-xs border px-2 py-1 hover:bg-gray-50 border-dashed",
                selectedLessonId === lesson.id
                  ? "border-blue-500 bg-blue-100"
                  : staffed
                  ? "bg-gray-50 text-muted-foreground"
                  : ""
              )}
            >
              {lesson.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface MetaLessonsProps {
  blocks: Block[];
  selectedMetaLessonId: string | null;
  selectedLessonId: string | null;
  onMetaLessonSelect: (blockId: string, metaLessonId: string) => void;
  onLessonSelect: (blockId: string, metaLessonId: string, lessonId: string) => void;
}

export function MetaLessons({
  blocks,
  selectedMetaLessonId,
  selectedLessonId,
  onMetaLessonSelect,
  onLessonSelect,
}: MetaLessonsProps) {
  const { versionData } = useVersionData();
  const { state, actions } = useFilterSortGroup();
  
  const subjects = versionData?.data?.subjects || [];

  // Create a map of meta_period_id to lessons for quick lookup
  const metaPeriodToLessonsMap = useMemo(() => {
    const map = new Map<string, LessonSpan[]>();

    blocks.forEach((block) => {
      block.teaching_groups.forEach((tg) => {
        tg.classes.forEach((cls) => {
          cls.lessons.forEach((lesson) => {
            if (lesson.meta_period_id) {
              if (!map.has(lesson.meta_period_id)) {
                map.set(lesson.meta_period_id, []);
              }
              map.get(lesson.meta_period_id)!.push({
                id: lesson.id,
                title: lesson.title || `L${lesson.number}`,
                metaPeriodId: lesson.meta_period_id,
                teacherId: lesson.teacher_id || "",
              });
            }
          });
        });
      });
    });

    return map;
  }, [blocks]);

  // Get lesson spans for a meta lesson
  const getLessonSpansForMetaLesson = (metaLesson: any): LessonSpan[] => {
    const spans: LessonSpan[] = [];

    metaLesson.meta_periods.forEach((mp: any) => {
      const lessons = metaPeriodToLessonsMap.get(mp.id);
      if (lessons) {
        spans.push(...lessons);
      }
    });

    return spans;
  };

  // Handle lesson selection with toggle
  const handleSelectMetaLesson = (blockId: string, metaLessonId: string) => {
    if (selectedMetaLessonId === metaLessonId) {
      onMetaLessonSelect("", "");
    } else {
      onMetaLessonSelect(blockId, metaLessonId);
    }
  };

  // Handle individual lesson selection
  const handleSelectLesson = (
    blockId: string,
    metaLessonId: string,
    lessonId: string
  ) => {
    if (selectedLessonId === lessonId) {
      onLessonSelect("", "", "");
    } else {
      onLessonSelect(blockId, metaLessonId, lessonId);
    }
  };

  // Process meta lessons through filter/sort/group pipeline
  const metaLessonsWithBlocks = useMetaLessonsWithBlocks(blocks);
  const filteredMetaLessons = useProcessedMetaLessons(metaLessonsWithBlocks, state, subjects);
  const sortedMetaLessons = sortMetaLessons(filteredMetaLessons, state.sortBy);
  const groupedMetaLessons = groupMetaLessons(
    sortedMetaLessons, 
    state.outerGroupBy, 
    state.innerGroupBy,
    subjects
  );

  // Get unique values for filter options
  const availableYearGroups = useMemo(() => getUniqueYearGroups(blocks), [blocks]);
  const availableSubjects = useMemo(() => getUniqueSubjects(blocks, subjects), [blocks, subjects]);

  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
        No blocks found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Filter/Sort/Group Controls */}
      <div className="p-4 border-b">
        <FilterSortGroupControls
          state={state}
          actions={actions}
          availableYearGroups={availableYearGroups}
          availableSubjects={availableSubjects}
        />
      </div>

      {/* Meta Lessons List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMetaLessons.length === 0 ? (
          <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
            No lessons match your filters
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMetaLessons.map((outerGroup) => (
              <OuterGroupComponent
                key={outerGroup.id}
                outerGroup={outerGroup}
                showOuterTitle={state.outerGroupBy !== 'none'}
                showInnerGroups={state.innerGroupBy === 'block'}
                selectedMetaLessonId={selectedMetaLessonId}
                selectedLessonId={selectedLessonId}
                onSelectMetaLesson={handleSelectMetaLesson}
                onSelectLesson={handleSelectLesson}
                getLessonSpans={getLessonSpansForMetaLesson}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface OuterGroupComponentProps {
  outerGroup: OuterGroup;
  showOuterTitle: boolean;
  showInnerGroups: boolean;
  selectedMetaLessonId: string | null;
  selectedLessonId: string | null;
  onSelectMetaLesson: (blockId: string, metaLessonId: string) => void;
  onSelectLesson: (blockId: string, metaLessonId: string, lessonId: string) => void;
  getLessonSpans: (metaLesson: any) => LessonSpan[];
}

function OuterGroupComponent({
  outerGroup,
  showOuterTitle,
  showInnerGroups,
  selectedMetaLessonId,
  selectedLessonId,
  onSelectMetaLesson,
  onSelectLesson,
  getLessonSpans,
}: OuterGroupComponentProps) {
  return (
    <div>
      {showOuterTitle && (
        <div className="mb-2">
          <h3 className="text-xs font-semibold text-gray-700">
            {['1','2','3','4','5','6','7','8','9','10','11','12','13','14'].includes(outerGroup.title)
              ? `Year ${outerGroup.title}`
              : outerGroup.title}
          </h3>
        </div>
      )}

      <div className="space-y-1.5">
        {outerGroup.innerGroups.map((innerGroup) => (
          <InnerGroupComponent
            key={innerGroup.id}
            innerGroup={innerGroup}
            showAsAccordion={showInnerGroups}
            selectedMetaLessonId={selectedMetaLessonId}
            selectedLessonId={selectedLessonId}
            onSelectMetaLesson={onSelectMetaLesson}
            onSelectLesson={onSelectLesson}
            getLessonSpans={getLessonSpans}
          />
        ))}
      </div>
    </div>
  );
}

interface InnerGroupComponentProps {
  innerGroup: InnerGroup;
  showAsAccordion: boolean;
  selectedMetaLessonId: string | null;
  selectedLessonId: string | null;
  onSelectMetaLesson: (blockId: string, metaLessonId: string) => void;
  onSelectLesson: (blockId: string, metaLessonId: string, lessonId: string) => void;
  getLessonSpans: (metaLesson: any) => LessonSpan[];
}

function InnerGroupComponent({
  innerGroup,
  showAsAccordion,
  selectedMetaLessonId,
  selectedLessonId,
  onSelectMetaLesson,
  onSelectLesson,
  getLessonSpans,
}: InnerGroupComponentProps) {
  // Calculate scheduled and staffed counts for accordion
  const { scheduledCount, staffedCount, totalLessonSpans } = useMemo(() => {
    const scheduled = innerGroup.metaLessons.filter(ml => isMetaLessonScheduled(ml)).length;
    
    // Count total lesson spans and how many are staffed
    let totalSpans = 0;
    let staffed = 0;
    
    innerGroup.metaLessons.forEach(ml => {
      const spans = getLessonSpans(ml);
      totalSpans += spans.length;
      staffed += spans.filter(span => isLessonStaffed(span)).length;
    });
    
    return {
      scheduledCount: scheduled,
      staffedCount: staffed,
      totalLessonSpans: totalSpans
    };
  }, [innerGroup.metaLessons, getLessonSpans]);

  if (!showAsAccordion) {
    // No inner grouping - just render lessons flat
    return (
      <div className="space-y-1.5">
        {innerGroup.metaLessons.map((metaLessonWithBlock) => (
          <MetaLessonCard
            key={metaLessonWithBlock.id}
            block={metaLessonWithBlock.block}
            metaLesson={metaLessonWithBlock}
            lessonSpans={getLessonSpans(metaLessonWithBlock)}
            isSelected={selectedMetaLessonId === metaLessonWithBlock.id}
            selectedLessonId={selectedLessonId}
            onSelectMetaLesson={onSelectMetaLesson}
            onSelectLesson={onSelectLesson}
            isGroupedByBlock={false}
            blockColor={innerGroup.color}
          />
        ))}
      </div>
    );
  }

  // Show as accordion (grouped by block)
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem 
        value={innerGroup.id} 
        className="border border-transparent data-[state=open]:border-blue-200 rounded-md"
      >
        <AccordionTrigger 
          className={cn(
            "px-2 py-1 text-left text-xs hover:no-underline rounded-sm border-b",
            "data-[state=open]:rounded-b-none",
            "data-[state=open]:border-blue-200",
            innerGroup.color
          )}
        >
          <div className="flex gap-1.5 items-center w-full pr-2">
            <div className="font-medium">{innerGroup.title}</div>
            <div className="text-[10px] text-muted-foreground">
              {`${scheduledCount}/${innerGroup.metaLessons.length} scheduled`}
              {totalLessonSpans > 0 && ` • ${staffedCount}/${totalLessonSpans} staffed`}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-2 rounded-b-sm border-b border-b-blue-200">
          <div className="flex gap-1 flex-wrap">
            {innerGroup.metaLessons.map((metaLessonWithBlock) => (
              <MetaLessonCard
                key={metaLessonWithBlock.id}
                block={metaLessonWithBlock.block}
                metaLesson={metaLessonWithBlock}
                lessonSpans={getLessonSpans(metaLessonWithBlock)}
                isSelected={selectedMetaLessonId === metaLessonWithBlock.id}
                selectedLessonId={selectedLessonId}
                onSelectMetaLesson={onSelectMetaLesson}
                onSelectLesson={onSelectLesson}
                isGroupedByBlock={true}
                blockColor={innerGroup.color}
              />
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}