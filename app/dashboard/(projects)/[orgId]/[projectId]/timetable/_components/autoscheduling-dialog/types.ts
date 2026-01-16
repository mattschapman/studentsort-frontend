// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_components/autoscheduling-dialog/types.ts

export interface FilterConfig {
  id: string;
  field: 'year-group' | 'subject';
  operator: 'is' | 'is-not';
  values: string[];
}

export interface AutoSchedulingStages {
  blocking: boolean;
  scheduling: boolean;
  staffing: boolean;
}

export type SolverType = 'g1-base' | 'h1-base';

export interface SolverConfig {
  type: SolverType;
  maxTimeSeconds: number;
  animate: boolean;
  animationSpeed: number;
}

export type AutoSchedulingConfig = {
  stages: AutoSchedulingStages;
  filters: FilterConfig[];
  ignoreFixedAssignments: boolean;
  solver: SolverConfig;
  timestamp: string;
};