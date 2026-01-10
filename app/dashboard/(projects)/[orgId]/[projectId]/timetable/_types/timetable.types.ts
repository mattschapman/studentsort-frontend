// app/dashboard/(projects)/[orgId]/[projectId]/timetable/_types/timetable.types.ts

export interface Period {
  id: string;
  dayId: string;
  dayTitle: string;
  lessonNumberWithinDay: number;
  type: 'Registration' | 'Lesson' | 'Break' | 'Lunch' | 'Twilight';
}

export interface FormGroupAvailability {
  formGroupId: string;
  formGroupName: string;
  bandId: string;
  bandTitle: string;
  yearGroup: number;
  occupiedPeriods: Record<string, {
    blockId: string;
    blockTitle: string;
    metaLessonId: string;
    colorScheme: string;
  }>;
}

export interface TeacherAvailability {
  teacherId: string;
  teacherName: string;
  teacherInitials: string;
  occupiedPeriods: Record<string, {
    lessonId: string;
    lessonTitle: string;
    subject: string;
    colorScheme: string;
  }>;
}

export interface PeriodAvailability {
  periodId: string;
  isAvailable: boolean;
  reasons?: {
    formGroupsOccupied?: boolean;
    teachersOccupied?: boolean;
  };
}