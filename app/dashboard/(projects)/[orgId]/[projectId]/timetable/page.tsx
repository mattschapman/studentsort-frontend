// app/dashboard/(projects)/[orgId]/[projectId]/timetable/page.tsx
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ArrowUpRight, Loader2, Square } from "lucide-react";
import { toast } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { createClient } from "@/lib/supabase/client";
import { useVersionData } from "@/lib/contexts/version-data-context";
import { MetaLessons } from "./_components/meta-lessons";
import { SummaryAvailabilityGrid } from "./_components/summary-availability-grid";
import { FormGroupsGrid } from "./_components/form-groups-availability-grid";
import { TeachersGrid } from "./_components/teachers-availability-grid";
import { TimetableViewOptionsPopover, type TimetableViewOptions } from "./_components/options-popover";
import {
  computeFormGroupsAvailability,
  computeTeachersAvailability,
  getScheduledPeriod,
  parsePeriods,
} from "./_lib/compute-timetable-availability";
import { filterPeriodsByType } from "./_lib/period-label-utils";
import { Button } from "@/components/ui/button";
import { TimetableProgressPopover } from "./_components/progress-popover";
import { StartAutoSchedulingDialog } from "./_components/start-auto-scheduling-dialog";
import { cancelAutoSchedulingJob } from "./_actions/cancel-autoscheduling-job";

// Define stage type
type Stage = 
  | "initialising" 
  | "constructing_blocks" 
  | "scheduling_lessons" 
  | "finding_teachers" 
  | "checking_everything";

// Define stage messages and their order
const STAGE_MESSAGES: Record<Stage, string> = {
  initialising: "Initialising",
  constructing_blocks: "Constructing blocks",
  scheduling_lessons: "Scheduling lessons",
  finding_teachers: "Finding teachers",
  checking_everything: "Checking everything",
};

const STAGE_ORDER: Stage[] = [
  "initialising",
  "constructing_blocks",
  "scheduling_lessons",
  "finding_teachers",
  "checking_everything",
];

