// lib/validation/types.ts

export type IssueType = "error" | "warning" | "info";
export type IssueSeverity = "critical" | "high" | "medium" | "low";

export interface IssueAction {
  label: string;
  path: string; // Next.js route to navigate to
}

export interface IssueMetadata {
  affectedEntities?: {
    blockIds?: string[];
    teacherIds?: string[];
    subjectIds?: string[];
    yearGroupIds?: string[];
    [key: string]: string[] | undefined;
  };
  suggestedFix?: string;
  [key: string]: any;
}

export interface Issue {
  id: string;
  type: IssueType;
  severity: IssueSeverity;
  title: string;
  description: string;
  details: string;
  recommendation: string;
  action?: IssueAction;
  metadata?: IssueMetadata;
  checkId: string; // Which check generated this issue
  timestamp: number;
}

// Represents the data available at any point in the timetabling process
export interface ValidationContext {
  versionData: any; // VersionJsonData from version-data-context
  orgId?: string;
  projectId?: string;
  versionId?: string;
}

// Defines when a check should run
export interface CheckPrerequisites {
  requiresBlocks?: boolean;
  requiresTeachers?: boolean;
  requiresSubjects?: boolean;
  requiresYearGroups?: boolean;
  requiresBands?: boolean;
  requiresFormGroups?: boolean;
  requiresDepartments?: boolean;
  requiresCycle?: boolean;
  // Can add custom validators
  customValidator?: (context: ValidationContext) => boolean;
}

// A check function that validates data and returns issues
export type CheckFunction = (context: ValidationContext) => Issue[];

// Full definition of a validation check
export interface CheckDefinition {
  id: string;
  name: string;
  description: string;
  category: 'data' | 'model' | 'staffing' | 'scheduling';
  prerequisites: CheckPrerequisites;
  check: CheckFunction;
}

// Result from running the validation engine
export interface ValidationResult {
  issues: Issue[];
  checksRun: string[];
  checksSkipped: string[];
  timestamp: number;
}