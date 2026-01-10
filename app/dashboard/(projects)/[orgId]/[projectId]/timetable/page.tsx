// app/dashboard/(projects)/[orgId]/[projectId]/timetable/page.tsx
"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
} from "./_lib/compute-timetable-availability";

export default function TimetablePage() {
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

  // Grid view options state
  const [gridViewOptions, setGridViewOptions] = useState<TimetableViewOptions>({
    showFormGroupsGrid: true,
    showSelectedLessonFormGroupsOnly: true,
    showTeachersGrid: true,
    teacherFilter: "eligible",
    showRoomsGrid: false,
    showBlockTitles: true,
    useBlockColors: true,
  });

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
      // Show all teachers (this would require computing all teachers, not just eligible ones)
      return teachersAvailability;
    }

    if (gridViewOptions.teacherFilter === "assigned") {
      // Show only teachers who are assigned to any lesson
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

    // "eligible" - this is already the default from computeTeachersAvailability
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
    return []; // Empty array means show all
  }, [
    gridViewOptions.showSelectedLessonFormGroupsOnly,
    selectedBlockId,
    feederFormGroupIds,
  ]);

  // Handle meta lesson selection
  const handleMetaLessonSelect = (blockId: string, metaLessonId: string) => {
    // Handle deselection (empty strings)
    if (!blockId || !metaLessonId) {
      setSelectedBlockId(null);
      setSelectedMetaLessonId(null);
      setSelectedLessonId(null);
    } else {
      setSelectedBlockId(blockId);
      setSelectedMetaLessonId(metaLessonId);
      setSelectedLessonId(null); // Clear lesson selection when meta lesson is selected
    }
  };

  const handleLessonSelect = (
    blockId: string,
    metaLessonId: string,
    lessonId: string
  ) => {
    // Handle deselection (empty strings)
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

    // Get the first meta period (for now, we assume one meta period per meta lesson)
    const metaPeriod = metaLesson.meta_periods[0];
    if (!metaPeriod) return;

    if (currentlyScheduledPeriod === periodId) {
      // Unschedule if clicking the same period
      updateMetaPeriodSchedule(
        selectedBlockId,
        selectedMetaLessonId,
        metaPeriod.id,
        null
      );
    } else {
      // Schedule to the clicked period
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

    // Find the lesson to get its details
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
      // Unassign if clicking the same teacher
      updateLessonTeacher(
        selectedBlockId,
        lessonDetails.teachingGroupNumber,
        lessonDetails.classId,
        lessonId,
        null
      );
    } else {
      // Assign to the clicked teacher
      updateLessonTeacher(
        selectedBlockId,
        lessonDetails.teachingGroupNumber,
        lessonDetails.classId,
        lessonId,
        teacherId
      );
    }
  };

  // Calculate visible grids for dynamic layout
  const visibleGridsCount = [
    gridViewOptions.showFormGroupsGrid,
    gridViewOptions.showTeachersGrid,
    gridViewOptions.showRoomsGrid,
  ].filter(Boolean).length;

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

  return (
    <div className="h-full bg-white">
      <div className="h-full w-full bg-white">
        <ResizablePanelGroup orientation="horizontal" className="h-full">
          {/* Left Column: Meta Lessons */}
          <ResizablePanel defaultSize={300} minSize={200} maxSize={300}>
            <div className="h-full flex flex-col min-h-0">
              <div className="px-5 h-12 border-b flex justify-between items-center shrink-0">
                <h2 className="font-semibold">Lessons</h2>
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
              <div className="shrink-0 bg-white flex justify-end items-center px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  {/* {hasUnsavedChanges && (
                    <span className="text-xs text-muted-foreground">Unsaved changes</span>
                  )} */}
                  <TimetableViewOptionsPopover
                    options={gridViewOptions}
                    onOptionsChange={setGridViewOptions}
                  />
                </div>
              </div>

              {/* Summary Availability Grid - Fixed at top */}
              <div className="shrink-0 min-h-24 border-b">
                <SummaryAvailabilityGrid
                  versionData={versionData}
                  selectedBlockId={selectedBlockId}
                  selectedMetaLessonId={selectedMetaLessonId}
                  formGroupsAvailability={formGroupsAvailability}
                  onPeriodClick={handlePeriodClick}
                />
              </div>

              {/* Form Groups and Teachers Grids - Resizable/scrollable */}
              <div className="flex-1 overflow-hidden">
                <ResizablePanelGroup orientation="vertical" className="h-full">
                  {gridViewOptions.showFormGroupsGrid && (
                    <>
                      <ResizablePanel
                        defaultSize={100 / visibleGridsCount}
                        minSize={100}
                      >
                        <FormGroupsGrid
                          versionData={versionData}
                          formGroupsAvailability={formGroupsAvailability}
                          selectedBlockId={selectedBlockId}
                          feederFormGroupIds={effectiveFeederFormGroupIds}
                          showBlockColors={gridViewOptions.useBlockColors}
                          showBlockTitles={gridViewOptions.showBlockTitles}
                          groupByBand={true}
                        />
                      </ResizablePanel>
                      {(gridViewOptions.showTeachersGrid ||
                        gridViewOptions.showRoomsGrid) && (
                        <ResizableHandle withHandle />
                      )}
                    </>
                  )}

                  {gridViewOptions.showTeachersGrid && (
                    <>
                      <ResizablePanel
                        defaultSize={100 / visibleGridsCount}
                        minSize={100}
                      >
                        <TeachersGrid
                          versionData={versionData}
                          teachersAvailability={filteredTeachersAvailability}
                          selectedMetaLessonId={selectedMetaLessonId}
                          selectedLessonId={selectedLessonId}
                          showSubjectColors={gridViewOptions.useBlockColors}
                          onTeacherClick={handleTeacherClick}
                        />
                      </ResizablePanel>
                      {gridViewOptions.showRoomsGrid && (
                        <ResizableHandle withHandle />
                      )}
                    </>
                  )}

                  {gridViewOptions.showRoomsGrid && (
                    <ResizablePanel
                      defaultSize={100 / visibleGridsCount}
                      minSize={20}
                    >
                      <div className="h-full w-full flex items-center justify-center bg-stone-100">
                        <div className="text-sm text-muted-foreground">
                          Rooms grid coming soon...
                        </div>
                      </div>
                    </ResizablePanel>
                  )}
                </ResizablePanelGroup>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}