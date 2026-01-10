// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/grid-cell-popover.tsx
"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LessonDetail {
  lessonId: string;
  classId: string;
  subject: string;
  teacherId?: string;
  teacherName?: string;
}

interface GridCellPopoverProps {
  blockTitle: string;
  lessons: LessonDetail[];
  colors: {
    base: string;
    hover: string;
  };
  subjects: Record<string, string>;
  className?: string;
}

export function GridCellPopover({
  blockTitle,
  lessons,
  colors,
  subjects,
  className,
}: GridCellPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "w-full h-full flex items-center justify-center cursor-pointer py-2.5",
            colors.base,
            colors.hover,
            className
          )}
        >
          <span className="text-[0.65rem] font-medium truncate px-1">
            {blockTitle}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">{blockTitle}</h4>
            <span className="text-xs text-muted-foreground">
              {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
            </span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {lessons.map((lesson, index) => {
              const subjectColor = subjects[lesson.subject] || "bg-blue-200";

              return (
                <div
                  key={lesson.lessonId}
                  className={cn(
                    "p-3 rounded-md border bg-muted/50",
                    index !== lessons.length - 1 && "mb-2"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-6 rounded-sm text-[0.65rem] font-semibold",
                          subjectColor
                        )}
                      >
                        {lesson.subject}
                      </div>
                      <span className="text-sm font-medium">
                        {lesson.classId}
                      </span>
                      {lesson.teacherName && (
                        <span className="text-sm text-muted-foreground ml-auto">
                          {lesson.teacherName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}