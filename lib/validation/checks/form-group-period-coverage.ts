// lib/validation/checks/form-group-period-coverage.ts

import type { Issue, ValidationContext, CheckFunction } from '../types';
import { generateShortId } from '../utils';

/**
 * Check: Form Group Period Coverage
 * 
 * Validates that every form group's total block periods match the total number
 * of lesson periods in the cycle. Each form group should have blocks that add up
 * to exactly the number of lesson periods available.
 */
export const checkFormGroupPeriodCoverage: CheckFunction = (context: ValidationContext): Issue[] => {
  const issues: Issue[] = [];
  const { versionData, orgId, projectId } = context;

  if (!versionData?.data?.form_groups || !versionData?.model?.blocks || !versionData?.cycle?.periods) {
    return issues;
  }

  const formGroups = versionData.data.form_groups;
  const blocks = versionData.model.blocks;
  const periods = versionData.cycle.periods;

  // Calculate total lesson periods in the cycle
  const totalLessonPeriods = periods.filter((period: any) => period.type === 'Lesson').length;

  if (totalLessonPeriods === 0) {
    return issues; // No lesson periods defined yet
  }

  // Track violations
  const violations: Array<{
    formGroupId: string;
    formGroupName: string;
    allocatedPeriods: number;
    expectedPeriods: number;
    difference: number;
    blocks: Array<{ blockId: string; blockTitle: string; periods: number }>;
  }> = [];

  // For each form group, calculate total periods from blocks they feed into
  formGroups.forEach((formGroup: any) => {
    const formGroupId = formGroup.id;
    const formGroupName = formGroup.name;

    // Find all blocks this form group feeds into
    const formGroupBlocks: Array<{ blockId: string; blockTitle: string; periods: number }> = [];
    let totalAllocatedPeriods = 0;

    blocks.forEach((block: any) => {
      if (block.feeder_form_groups && block.feeder_form_groups.includes(formGroupId)) {
        const blockPeriods = block.total_periods || 0;
        totalAllocatedPeriods += blockPeriods;
        formGroupBlocks.push({
          blockId: block.id,
          blockTitle: block.title || block.id,
          periods: blockPeriods,
        });
      }
    });

    // Check if allocated periods match expected periods
    if (totalAllocatedPeriods !== totalLessonPeriods) {
      violations.push({
        formGroupId,
        formGroupName,
        allocatedPeriods: totalAllocatedPeriods,
        expectedPeriods: totalLessonPeriods,
        difference: totalAllocatedPeriods - totalLessonPeriods,
        blocks: formGroupBlocks,
      });
    }
  });

  // If there are violations, create a single warning issue
  if (violations.length > 0) {
    // Build detailed breakdown of violations
    const violationDetails = violations
      .map(v => {
        const status = v.difference > 0 
          ? `${Math.abs(v.difference)} periods over`
          : v.difference < 0
          ? `${Math.abs(v.difference)} periods short`
          : 'matches';

        return `  • ${v.formGroupName}: ${v.allocatedPeriods}/${v.expectedPeriods} periods (${status})`;
      })
      .join('\n');

    issues.push({
      id: generateShortId(),
      type: 'warning',
      severity: 'medium',
      title: 'Form Group Period Mismatch',
      description: `${violations.length} form ${violations.length === 1 ? "group doesn't have" : "groups don't have"} enough periods in the Model`,
      details: `Some form groups have block periods that don't add up to the total number of lesson periods in the cycle.\n\nTotal lesson periods in cycle: ${totalLessonPeriods}\nForm groups with mismatches: ${violations.length}/${formGroups.length}\n\n${violationDetails}`,
      recommendation: `Review each form group's block allocations to ensure they total ${totalLessonPeriods} periods. Either adjust block lengths or add/remove blocks to match the cycle structure.`,
      action: {
        label: 'Go to Model',
        path: `/dashboard/${orgId}/${projectId}/model`,
      },
      metadata: {
        affectedEntities: {
          formGroupIds: violations.map(v => v.formGroupId),
        },
        suggestedFix: `Adjust block allocations to match ${totalLessonPeriods} lesson periods per form group`,
        totalLessonPeriods,
        violationCount: violations.length,
        violations: violations.map(v => ({
          formGroupId: v.formGroupId,
          formGroupName: v.formGroupName,
          allocated: v.allocatedPeriods,
          expected: v.expectedPeriods,
          difference: v.difference,
          blocks: v.blocks,
        })),
      },
      checkId: 'form-group-period-coverage',
      timestamp: Date.now(),
    });
  }

  return issues;
};