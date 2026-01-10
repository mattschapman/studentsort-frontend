// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/progress-popover.tsx
import { useMemo } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface Block {
  id: string;
  meta_lessons: {
    id: string;
    meta_periods: {
      id: string;
      start_period_id: string;
    }[];
  }[];
  teaching_groups: {
    number: number;
    classes: {
      id: string;
      lessons: {
        id: string;
        teacher_id: string;
      }[];
    }[];
  }[];
}

interface TimetableProgressPopoverProps {
  blocks: Block[];
}

export function TimetableProgressPopover({ blocks }: TimetableProgressPopoverProps) {
  const progress = useMemo(() => {
    // Calculate scheduled meta periods
    const allMetaPeriods = blocks.flatMap((b) =>
      b.meta_lessons.flatMap((ml) => ml.meta_periods)
    );
    const totalMetaPeriods = allMetaPeriods.length;
    const scheduledMetaPeriods = allMetaPeriods.filter(
      (mp) => mp.start_period_id && mp.start_period_id.trim() !== ""
    ).length;

    // Calculate lessons with teachers assigned
    const allLessons = blocks.flatMap((b) =>
      b.teaching_groups.flatMap((tg) =>
        tg.classes.flatMap((c) => c.lessons)
      )
    );
    const totalLessons = allLessons.length;
    const assignedLessons = allLessons.filter(
      (l) => l.teacher_id && l.teacher_id.trim() !== ""
    ).length;

    // Calculate percentages
    const schedulePercentage =
      totalMetaPeriods > 0 ? (scheduledMetaPeriods / totalMetaPeriods) * 100 : 0;
    const teacherPercentage =
      totalLessons > 0 ? (assignedLessons / totalLessons) * 100 : 0;
    const combinedPercentage = (schedulePercentage + teacherPercentage) / 2;

    return {
      schedule: {
        count: scheduledMetaPeriods,
        total: totalMetaPeriods,
        percentage: schedulePercentage,
      },
      teachers: {
        count: assignedLessons,
        total: totalLessons,
        percentage: teacherPercentage,
      },
      combined: combinedPercentage,
    };
  }, [blocks]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="xs" className="text-xs font-normal">
          {Math.round(progress.combined)}% complete
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-3">Progress</h4>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Lessons scheduled</span>
              <span className="text-muted-foreground">
                {progress.schedule.count}/{progress.schedule.total} (
                {Math.round(progress.schedule.percentage)}%)
              </span>
            </div>
            <Progress value={progress.schedule.percentage} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Teachers assigned</span>
              <span className="text-muted-foreground">
                {progress.teachers.count}/{progress.teachers.total} (
                {Math.round(progress.teachers.percentage)}%)
              </span>
            </div>
            <Progress value={progress.teachers.percentage} className="h-2" />
          </div>

          <div className="pb-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">Overall progress</span>
              <span className="font-semibold">
                {Math.round(progress.combined)}%
              </span>
            </div>
            <Progress value={progress.combined} className="h-2" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}