// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/add-block-dialog.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Step1BasicDetails } from "./step1-basic-details";
import { Step2TeachingGroups } from "./step2-teaching-groups";
import { Step3BlockOrdering } from "./step3-block-ordering";
import { ProgressDialog } from "./progress-dialog";
import type { Block, BlockFormData, MetaLesson, MetaPeriod, TeachingGroup, Class, Lesson } from "./types";
import type { YearGroup, FormGroup, Band, Subject } from "@/lib/contexts/version-data-context";
import { generateId, createDefaultTeachingGroup } from "./utils";

interface AddBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (block: Block) => void;
  yearGroup: string;
  yearGroups: YearGroup[];
  formGroups: FormGroup[];
  bands: Band[];
  subjects: Subject[];
}

export function AddBlockDialog({
  open,
  onOpenChange,
  onSubmit,
  yearGroup,
  yearGroups,
  formGroups,
  bands,
  subjects,
}: AddBlockDialogProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState({
    stage: 0,
    totalStages: 5,
    currentStage: '',
    percentage: 0,
  });

  const [formData, setFormData] = useState<BlockFormData>({
    yearGroup,
    title: '',
    teachingPeriods: '',
    periodBreakdown: '',
    colorScheme: '',
    startCol: '',
    startRow: '',
    endRow: '',
    selectedFormGroups: [],
    teachingGroups: [createDefaultTeachingGroup(1, '')],
    lessonMappings: {},
  });

  // Reset form when year group changes or dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setIsSubmitting(false);
      setProgress({
        stage: 0,
        totalStages: 5,
        currentStage: '',
        percentage: 0,
      });
      setFormData({
        yearGroup,
        title: '',
        teachingPeriods: '',
        periodBreakdown: '',
        colorScheme: '',
        startCol: '',
        startRow: '',
        endRow: '',
        selectedFormGroups: [],
        teachingGroups: [createDefaultTeachingGroup(1, '')],
        lessonMappings: {},
      });
    }
  }, [open, yearGroup]);

  // Update year group if it changes while dialog is open
  useEffect(() => {
    if (open) {
      setFormData(prev => ({ ...prev, yearGroup }));
    }
  }, [yearGroup, open]);

  const updateFormData = (updates: Partial<BlockFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Validation for each step
  const isStep1Valid = useMemo(() => {
    return !!(
      formData.title &&
      formData.teachingPeriods &&
      formData.periodBreakdown &&
      formData.selectedFormGroups.length > 0
    );
  }, [formData.title, formData.teachingPeriods, formData.periodBreakdown, formData.selectedFormGroups]);

  const isStep2Valid = useMemo(() => {
    if (formData.teachingGroups.length === 0) return false;

    const expectedPeriods = parseInt(formData.teachingPeriods) || 0;

    return formData.teachingGroups.every(tg => {
      if (tg.classes.length === 0) return false;
      
      const totalPeriods = tg.classes.reduce((sum, c) => sum + (c.numPeriods || 0), 0);
      if (expectedPeriods > 0 && totalPeriods !== expectedPeriods) return false;

      return tg.classes.every(c => 
        c.subjectId && c.numPeriods > 0 && c.periodBreakdown
      );
    });
  }, [formData.teachingGroups, formData.teachingPeriods]);

  const canProceed = step === 1 ? isStep1Valid : step === 2 ? isStep2Valid : true;

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStep(1);
      setFormData({
        yearGroup,
        title: '',
        teachingPeriods: '',
        periodBreakdown: '',
        colorScheme: '',
        startCol: '',
        startRow: '',
        endRow: '',
        selectedFormGroups: [],
        teachingGroups: [createDefaultTeachingGroup(1, '')],
        lessonMappings: {},
      });
    }
    onOpenChange(newOpen);
  };

  const handleSubmit = async () => {
    if (!isStep1Valid || !isStep2Valid) {
      toast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);

    const stages = [
      "Creating block structure...",
      "Building meta lessons...",
      "Processing teaching groups...",
      "Assigning lessons...",
      "Finalizing block...",
    ];

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev.stage < stages.length - 1) {
          const newStage = prev.stage + 1;
          return {
            stage: newStage,
            totalStages: stages.length,
            currentStage: stages[newStage],
            percentage: Math.round(((newStage + 1) / stages.length) * 100),
          };
        }
        return prev;
      });
    }, 300);

    try {
      // Build the complete block structure
      const blockId = generateId('block');
      
      // Build meta lessons
      const metaLessons: MetaLesson[] = [];
      formData.periodBreakdown.split('').forEach((char, idx) => {
        const length = char === 'D' ? 2 : 1;
        const metaLessonNum = idx + 1;
        const metaLessonId = `${blockId}-ml${metaLessonNum}`;
        const metaPeriods: MetaPeriod[] = [];

        for (let i = 0; i < length; i++) {
          metaPeriods.push({
            id: `${blockId}-ml${metaLessonNum}-mp${i + 1}`,
            length: 1,
            start_period_id: '',
          });
        }

        metaLessons.push({
          id: metaLessonId,
          length,
          meta_periods: metaPeriods,
        });
      });

      // Build teaching groups with classes and lessons
      const teachingGroups: TeachingGroup[] = [];
      
      formData.teachingGroups.forEach(tg => {
        const classes: Class[] = [];

        tg.classes.forEach(cls => {
          const lessons: Lesson[] = [];

          // Build lessons for this class
          cls.periodBreakdown.split('').forEach((char, idx) => {
            const lessonNumber = idx + 1;
            const lessonId = `${cls.id}-l${lessonNumber}`;
            
            // Get meta_period_id from lessonMappings
            // The mapping uses stable IDs like "ml1-mp1", but we need to add blockId prefix
            const mappedMetaPeriodId = formData.lessonMappings[lessonId] || '';
            const metaPeriodId = mappedMetaPeriodId ? `${blockId}-${mappedMetaPeriodId}` : '';

            lessons.push({
              number: lessonNumber,
              id: lessonId,
              length: char === 'D' ? 2 : 1,
              teacher: [],
              meta_period_id: metaPeriodId, // Now properly assigned with blockId prefix!
            });
          });

          classes.push({
            subject: cls.subjectId,
            id: cls.title,
            total_periods: cls.numPeriods,
            period_breakdown: cls.periodBreakdown,
            lessons,
          });
        });

        teachingGroups.push({
          number: tg.number,
          classes,
        });
      });

      // Create the block
      const block: Block = {
        id: blockId,
        title: formData.title,
        total_periods: parseInt(formData.teachingPeriods),
        period_breakdown: formData.periodBreakdown,
        feeder_form_groups: formData.selectedFormGroups,
        year_group: parseInt(formData.yearGroup),
        start_col: formData.startCol ? parseInt(formData.startCol) : undefined,
        start_row: formData.startRow ? parseInt(formData.startRow) : undefined,
        end_row: formData.endRow ? parseInt(formData.endRow) : undefined,
        color_scheme: formData.colorScheme,
        meta_lessons: metaLessons,
        teaching_groups: teachingGroups,
      };

      clearInterval(progressInterval);
      
      // Submit the block
      onSubmit(block);
      toast.success("Block created successfully");
      handleOpenChange(false);
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Error creating block:", error);
      toast.error("Failed to create block");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ProgressDialog
        open={isSubmitting}
        progress={progress}
        title="Creating block..."
      />

      <Dialog open={open && !isSubmitting} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-175 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <DialogHeader>
            <DialogTitle>Add Block</DialogTitle>
            <DialogDescription>
              Create a new block for Year {yearGroup}
            </DialogDescription>
          </DialogHeader>

          {/* Progress Indicator */}
          <div className="flex gap-2 mb-2">
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step >= 3 ? 'bg-primary' : 'bg-muted'}`} />
          </div>

          {/* Content */}
          <div className="space-y-6">
            {step === 1 && (
              <Step1BasicDetails
                formData={formData}
                onChange={updateFormData}
                yearGroups={yearGroups}
                formGroups={formGroups}
                bands={bands}
              />
            )}
            {step === 2 && (
              <Step2TeachingGroups
                formData={formData}
                onChange={updateFormData}
                subjects={subjects}
              />
            )}
            {step === 3 && (
              <Step3BlockOrdering
                formData={formData}
                onChange={updateFormData}
                subjects={subjects}
              />
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              {step === 1 && (
                <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              )}
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {step < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={handleSubmit} disabled={!canProceed}>
                  Create Block
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}