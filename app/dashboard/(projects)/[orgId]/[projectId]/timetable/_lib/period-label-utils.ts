// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_lib/period-label-utils.ts

import type { Period } from '../_types/timetable.types';

/**
 * Get day abbreviation from day title (two letters)
 */
export function getDayAbbreviation(dayTitle: string): string {
  const lower = dayTitle.toLowerCase();
  if (lower.includes("monday") || lower === "mon") return "Mo";
  if (lower.includes("tuesday") || lower === "tue") return "Tu";
  if (lower.includes("wednesday") || lower === "wed") return "We";
  if (lower.includes("thursday") || lower === "thu") return "Th";
  if (lower.includes("friday") || lower === "fri") return "Fr";
  if (lower.includes("saturday") || lower === "sat") return "Sa";
  if (lower.includes("sunday") || lower === "sun") return "Su";
  return "??";
}

/**
 * Get period type abbreviation
 */
function getPeriodTypeAbbreviation(type: string): string {
  switch (type) {
    case 'Registration':
      return 'R';
    case 'Break':
      return 'B';
    case 'Lunch':
      return 'L';
    case 'Twilight':
      return 'T';
    default:
      return '?';
  }
}

/**
 * Get the label for a period column header
 * Returns day abbreviation for first period in day, otherwise returns type-specific label
 */
export function getPeriodLabel(period: Period, periods: Period[], index: number): string {
  const prevPeriod = index > 0 ? periods[index - 1] : null;
  const isFirstInDay = !prevPeriod || prevPeriod.dayId !== period.dayId;
  
  // First period in day
  if (isFirstInDay) {
    const dayAbbr = getDayAbbreviation(period.dayTitle);
    
    // If it's NOT a lesson, concat day + period type abbreviation
    if (period.type !== 'Lesson') {
      const typeAbbr = getPeriodTypeAbbreviation(period.type);
      return `${dayAbbr}${typeAbbr}`;
    }
    
    // Otherwise just show day abbreviation
    return dayAbbr;
  }
  
  // For subsequent periods, get the count of this type within the current day
  const periodsInDaySoFar = periods.filter((p, i) => 
    p.dayId === period.dayId && i <= index
  );
  const countOfType = periodsInDaySoFar.filter(p => p.type === period.type).length;
  
  // Generate label based on period type
  switch (period.type) {
    case 'Lesson':
      return period.lessonNumberWithinDay.toString();
    case 'Registration':
      return countOfType > 1 ? `R${countOfType}` : 'R';
    case 'Break':
      return countOfType > 1 ? `B${countOfType}` : 'B';
    case 'Lunch':
      return countOfType > 1 ? `L${countOfType}` : 'L';
    case 'Twilight':
      return countOfType > 1 ? `T${countOfType}` : 'T';
    default:
      return '?';
  }
}

/**
 * Filter periods based on selected period types
 */
export function filterPeriodsByType(
  periods: Period[],
  showPeriodTypes: Record<string, boolean>
): Period[] {
  return periods.filter(period => showPeriodTypes[period.type] !== false);
}