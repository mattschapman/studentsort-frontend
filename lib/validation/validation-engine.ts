// lib/validation/validation-engine.ts

import type { ValidationContext, ValidationResult, CheckDefinition, CheckPrerequisites } from './types';
import { getActiveChecks } from './check-registry';

/**
 * Checks if prerequisites for a check are met
 */
function checkPrerequisites(
  prerequisites: CheckPrerequisites,
  context: ValidationContext
): boolean {
  const { versionData } = context;

  if (!versionData) return false;

  // Check each prerequisite
  if (prerequisites.requiresBlocks) {
    if (!versionData.model?.blocks || versionData.model.blocks.length === 0) {
      return false;
    }
  }

  if (prerequisites.requiresTeachers) {
    if (!versionData.data?.teachers || versionData.data.teachers.length === 0) {
      return false;
    }
  }

  if (prerequisites.requiresSubjects) {
    if (!versionData.data?.subjects || versionData.data.subjects.length === 0) {
      return false;
    }
  }

  if (prerequisites.requiresYearGroups) {
    if (!versionData.data?.year_groups || versionData.data.year_groups.length === 0) {
      return false;
    }
  }

  if (prerequisites.requiresBands) {
    if (!versionData.data?.bands || versionData.data.bands.length === 0) {
      return false;
    }
  }

  if (prerequisites.requiresFormGroups) {
    if (!versionData.data?.form_groups || versionData.data.form_groups.length === 0) {
      return false;
    }
  }

  if (prerequisites.requiresDepartments) {
    if (!versionData.data?.departments || versionData.data.departments.length === 0) {
      return false;
    }
  }

  if (prerequisites.requiresCycle) {
    if (!versionData.cycle) {
      return false;
    }
  }

  // Check custom validator if provided
  if (prerequisites.customValidator) {
    return prerequisites.customValidator(context);
  }

  return true;
}

/**
 * Runs a single check
 */
function runCheck(check: CheckDefinition, context: ValidationContext) {
  try {
    return check.check(context);
  } catch (error) {
    console.error(`Error running check "${check.id}":`, error);
    return [];
  }
}

/**
 * Main validation engine
 * 
 * Runs all applicable checks in parallel and aggregates results
 */
export async function runValidation(context: ValidationContext): Promise<ValidationResult> {
  const allChecks = getActiveChecks();
  const checksToRun: CheckDefinition[] = [];
  const checksSkipped: string[] = [];

  // Filter checks based on prerequisites
  allChecks.forEach(check => {
    if (checkPrerequisites(check.prerequisites, context)) {
      checksToRun.push(check);
    } else {
      checksSkipped.push(check.id);
    }
  });

  // Run all applicable checks in parallel
  const checkPromises = checksToRun.map(check => 
    Promise.resolve(runCheck(check, context))
  );

  const checkResults = await Promise.all(checkPromises);

  // Aggregate all issues
  const allIssues = checkResults.flat();

  return {
    issues: allIssues,
    checksRun: checksToRun.map(c => c.id),
    checksSkipped,
    timestamp: Date.now(),
  };
}

/**
 * Synchronous version of runValidation for when async is not needed
 * (Since our current checks are all synchronous)
 */
export function runValidationSync(context: ValidationContext): ValidationResult {
  const allChecks = getActiveChecks();
  const checksToRun: CheckDefinition[] = [];
  const checksSkipped: string[] = [];

  // Filter checks based on prerequisites
  allChecks.forEach(check => {
    if (checkPrerequisites(check.prerequisites, context)) {
      checksToRun.push(check);
    } else {
      checksSkipped.push(check.id);
    }
  });

  // Run all applicable checks
  const allIssues = checksToRun.flatMap(check => runCheck(check, context));

  return {
    issues: allIssues,
    checksRun: checksToRun.map(c => c.id),
    checksSkipped,
    timestamp: Date.now(),
  };
}