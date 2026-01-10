// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/stats.tsx
"use client";

import { useVersionData } from "@/lib/contexts/version-data-context";
import { Progress } from "@/components/ui/progress";

export interface StatsData {
  blocksBuilt: number;
  blocksTotal: number;
  blocksBuiltPercentage: number;
  lessonsScheduled: number;
  lessonsTotal: number;
  lessonsScheduledPercentage: number;
  lessonsStaffed: number;
  lessonsStaffedPercentage: number;
}

/**
 * Calculate all stats from version data
 */
function calculateStats(versionData: any | null): StatsData {
  const emptyStats: StatsData = {
    blocksBuilt: 0,
    blocksTotal: 0,
    blocksBuiltPercentage: 0,
    lessonsScheduled: 0,
    lessonsTotal: 0,
    lessonsScheduledPercentage: 0,
    lessonsStaffed: 0,
    lessonsStaffedPercentage: 0,
  };

  if (!versionData?.model?.blocks) {
    return emptyStats;
  }

  const blocks = versionData.model.blocks;
  const blocksTotal = blocks.length;

  if (blocksTotal === 0) {
    return emptyStats;
  }

  let blocksBuilt = 0;
  let lessonsTotal = 0;
  let lessonsScheduled = 0;
  let lessonsStaffed = 0;

  // Build a map of meta_period_id -> start_period_id for quick lookup
  const metaPeriodToStartPeriod = new Map<string, string>();

  for (const block of blocks) {
    if (!Array.isArray(block.meta_lessons)) continue;

    // Check if this block is "built" (all meta_periods have start_period_id)
    let blockIsBuilt = true;
    let blockHasMetaPeriods = false;

    for (const metaLesson of block.meta_lessons) {
      if (!Array.isArray(metaLesson.meta_periods)) continue;

      for (const metaPeriod of metaLesson.meta_periods) {
        blockHasMetaPeriods = true;
        const startPeriodId = (metaPeriod.start_period_id || '').trim();
        
        // Store the mapping
        if (metaPeriod.id) {
          metaPeriodToStartPeriod.set(metaPeriod.id, startPeriodId);
        }

        // Check if this meta_period has been assigned
        if (!startPeriodId) {
          blockIsBuilt = false;
        }
      }
    }

    // Only count block as built if it has meta_periods and all are assigned
    if (blockHasMetaPeriods && blockIsBuilt) {
      blocksBuilt++;
    }

    // Count lessons from teaching groups
    if (!Array.isArray(block.teaching_groups)) continue;

    for (const teachingGroup of block.teaching_groups) {
      if (!Array.isArray(teachingGroup.classes)) continue;

      for (const cls of teachingGroup.classes) {
        if (!Array.isArray(cls.lessons)) continue;

        for (const lesson of cls.lessons) {
          lessonsTotal++;

          // Check if lesson is scheduled (via its meta_period_id)
          const metaPeriodId = (lesson.meta_period_id || '').trim();
          if (metaPeriodId) {
            const startPeriodId = metaPeriodToStartPeriod.get(metaPeriodId);
            if (startPeriodId && startPeriodId.trim() !== '') {
              lessonsScheduled++;
            }
          }

          // Check if lesson is staffed
          const teachers = Array.isArray(lesson.teacher) ? lesson.teacher : [];
          if (teachers.length > 0) {
            lessonsStaffed++;
          }
        }
      }
    }
  }

  const blocksBuiltPercentage = blocksTotal > 0 ? Math.round((blocksBuilt / blocksTotal) * 100) : 0;
  const lessonsScheduledPercentage = lessonsTotal > 0 ? Math.round((lessonsScheduled / lessonsTotal) * 100) : 0;
  const lessonsStaffedPercentage = lessonsTotal > 0 ? Math.round((lessonsStaffed / lessonsTotal) * 100) : 0;

  return {
    blocksBuilt,
    blocksTotal,
    blocksBuiltPercentage,
    lessonsScheduled,
    lessonsTotal,
    lessonsScheduledPercentage,
    lessonsStaffed,
    lessonsStaffedPercentage,
  };
}

export function Stats() {
  const { versionData } = useVersionData();
  const stats = calculateStats(versionData);

  return (
    <div className="col-span-1 h-full min-h-120 flex flex-col border-b">
      {/* Blocks Built */}
      <div className="px-6 py-5 flex flex-col justify-center gap-3 flex-1 border-b">
        <p className="text-sm text-muted-foreground">Blocks Built</p>
        <div className="text-xl font-semibold flex gap-2 items-end justify-between">
          <span>
            {stats.blocksBuilt}/{stats.blocksTotal}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {stats.blocksBuiltPercentage}%
          </span>
        </div>
        <Progress value={stats.blocksBuiltPercentage} className="h-2" />
      </div>

      {/* Lessons Scheduled */}
      <div className="px-6 py-5 flex flex-col justify-center gap-3 flex-1 border-b">
        <p className="text-sm text-muted-foreground">Lessons Scheduled</p>
        <div className="text-xl font-semibold flex gap-2 items-end justify-between">
          <span>
            {stats.lessonsScheduled}/{stats.lessonsTotal}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {stats.lessonsScheduledPercentage}%
          </span>
        </div>
        <Progress value={stats.lessonsScheduledPercentage} className="h-2" />
      </div>

      {/* Lessons Staffed */}
      <div className="px-6 py-5 flex flex-col justify-center gap-3 flex-1">
        <p className="text-sm text-muted-foreground">Lessons Staffed</p>
        <div className="text-xl font-semibold flex gap-2 items-end justify-between">
          <span>
            {stats.lessonsStaffed}/{stats.lessonsTotal}
          </span>
          <span className="text-sm font-normal text-muted-foreground">
            {stats.lessonsStaffedPercentage}%
          </span>
        </div>
        <Progress value={stats.lessonsStaffedPercentage} className="h-2" />
      </div>
    </div>
  );
}