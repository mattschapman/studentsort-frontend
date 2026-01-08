// app/dashboard/(projects)/[orgId]/[projectId]/cycle/_components/cycle-grid.tsx
'use client'

import React, { useState } from 'react';
import { ChevronDown, Plus, GripVertical, Copy, Trash2, Loader2 } from 'lucide-react';
import { useVersionData } from '@/lib/contexts/version-data-context';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Type definitions
type Week = {
  id: string;
  name: string;
  order: number;
};

type Day = {
  id: string;
  name: string;
  week_id: string;
  order: number;
};

type DayType = 'Registration' | 'Lesson' | 'Break' | 'Lunch' | 'Twilight';

type Period = {
  id: string;
  day_id: string;
  type: DayType;
  column: number;
};

type CycleData = {
  weeks: Week[];
  days: Day[];
  periods: Period[];
};

const typeColors: Record<DayType, string> = {
  Registration: 'bg-purple-200',
  Lesson: 'bg-green-200',
  Break: 'bg-pink-200',
  Lunch: 'bg-yellow-200',
  Twilight: 'bg-cyan-200'
};

export function CycleGrid() {
  const { versionData, isLoading, error, updateCycleData } = useVersionData();
  
  const [showAddWeekDialog, setShowAddWeekDialog] = useState(false);
  const [showAddDayDialog, setShowAddDayDialog] = useState(false);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [hoveredWeekId, setHoveredWeekId] = useState<string | null>(null);
  const [weekDropdownOpen, setWeekDropdownOpen] = useState<string | null>(null);
  const [dayDropdownOpen, setDayDropdownOpen] = useState<string | null>(null);

  // Form states
  const [newWeekName, setNewWeekName] = useState('');
  const [newDayName, setNewDayName] = useState('');
  const [newDayWeekId, setNewDayWeekId] = useState('');
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (!versionData) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No version data loaded</p>
      </div>
    );
  }

  const cycleData = versionData.cycle;

  // Helper function to create a day name from week and day
  const createDayName = (weekName: string, dayName: string): string => {
    return `${weekName}-${dayName}`;
  };

  // Helper function to create a period ID based on day and column
  const createPeriodId = (dayId: string, column: number): string => {
    return `${dayId}-${column}`;
  };

  // Smart increment logic
  const smartIncrement = (name: string): string => {
    // Day of week mappings
    const dayMappings: Record<string, string> = {
      'mon': 'tue', 'monday': 'tuesday',
      'tue': 'wed', 'tuesday': 'wednesday',
      'wed': 'thu', 'wednesday': 'thursday',
      'thu': 'fri', 'thursday': 'friday',
      'fri': 'sat', 'friday': 'saturday',
      'sat': 'sun', 'saturday': 'sunday',
      'sun': 'mon', 'sunday': 'monday'
    };

    const lowerName = name.toLowerCase();
    
    // Check for day of week
    if (dayMappings[lowerName]) {
      const nextDay = dayMappings[lowerName];
      // Preserve original casing
      if (name === name.toUpperCase()) return nextDay.toUpperCase();
      if (name[0] === name[0].toUpperCase()) {
        return nextDay.charAt(0).toUpperCase() + nextDay.slice(1);
      }
      return nextDay;
    }

    // Check if it ends with a number
    const numberMatch = name.match(/^(.*?)(\d+)$/);
    if (numberMatch) {
      const prefix = numberMatch[1];
      const number = parseInt(numberMatch[2]);
      return `${prefix}${number + 1}`;
    }

    // Check if it ends with a letter
    const letterMatch = name.match(/^(.*?)([A-Za-z])$/);
    if (letterMatch) {
      const prefix = letterMatch[1];
      const letter = letterMatch[2];
      const isUpperCase = letter === letter.toUpperCase();
      const charCode = letter.toLowerCase().charCodeAt(0);
      
      if (charCode === 122) { // 'z'
        return `${prefix}${isUpperCase ? 'AA' : 'aa'}`;
      } else {
        const nextChar = String.fromCharCode(charCode + 1);
        return `${prefix}${isUpperCase ? nextChar.toUpperCase() : nextChar}`;
      }
    }

    // Default: add (Copy)
    return `${name} (Copy)`;
  };

  // Get the next available column for a day
  const getNextAvailableColumn = (dayId: string): number | null => {
    const periodsForDay = cycleData.periods.filter(p => p.day_id === dayId);
    if (periodsForDay.length === 0) return 1;
    
    const occupiedColumns = new Set(periodsForDay.map(p => p.column));
    for (let col = 1; col <= 25; col++) {
      if (!occupiedColumns.has(col)) return col;
    }
    return null; // All columns occupied
  };

  // Quick add period from grid cell
  const handleQuickAddPeriod = (dayId: string, column: number, type: DayType) => {
    const newPeriod: Period = {
      id: createPeriodId(dayId, column),
      day_id: dayId,
      type: type,
      column: column
    };

    const newCycleData: CycleData = {
      ...cycleData,
      periods: [...cycleData.periods, newPeriod]
    };
    
    updateCycleData(newCycleData);
    setPopoverOpen(null);
  };

  // Update existing period type
  const handleUpdatePeriod = (periodId: string, newType: DayType) => {
    const newCycleData: CycleData = {
      ...cycleData,
      periods: cycleData.periods.map(p => 
        p.id === periodId ? { ...p, type: newType } : p
      )
    };
    
    updateCycleData(newCycleData);
    setPopoverOpen(null);
  };

  // Delete period from grid cell
  const handleDeletePeriod = (periodId: string) => {
    const newCycleData: CycleData = {
      ...cycleData,
      periods: cycleData.periods.filter(p => p.id !== periodId)
    };
    
    updateCycleData(newCycleData);
    setPopoverOpen(null);
  };

  // Organize data for grid display
  const getGridData = () => {
    const sortedWeeks = [...cycleData.weeks].sort((a, b) => a.order - b.order);
    const result: Array<{ 
      week: Week; 
      days: Array<{ day: Day; periods: Period[] }> 
    }> = [];

    sortedWeeks.forEach(week => {
      const weekDays = cycleData.days
        .filter(d => d.week_id === week.id)
        .sort((a, b) => a.order - b.order);
      
      const daysWithPeriods = weekDays.map(day => ({
        day,
        periods: cycleData.periods
          .filter(p => p.day_id === day.id)
          .sort((a, b) => a.column - b.column)
      }));

      result.push({ week, days: daysWithPeriods });
    });

    return result;
  };

  const handleDeleteDay = (dayId: string) => {
    const newCycleData: CycleData = {
      ...cycleData,
      days: cycleData.days.filter(d => d.id !== dayId),
      periods: cycleData.periods.filter(p => p.day_id !== dayId)
    };
    
    updateCycleData(newCycleData);
  };

  const handleDuplicateDay = (dayId: string) => {
    const dayToDuplicate = cycleData.days.find(d => d.id === dayId);
    if (!dayToDuplicate) return;

    const week = cycleData.weeks.find(w => w.id === dayToDuplicate.week_id);
    if (!week) return;

    const sameDayDays = cycleData.days.filter(d => d.week_id === dayToDuplicate.week_id);
    const newOrder = Math.max(...sameDayDays.map(d => d.order), 0) + 1;

    // Extract the day part from the current day name (after the hyphen)
    const dayPart = dayToDuplicate.name.includes('-') 
      ? dayToDuplicate.name.split('-')[1] 
      : dayToDuplicate.name;
    
    const newDayPart = smartIncrement(dayPart);
    const newDayName = createDayName(week.name, newDayPart);
    
    const newDay: Day = {
      id: newDayName,
      name: newDayName,
      week_id: dayToDuplicate.week_id,
      order: newOrder
    };

    const periodsForDay = cycleData.periods.filter(p => p.day_id === dayId);
    const newPeriods: Period[] = periodsForDay.map(p => ({
      ...p,
      id: createPeriodId(newDay.id, p.column),
      day_id: newDay.id
    }));

    const newCycleData: CycleData = {
      ...cycleData,
      days: [...cycleData.days, newDay],
      periods: [...cycleData.periods, ...newPeriods]
    };
    
    updateCycleData(newCycleData);
  };

  const handleDeleteWeek = (weekId: string) => {
    const daysInWeek = cycleData.days.filter(d => d.week_id === weekId);
    const dayIds = daysInWeek.map(d => d.id);
    
    const newCycleData: CycleData = {
      ...cycleData,
      weeks: cycleData.weeks.filter(w => w.id !== weekId),
      days: cycleData.days.filter(d => d.week_id !== weekId),
      periods: cycleData.periods.filter(p => !dayIds.includes(p.day_id))
    };
    
    updateCycleData(newCycleData);
  };

  const handleDuplicateWeek = (weekId: string) => {
    const weekToDuplicate = cycleData.weeks.find(w => w.id === weekId);
    if (!weekToDuplicate) return;

    const newOrder = Math.max(...cycleData.weeks.map(w => w.order), 0) + 1;
    const newWeekName = smartIncrement(weekToDuplicate.name);
    const newWeek: Week = {
      id: newWeekName,
      name: newWeekName,
      order: newOrder
    };

    const daysInWeek = cycleData.days.filter(d => d.week_id === weekId);
    const newDays: Day[] = daysInWeek.map(d => {
      // Extract the day part from the current day name (after the hyphen)
      const dayPart = d.name.includes('-') ? d.name.split('-')[1] : d.name;
      const newDayName = createDayName(newWeek.name, dayPart);
      
      return {
        ...d,
        id: newDayName,
        name: newDayName,
        week_id: newWeek.id
      };
    });

    const newPeriods: Period[] = [];
    daysInWeek.forEach((oldDay) => {
      const periodsForDay = cycleData.periods.filter(p => p.day_id === oldDay.id);
      const newDay = newDays.find(nd => {
        const oldDayPart = oldDay.name.includes('-') ? oldDay.name.split('-')[1] : oldDay.name;
        const newDayPart = nd.name.includes('-') ? nd.name.split('-')[1] : nd.name;
        return newDayPart === oldDayPart;
      });
      
      if (newDay) {
        periodsForDay.forEach(p => {
          newPeriods.push({
            ...p,
            id: createPeriodId(newDay.id, p.column),
            day_id: newDay.id
          });
        });
      }
    });

    const newCycleData: CycleData = {
      ...cycleData,
      weeks: [...cycleData.weeks, newWeek],
      days: [...cycleData.days, ...newDays],
      periods: [...cycleData.periods, ...newPeriods]
    };
    
    updateCycleData(newCycleData);
  };

  const handleAddWeek = () => {
    if (!newWeekName.trim()) return;

    const weekId = newWeekName.trim();
    
    // Check if week with this ID already exists
    if (cycleData.weeks.find(w => w.id === weekId)) {
      alert('A week with this name already exists');
      return;
    }

    const newWeek: Week = {
      id: weekId,
      name: newWeekName.trim(),
      order: cycleData.weeks.length + 1
    };

    const newCycleData: CycleData = {
      ...cycleData,
      weeks: [...cycleData.weeks, newWeek]
    };
    
    updateCycleData(newCycleData);
    setNewWeekName('');
    setShowAddWeekDialog(false);
  };

  const handleAddDay = () => {
    if (!newDayName.trim() || !newDayWeekId) return;

    const week = cycleData.weeks.find(w => w.id === newDayWeekId);
    if (!week) return;

    const fullDayName = createDayName(week.name, newDayName.trim());
    const dayId = fullDayName;
    
    // Check if day with this ID already exists
    if (cycleData.days.find(d => d.id === dayId)) {
      alert('A day with this name already exists in this week');
      return;
    }

    const weekDays = cycleData.days.filter(d => d.week_id === newDayWeekId);
    const newOrder = weekDays.length + 1;

    const newDay: Day = {
      id: dayId,
      name: fullDayName,
      week_id: newDayWeekId,
      order: newOrder
    };

    const newCycleData: CycleData = {
      ...cycleData,
      days: [...cycleData.days, newDay]
    };
    
    updateCycleData(newCycleData);
    setNewDayName('');
    setNewDayWeekId('');
    setShowAddDayDialog(false);
  };

  const gridData = getGridData();
  const columns = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Fixed Toolbar */}
      <div className="w-full bg-white border-b min-h-12 flex justify-between items-center px-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="xs" variant="default" className="text-xs">
              New
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowAddWeekDialog(true)}>
              Week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAddDayDialog(true)}>
              Day
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Scrollable Grid Container */}
      <div className="w-full overflow-x-auto flex-1">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-t-0 border-l-0 px-4 text-left font-semibold bg-gray-50 min-w-20">Week</th>
              <th className="border border-t-0 px-4 text-left font-semibold bg-gray-50 min-w-30">Day</th>
              {columns.map(col => (
                <th key={col} className="border border-t-0 px-1 py-2 text-center text-xs font-medium w-11 min-w-11 max-w-11">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.map(({ week, days }) => (
              <React.Fragment key={week.id}>
                {days.length > 0 ? (
                  days.map((dayData, dayIndex) => (
                    <tr 
                      key={dayData.day.id} 
                      className="hover:bg-gray-50"
                    >
                      {dayIndex === 0 && (
                        <td
                          rowSpan={days.length}
                          className="border border-l-0 px-4 font-medium bg-gray-50 align-center relative group/week"
                          onMouseEnter={() => setHoveredWeekId(week.id)}
                          onMouseLeave={() => setHoveredWeekId(null)}
                        >
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                            <DropdownMenu onOpenChange={(open) => setWeekDropdownOpen(open ? week.id : null)}>
                              <DropdownMenuTrigger asChild>
                                <button className={`w-3 h-6 flex items-center justify-center hover:bg-gray-200 rounded bg-white border border-gray-300 transition-opacity shadow-sm ${hoveredWeekId === week.id || weekDropdownOpen === week.id ? 'opacity-100' : 'opacity-0'}`}>
                                  <GripVertical className={`w-4 h-4 text-gray-500 ${weekDropdownOpen === week.id ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`} />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem onClick={() => handleDuplicateWeek(week.id)} className="text-xs">
                                  <Copy className="size-3 mr-1.5" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDeleteWeek(week.id)}
                                  className="text-red-600 text-xs"
                                >
                                  <Trash2 className="text-red-600 size-3 mr-1.5" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {week.name}
                        </td>
                      )}
                      <td 
                        className="border px-4 bg-white hover:bg-gray-50 align-center relative group/day"
                        onMouseEnter={() => setHoveredRowId(dayData.day.id)}
                        onMouseLeave={() => setHoveredRowId(null)}
                      >
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                          <DropdownMenu onOpenChange={(open) => setDayDropdownOpen(open ? dayData.day.id : null)}>
                            <DropdownMenuTrigger asChild>
                              <button className={`w-3 h-6 flex items-center justify-center hover:bg-gray-200 rounded bg-white border border-gray-300 transition-opacity shadow-sm ${hoveredRowId === dayData.day.id || dayDropdownOpen === dayData.day.id ? 'opacity-100' : 'opacity-0'}`}>
                                <GripVertical className={`w-4 h-4 text-gray-500 ${dayDropdownOpen === dayData.day.id ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={() => handleDuplicateDay(dayData.day.id)} className="text-xs">
                                <Copy className="size-3 mr-1.5" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteDay(dayData.day.id)}
                                className="text-red-600 text-xs"
                              >
                                <Trash2 className="text-red-600 size-3 mr-1.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {dayData.day.name}
                      </td>
                      {columns.map(col => {
                        const period = dayData.periods.find(p => p.column === col);
                        const nextAvailable = getNextAvailableColumn(dayData.day.id);
                        const isNextAvailable = !period && col === nextAvailable;
                        
                        if (period) {
                          // Cell has a period - show colored cell that's clickable
                          return (
                            <td key={col} className={`border p-0 ${typeColors[period.type]} hover:brightness-105`}>
                              <Popover 
                                open={popoverOpen === `${dayData.day.id}-${col}`}
                                onOpenChange={(open) => setPopoverOpen(open ? `${dayData.day.id}-${col}` : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button className="w-full h-7 hover:opacity-80 transition-opacity">
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1">
                                  <div className="space-y-1">
                                    {(['Registration', 'Lesson', 'Break', 'Lunch', 'Twilight'] as DayType[]).map(type => (
                                      <button
                                        key={type}
                                        onClick={() => handleUpdatePeriod(period.id, type)}
                                        className={`w-full px-3 py-2 text-left text-xs rounded transition-colors ${typeColors[type]} ${period.type === type ? 'ring-2 ring-gray-900' : 'hover:opacity-80'}`}
                                      >
                                        {type}
                                      </button>
                                    ))}
                                    <div className="border-t my-1"></div>
                                    <button
                                      onClick={() => handleDeletePeriod(period.id)}
                                      className="w-full px-3 py-2 flex items-center gap-2 text-left text-xs rounded hover:bg-red-100 text-red-600 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 inline mr-2" />
                                      Clear
                                    </button>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </td>
                          );
                        } else if (isNextAvailable) {
                          // This is the next available cell - make it clickable
                          return (
                            <td key={col} className="border p-0">
                              <Popover 
                                open={popoverOpen === `${dayData.day.id}-${col}`}
                                onOpenChange={(open) => setPopoverOpen(open ? `${dayData.day.id}-${col}` : null)}
                              >
                                <PopoverTrigger asChild>
                                  <button className="w-full h-7 hover:bg-gray-100 transition-colors">
                                    <Plus className="size-3 mx-auto text-gray-400" />
                                  </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48 p-1">
                                  <div className="space-y-1">
                                    {(['Registration', 'Lesson', 'Break', 'Lunch', 'Twilight'] as DayType[]).map(type => (
                                      <button
                                        key={type}
                                        onClick={() => handleQuickAddPeriod(dayData.day.id, col, type)}
                                        className={`w-full px-3 py-2 text-left text-xs rounded hover:opacity-80 transition-colors ${typeColors[type]}`}
                                      >
                                        {type}
                                      </button>
                                    ))}
                                  </div>
                                </PopoverContent>
                              </Popover>
                            </td>
                          );
                        } else {
                          // Empty cell that's not next available
                          return (
                            <td key={col} className="border">
                              <div className="h-7"></div>
                            </td>
                          );
                        }
                      })}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      className="border border-l-0 px-4 font-medium bg-gray-50 relative group/week"
                      onMouseEnter={() => setHoveredWeekId(week.id)}
                      onMouseLeave={() => setHoveredWeekId(null)}
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
                        <DropdownMenu onOpenChange={(open) => setWeekDropdownOpen(open ? week.id : null)}>
                          <DropdownMenuTrigger asChild>
                            <button className={`w-3 h-6 flex items-center justify-center hover:bg-gray-200 rounded bg-white border border-gray-300 transition-opacity shadow-sm ${hoveredWeekId === week.id || weekDropdownOpen === week.id ? 'opacity-100' : 'opacity-0'}`}>
                              <GripVertical className={`w-4 h-4 text-gray-500 ${weekDropdownOpen === week.id ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem onClick={() => handleDuplicateWeek(week.id)} className="text-xs">
                              <Copy className="size-3 mr-1.5" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteWeek(week.id)}
                              className="text-red-600 text-xs"
                            >
                              <Trash2 className="text-red-600 size-3 mr-1.5" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {week.name}
                    </td>
                    <td colSpan={31} className="border px-4 text-center text-gray-400 text-xs py-2">
                      No days added to this week yet
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {gridData.length === 0 && (
              <tr>
                <td colSpan={32} className="border border-l-0 border-r-0 px-4 py-8 text-center text-gray-500">
                  No weeks added yet. Click "New" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Week Dialog */}
      <Dialog open={showAddWeekDialog} onOpenChange={setShowAddWeekDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Week</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="week-name">Week Name</Label>
              <Input
                id="week-name"
                value={newWeekName}
                onChange={(e) => setNewWeekName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddWeek()}
                placeholder="e.g., A"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddWeekDialog(false);
                setNewWeekName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddWeek}
              disabled={!newWeekName.trim()}
            >
              Add Week
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Day Dialog */}
      <Dialog open={showAddDayDialog} onOpenChange={setShowAddDayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Day</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="day-week-select">Week *</Label>
              <Select value={newDayWeekId} onValueChange={setNewDayWeekId}>
                <SelectTrigger id="day-week-select" className="w-full">
                  <SelectValue placeholder="Select a week" />
                </SelectTrigger>
                <SelectContent>
                  {cycleData.weeks.sort((a, b) => a.order - b.order).map(week => (
                    <SelectItem key={week.id} value={week.id}>
                      {week.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day-name">Day Name *</Label>
              <Input
                id="day-name"
                value={newDayName}
                onChange={(e) => setNewDayName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && newDayWeekId && handleAddDay()}
                placeholder="e.g., Mon"
                autoFocus
              />
              {newDayWeekId && newDayName && (
                <p className="text-xs text-muted-foreground">
                  Will be created as: {createDayName(cycleData.weeks.find(w => w.id === newDayWeekId)?.name || '', newDayName)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDayDialog(false);
                setNewDayName('');
                setNewDayWeekId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDay}
              disabled={!newDayName.trim() || !newDayWeekId}
            >
              Add Day
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}