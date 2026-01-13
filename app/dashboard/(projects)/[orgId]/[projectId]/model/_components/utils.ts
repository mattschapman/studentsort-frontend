// app/dashboard/(projects)/[orgId]/[projectId]/model/_components/utils.ts

export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 8)}`;
}

export function generatePeriodBreakdowns(numPeriods: number): string[] {
  if (numPeriods < 1) return [];
  const options: string[] = [];
  const maxDoubles = Math.floor(numPeriods / 2);
  
  for (let doubles = 0; doubles <= maxDoubles; doubles++) {
    const singles = numPeriods - doubles * 2;
    const breakdown = 'D'.repeat(doubles) + 'S'.repeat(singles);
    options.push(breakdown);
  }
  
  return options;
}

export function getTailwindColorValue(colorScheme: string | null | undefined): string {
  if (!colorScheme) return '#f3f4f6';
  
  const colorMap: Record<string, string> = {
    'bg-red-100': '#fee2e2',
    'bg-red-200': '#fecaca',
    'bg-red-300': '#fca5a5',
    'bg-orange-100': '#ffedd5',
    'bg-orange-200': '#fed7aa',
    'bg-orange-300': '#fdba74',
    'bg-yellow-100': '#fef3c7',
    'bg-yellow-200': '#fde047',
    'bg-yellow-300': '#fde047',
    'bg-green-100': '#dcfce7',
    'bg-green-200': '#bbf7d0',
    'bg-green-300': '#86efac',
    'bg-blue-100': '#dbeafe',
    'bg-blue-200': '#bfdbfe',
    'bg-blue-300': '#93c5fd',
    'bg-purple-100': '#f3e8ff',
    'bg-purple-200': '#e9d5ff',
    'bg-purple-300': '#d8b4fe',
    'bg-pink-100': '#fce7f3',
    'bg-pink-200': '#fbcfe8',
    'bg-pink-300': '#f9a8d4',
    'bg-gray-100': '#f3f4f6',
    'bg-gray-200': '#e5e7eb',
    'bg-gray-300': '#d1d5db',
  };
  
  return colorMap[colorScheme] || '#dbeafe';
}

export function getSubjectAbbreviation(subjectId: string, subjects: Array<{ id: string; abbreviation: string }>): string {
  const subject = subjects.find(s => s.id === subjectId);
  return subject?.abbreviation || '';
}

export function createDefaultClass(teachingGroupTitle: string = ''): {
  id: string;
  title: string;
  subjectId: string;
  numPeriods: number;
  periodBreakdown: string;
} {
  return {
    id: generateId('cls'),
    title: teachingGroupTitle,
    subjectId: '',
    numPeriods: 0,
    periodBreakdown: ''
  };
}

export function createDefaultTeachingGroup(
  index: number,
  blockTitle: string
): {
  id: string;
  number: number;
  title: string;
  isExpanded: boolean;
  classes: Array<{
    id: string;
    title: string;
    subjectId: string;
    numPeriods: number;
    periodBreakdown: string;
  }>;
} {
  const title = blockTitle ? `${blockTitle}-${index}` : '';
  return {
    id: generateId('tg'),
    number: index,
    title,
    isExpanded: true,
    classes: [createDefaultClass(title)]
  };
}