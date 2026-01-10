// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/meta-lessons.tsx
"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Block } from "@/app/dashboard/(projects)/[orgId]/[projectId]/model/_components/types";

interface LessonSpan {
  id: string;
  title: string;
  metaPeriodId: string;
}

interface MetaLessonCardProps {
  block: Block;
  metaLesson: any;
  lessonSpans: LessonSpan[];
  isSelected: boolean;
  selectedLessonId: string | null;
  onSelectMetaLesson: (blockId: string, metaLessonId: string) => void;
  onSelectLesson: (blockId: string, metaLessonId: string, lessonId: string) => void;
}

function MetaLessonCard({
  block,
  metaLesson,
  lessonSpans,
  isSelected,
  selectedLessonId,
  onSelectMetaLesson,
  onSelectLesson,
}: MetaLessonCardProps) {
  const lessonIndex = block.meta_lessons.findIndex((ml) => ml.id === metaLesson.id);

  return (
<div
  className={cn(
    "rounded-sm border-2 flex items-center text-[10px] leading-none h-8 whitespace-nowrap overflow-x-auto overflow-y-hidden w-full",
    isSelected ? "border-blue-500" : "border-blue-200"
  )}
>

      {/* Meta Lesson Container (Left) */}
      <button
        onClick={() => onSelectMetaLesson(block.id, metaLesson.id)}
        className="h-full border-r-2 border-blue-200 p-1 flex items-center hover:bg-blue-50"
      >
        <span className="rounded-xs bg-blue-200 px-2 py-1 font-medium">
          {block.title} L{lessonIndex + 1}
        </span>
      </button>

      {/* Individual Lesson Spans (Right) */}
      <div className="flex items-center gap-1 p-1">
        {lessonSpans.map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => onSelectLesson(block.id, metaLesson.id, lesson.id)}
            className={cn(
              "rounded-xs border px-2 py-1 hover:bg-blue-50",
              selectedLessonId === lesson.id
                ? "border-blue-500 bg-blue-100"
                : "border-dashed border-blue-200"
            )}
          >
            {lesson.title}
            {/* {lesson.id} */}
          </button>
        ))}
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
                title: lesson.title,
                metaPeriodId: lesson.meta_period_id,
              });
            }
          });
        });
      });
    });

    return map;
  }, [blocks]);

  // Get lesson spans for a meta lesson
  const getLessonSpansForMetaLesson = (
    metaLesson: any
  ): LessonSpan[] => {
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
      // Deselect if clicking the same lesson
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
      // Deselect if clicking the same lesson
      onLessonSelect("", "", "");
    } else {
      onLessonSelect(blockId, metaLessonId, lessonId);
    }
  };

  if (blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No blocks found
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Meta Lessons List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {blocks.map((block) =>
            block.meta_lessons.map((metaLesson) => (
              <MetaLessonCard
                key={metaLesson.id}
                block={block}
                metaLesson={metaLesson}
                lessonSpans={getLessonSpansForMetaLesson(metaLesson)}
                isSelected={selectedMetaLessonId === metaLesson.id}
                selectedLessonId={selectedLessonId}
                onSelectMetaLesson={handleSelectMetaLesson}
                onSelectLesson={handleSelectLesson}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}