export default function TimetablePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  const projectId = params.projectId as string;
  const versionId = searchParams.get('version') || '';

  const {
    versionData,
    isLoading,
    error,
    hasUnsavedChanges,
    updateMetaPeriodSchedule,
    updateLessonTeacher,
  } = useVersionData();

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [selectedMetaLessonId, setSelectedMetaLessonId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [isAutoSchedulingDialogOpen, setIsAutoSchedulingDialogOpen] = useState(false);

  // Auto-scheduling job state
  const [activeJobTaskId, setActiveJobTaskId] = useState<string | null>(null);
  const [activeJobVersionId, setActiveJobVersionId] = useState<string | null>(null);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const supabaseRef = useRef(createClient());

  // Grid view options state
  const [gridViewOptions, setGridViewOptions] = useState<TimetableViewOptions>({
    showFormGroupsGrid: true,
    showSelectedLessonFormGroupsOnly: true,
    showTeachersGrid: true,
    teacherFilter: "eligible",
    showRoomsGrid: false,
    showPeriodTypes: {
      Registration: false,
      Lesson: true,
      Break: false,
      Lunch: false,
      Twilight: false,
    },
    showBlockTitles: true,
    useBlockColors: true,
  });

  // Handle job started - set up realtime subscription
  const handleJobStarted = (taskId: string, newVersionId: string) => {
    setActiveJobTaskId(taskId);
    setActiveJobVersionId(newVersionId);
    setCurrentStage("initialising");
  };

  // Realtime subscription for job updates
  useEffect(() => {
    if (!activeJobTaskId) return;

    const supabase = supabaseRef.current;
    
    const channel = supabase
      .channel(`autoscheduling_job:${activeJobTaskId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'autoscheduling_jobs',
          filter: `id=eq.${activeJobTaskId}`,
        },
        (payload: any) => {
          const job = payload.new;
          
          console.log('Job update received:', job);
          
          // Update stage if present
          if (job.stage) {
            setCurrentStage(job.stage as Stage);
          }

          // Handle status changes
          if (job.status === 'completed') {
            setActiveJobTaskId(null);
            setActiveJobVersionId(null);
            setCurrentStage(null);

            toast.success("Auto-scheduling completed!");
            
            // Navigate to the new version with full page reload
            if (activeJobVersionId) {
              window.location.href = `/dashboard/${orgId}/${projectId}/timetable?version=${activeJobVersionId}`;
            }
          } else if (job.status === 'failed') {
            setActiveJobTaskId(null);
            setActiveJobVersionId(null);
            setCurrentStage(null);

            toast.error(job.error || "Auto-scheduling failed");
          } else if (job.status === 'cancelled') {
            setActiveJobTaskId(null);
            setActiveJobVersionId(null);
            setCurrentStage(null);

            toast.info("Auto-scheduling cancelled");
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'autoscheduling_jobs',
          filter: `id=eq.${activeJobTaskId}`,
        },
        () => {
          // Job was deleted (cancelled)
          setActiveJobTaskId(null);
          setActiveJobVersionId(null);
          setCurrentStage(null);
          
          toast.info("Auto-scheduling cancelled");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeJobTaskId, activeJobVersionId, orgId, projectId, router]);

  // Handle stop job
  const handleStopJob = async () => {
    if (!activeJobTaskId || !activeJobVersionId) return;

    const result = await cancelAutoSchedulingJob(activeJobTaskId, activeJobVersionId);

    if (!result.success) {
      toast.error(result.error || "Failed to stop auto-scheduling");
    }
    // Note: The realtime subscription will handle cleanup when the record is deleted
  };

  // Parse all periods
  const allPeriods = useMemo(() => {
    if (!versionData) return [];
    return parsePeriods(versionData);
  }, [versionData]);

  // Filter periods based on selected types
  const filteredPeriods = useMemo(() => {
    return filterPeriodsByType(allPeriods, gridViewOptions.showPeriodTypes);
  }, [allPeriods, gridViewOptions.showPeriodTypes]);

  // Compute form groups availability
  const formGroupsAvailability = useMemo(() => {
    if (!versionData) return [];
    return computeFormGroupsAvailability(versionData);
  }, [versionData]);

  // Compute teachers availability
  const teachersAvailability = useMemo(() => {
    if (!versionData) return [];
    return computeTeachersAvailability(
      versionData,
      selectedMetaLessonId,
      selectedLessonId
    );
  }, [versionData, selectedMetaLessonId, selectedLessonId]);

  // Filter teachers based on teacher filter option
  const filteredTeachersAvailability = useMemo(() => {
    if (gridViewOptions.teacherFilter === "all") {
      return teachersAvailability;
    }

    if (gridViewOptions.teacherFilter === "assigned") {
      if (!versionData) return [];

      const assignedTeacherIds = new Set<string>();
      for (const block of versionData.model.blocks) {
        for (const tg of block.teaching_groups) {
          for (const cls of tg.classes) {
            for (const lesson of cls.lessons) {
              if (lesson.teacher_id) {
                assignedTeacherIds.add(lesson.teacher_id);
              }
            }
          }
        }
      }

      return teachersAvailability.filter((t) =>
        assignedTeacherIds.has(t.teacherId)
      );
    }

    return teachersAvailability;
  }, [teachersAvailability, gridViewOptions.teacherFilter, versionData]);

  // Get feeder form groups for selected block
  const feederFormGroupIds = useMemo(() => {
    if (!selectedBlockId || !versionData) return [];
    const block = versionData.model.blocks.find((b) => b.id === selectedBlockId);
    return block?.feeder_form_groups || [];
  }, [selectedBlockId, versionData]);

  // Filter form groups based on "selected only" option
  const effectiveFeederFormGroupIds = useMemo(() => {
    if (gridViewOptions.showSelectedLessonFormGroupsOnly && selectedBlockId) {
      return feederFormGroupIds;
    }
    return [];
  }, [
    gridViewOptions.showSelectedLessonFormGroupsOnly,
    selectedBlockId,
    feederFormGroupIds,
  ]);

  // Handle meta lesson selection
  const handleMetaLessonSelect = (blockId: string, metaLessonId: string) => {
    if (!blockId || !metaLessonId) {
      setSelectedBlockId(null);
      setSelectedMetaLessonId(null);
      setSelectedLessonId(null);
    } else {
      setSelectedBlockId(blockId);
      setSelectedMetaLessonId(metaLessonId);
      setSelectedLessonId(null);
    }
  };

  const handleLessonSelect = (
    blockId: string,
    metaLessonId: string,
    lessonId: string
  ) => {
    if (!blockId || !metaLessonId || !lessonId) {
      setSelectedBlockId(null);
      setSelectedMetaLessonId(null);
      setSelectedLessonId(null);
    } else {
      setSelectedBlockId(blockId);
      setSelectedMetaLessonId(metaLessonId);
      setSelectedLessonId(lessonId);
    }
  };

  // Handle period click to assign/unassign meta lesson
  const handlePeriodClick = (periodId: string) => {
    if (!selectedMetaLessonId || !versionData || !selectedBlockId) return;

    const block = versionData.model.blocks.find((b) => b.id === selectedBlockId);
    if (!block) return;

    const metaLesson = block.meta_lessons.find(
      (ml) => ml.id === selectedMetaLessonId
    );
    if (!metaLesson) return;

    const currentlyScheduledPeriod = getScheduledPeriod(
      selectedMetaLessonId,
      versionData.model.blocks
    );

    const metaPeriod = metaLesson.meta_periods[0];
    if (!metaPeriod) return;

    if (currentlyScheduledPeriod === periodId) {
      updateMetaPeriodSchedule(
        selectedBlockId,
        selectedMetaLessonId,
        metaPeriod.id,
        null
      );
    } else {
      updateMetaPeriodSchedule(
        selectedBlockId,
        selectedMetaLessonId,
        metaPeriod.id,
        periodId
      );
    }
  };

  // Handle teacher click to assign/unassign teacher to lesson
  const handleTeacherClick = (teacherId: string, lessonId: string) => {
    if (!selectedLessonId || !versionData || !selectedBlockId) return;

    let lessonDetails: {
      teachingGroupNumber: number;
      classId: string;
      currentTeacherId: string | null;
    } | null = null;

    for (const block of versionData.model.blocks) {
      if (block.id !== selectedBlockId) continue;

      for (const tg of block.teaching_groups) {
        for (const cls of tg.classes) {
          const lesson = cls.lessons.find((l) => l.id === lessonId);
          if (lesson) {
            lessonDetails = {
              teachingGroupNumber: tg.number,
              classId: cls.id,
              currentTeacherId: lesson.teacher_id || null,
            };
            break;
          }
        }
        if (lessonDetails) break;
      }
      if (lessonDetails) break;
    }

    if (!lessonDetails) return;

    const isCurrentlyAssigned = lessonDetails.currentTeacherId === teacherId;

    if (isCurrentlyAssigned) {
      updateLessonTeacher(
        selectedBlockId,
        lessonDetails.teachingGroupNumber,
        lessonDetails.classId,
        lessonId,
        null
      );
    } else {
      updateLessonTeacher(
        selectedBlockId,
        lessonDetails.teachingGroupNumber,
        lessonDetails.classId,
        lessonId,
        teacherId
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !versionData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-sm text-muted-foreground">
          {error || "No version data available"}
        </p>
      </div>
    );
  }

  const isJobRunning = activeJobTaskId !== null;

  return (
    <div className="h-full bg-white">
      <div className="h-full w-full bg-white">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* Left Column: Meta Lessons */}
          <ResizablePanel defaultSize={300} minSize={200} maxSize={300}>
            <div className="h-full flex flex-col min-h-0">
              <div className="py-2 px-4.5 border-b flex justify-between items-center shrink-0">
                <h2 className="font-semibold">Timetable</h2>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                <MetaLessons
                  blocks={versionData.model.blocks}
                  selectedMetaLessonId={selectedMetaLessonId}
                  selectedLessonId={selectedLessonId}
                  onMetaLessonSelect={handleMetaLessonSelect}
                  onLessonSelect={handleLessonSelect}
                />
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Column: Schedule Grids */}
          <ResizablePanel defaultSize={80}>
            <div className="h-full flex flex-col min-h-0 bg-stone-100">
              {/* Toolbar */}
              <div className="shrink-0 bg-white flex justify-between items-center px-4 py-3 border-b">
                {isJobRunning ? (
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      size="xs"
                      variant="destructive"
                      className="text-xs"
                      onClick={handleStopJob}
                    >
                      <Square className="size-3 fill-white" />
                      Stop
                    </Button>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Auto-scheduling in progress...
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1">
                      <Button
                        size="xs"
                        className="text-xs"
                        onClick={() => setIsAutoSchedulingDialogOpen(true)}
                      >
                        Build
                        <ArrowUpRight className="size-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <TimetableProgressPopover blocks={versionData.model.blocks} />
                      <TimetableViewOptionsPopover
                        options={gridViewOptions}
                        onOptionsChange={setGridViewOptions}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* All Grids - Resizable/scrollable */}
              <div className="flex-1 overflow-hidden relative">
                {isJobRunning && (
                  <div className="absolute inset-0 bg-white z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <div className="text-sm font-medium">
                        Building timetable...
                      </div>
                      <div className="overflow-hidden h-5">
                        <div
                          className="transition-transform duration-300 ease-in-out"
                          style={{
                            transform: `translateY(-${
                              currentStage 
                                ? STAGE_ORDER.indexOf(currentStage) * 1.25
                                : 0
                            }rem)`,
                          }}
                        >
                          {STAGE_ORDER.map((stage, i) => (
                            <div
                              key={i}
                              className="h-5 flex items-center justify-center"
                            >
                              <p className="text-muted-foreground text-xs">
                                {STAGE_MESSAGES[stage]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <ResizablePanelGroup orientation="vertical" className="h-full">
                  {/* Form Groups Grid */}
                  {gridViewOptions.showFormGroupsGrid && (
                    <>
                      <ResizablePanel defaultSize={40} minSize={15}>
                        <FormGroupsGrid
                          versionData={versionData}
                          periods={filteredPeriods}
                          formGroupsAvailability={formGroupsAvailability}
                          selectedBlockId={selectedBlockId}
                          selectedMetaLessonId={selectedMetaLessonId}
                          feederFormGroupIds={effectiveFeederFormGroupIds}
                          showBlockColors={gridViewOptions.useBlockColors}
                          showBlockTitles={gridViewOptions.showBlockTitles}
                          groupByBand={true}
                        />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                    </>
                  )}

                  {/* Summary Availability Grid */}
                  <ResizablePanel defaultSize={20} minSize={10}>
                    <SummaryAvailabilityGrid
                      versionData={versionData}
                      periods={filteredPeriods}
                      selectedBlockId={selectedBlockId}
                      selectedMetaLessonId={selectedMetaLessonId}
                      formGroupsAvailability={formGroupsAvailability}
                      onPeriodClick={handlePeriodClick}
                    />
                  </ResizablePanel>

                  {/* Teachers and Rooms Grids */}
                  {(gridViewOptions.showTeachersGrid ||
                    gridViewOptions.showRoomsGrid) && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={40} minSize={15}>
                        {gridViewOptions.showTeachersGrid &&
                        !gridViewOptions.showRoomsGrid ? (
                          <TeachersGrid
                            versionData={versionData}
                            periods={filteredPeriods}
                            teachersAvailability={filteredTeachersAvailability}
                            selectedMetaLessonId={selectedMetaLessonId}
                            selectedLessonId={selectedLessonId}
                            showSubjectColors={gridViewOptions.useBlockColors}
                            onTeacherClick={handleTeacherClick}
                          />
                        ) : gridViewOptions.showRoomsGrid &&
                          !gridViewOptions.showTeachersGrid ? (
                          <div className="h-full w-full flex items-center justify-center bg-stone-100">
                            <div className="text-sm text-muted-foreground">
                              Rooms grid coming soon...
                            </div>
                          </div>
                        ) : (
                          <ResizablePanelGroup orientation="vertical" className="h-full">
                            <ResizablePanel defaultSize={50} minSize={20}>
                              <TeachersGrid
                                versionData={versionData}
                                periods={filteredPeriods}
                                teachersAvailability={
                                  filteredTeachersAvailability
                                }
                                selectedMetaLessonId={selectedMetaLessonId}
                                selectedLessonId={selectedLessonId}
                                showSubjectColors={gridViewOptions.useBlockColors}
                                onTeacherClick={handleTeacherClick}
                              />
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={50} minSize={20}>
                              <div className="h-full w-full flex items-center justify-center bg-stone-100">
                                <div className="text-sm text-muted-foreground">
                                  Rooms grid coming soon...
                                </div>
                              </div>
                            </ResizablePanel>
                          </ResizablePanelGroup>
                        )}
                      </ResizablePanel>
                    </>
                  )}
                </ResizablePanelGroup>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Auto-Scheduling Dialog */}
      <StartAutoSchedulingDialog
        open={isAutoSchedulingDialogOpen}
        onOpenChange={setIsAutoSchedulingDialogOpen}
        versionData={versionData}
        orgId={orgId}
        projectId={projectId}
        versionId={versionId}
        onJobStarted={handleJobStarted}
      />
    </div>
  );
}