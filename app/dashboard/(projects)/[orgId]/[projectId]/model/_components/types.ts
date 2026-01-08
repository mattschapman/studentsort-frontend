// app/dashboard/(projects)/[orgId]/[projectId]/model/types.ts

export interface Block {
  id: string;
  title: string;
  total_periods: number;
  period_breakdown: string;
  feeder_form_groups: string[];
  year_group: number;
  start_col?: number;
  start_row?: number;
  end_row?: number;
  color_scheme?: string;
  meta_lessons: MetaLesson[];
  teaching_groups: TeachingGroup[];
}

export interface MetaLesson {
  id: string;
  length: number;
  meta_periods: MetaPeriod[];
}

export interface MetaPeriod {
  id: string;
  length: number;
  start_period_id: string;
}

export interface TeachingGroup {
  number: number;
  classes: Class[];
}

export interface Class {
  subject: string;
  id: string;
  total_periods: number;
  period_breakdown: string;
  lessons: Lesson[];
}

export interface Lesson {
  number: number;
  id: string;
  length: number;
  teacher: Teacher[];
  meta_period_id: string;
}

export interface Teacher {
  id: string;
  constraint_type: string;
}

// Form data types for the dialog
export interface TeachingGroupFormData {
  id: string;
  number: number;
  title: string;
  isExpanded: boolean;
  classes: ClassFormData[];
}

export interface ClassFormData {
  id: string;
  title: string;
  subjectId: string;
  numPeriods: number;
  periodBreakdown: string;
}

export interface BlockFormData {
  yearGroup: string;
  title: string;
  teachingPeriods: string;
  periodBreakdown: string;
  colorScheme: string;
  startCol: string;
  startRow: string;
  endRow: string;
  selectedFormGroups: string[];
  teachingGroups: TeachingGroupFormData[];
  lessonMappings: Record<string, string>;
}