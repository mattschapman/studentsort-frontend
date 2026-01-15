"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LessonDetail {
  classTitle: string;
  subjectName: string;
  subjectAbbreviation: string;
  teacherName: string;
  teacherInitials: string;
  teachingGroupTitle: string;
  lessonId: string;
  formGroupName?: string;
}

interface FormGroupsGridCellPopoverProps {
  blockTitle: string;
  lessons: LessonDetail[];
  isOccupied: boolean;
  children: React.ReactNode;
}

export function FormGroupsGridCellPopover({
  blockTitle,
  lessons,
  isOccupied,
  children,
}: FormGroupsGridCellPopoverProps) {
  const [open, setOpen] = useState(false);

  // If not occupied, just render children
  if (!isOccupied || lessons.length === 0) {
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-full h-full flex items-center justify-center cursor-pointer py-1">
          {children}
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
            {lessons.map((lesson, index) => (
              <div
                key={lesson.lessonId || index}
                className={cn(
                  "p-3 rounded-md border bg-muted/50",
                  index !== lessons.length - 1 && "mb-2"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-6 rounded-sm text-[0.65rem] font-semibold bg-stone-200">
                      {lesson.subjectAbbreviation}
                    </div>
                    <span className="text-sm font-medium">{lesson.classTitle}</span>
                    {lesson.teacherName && lesson.teacherName !== "Unassigned" && (
                      <span className="text-sm text-muted-foreground ml-auto">
                        {lesson.teacherName}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{lesson.subjectName}</span>
                  </div>

                  {lesson.formGroupName && (
                    <div className="text-xs text-muted-foreground">
                      Form Group: <span className="font-medium text-foreground">{lesson.formGroupName}</span>
                    </div>
                  )}

                  {lesson.teacherInitials && lesson.teacherInitials !== "?" && (
                    <div className="text-xs text-muted-foreground">
                      Teacher: <span className="font-medium text-foreground">{lesson.teacherInitials}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}