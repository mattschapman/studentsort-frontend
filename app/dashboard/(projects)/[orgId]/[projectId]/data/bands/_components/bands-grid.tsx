// app/dashboard/(projects)/[orgId]/[projectId]/data/bands/_components/bands-grid.tsx
'use client'

import React, { useState } from 'react';
import { GripVertical, Copy, Trash2, Loader2, Edit, Plus, ChevronDown } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Type definitions
type YearGroup = {
  id: string;
  name: string;
  order: number;
};

type Band = {
  id: string;
  name: string;
  year_group_id: string;
  order: number;
};

type FormGroup = {
  id: string;
  name: string;
  band_id: string;
  column: number;
};

const typeColors = {
  default: 'bg-blue-100'
};

export function BandsGrid() {
  const { versionData, isLoading, error, updateBandsData } = useVersionData();
  
  const [hoveredYearGroupId, setHoveredYearGroupId] = useState<string | null>(null);
  const [hoveredBandId, setHoveredBandId] = useState<string | null>(null);
  const [yearGroupDropdownOpen, setYearGroupDropdownOpen] = useState<string | null>(null);
  const [bandDropdownOpen, setBandDropdownOpen] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState<string | null>(null);
  
  // Dialog states
  const [showRenameBandDialog, setShowRenameBandDialog] = useState(false);
  const [renameBandId, setRenameBandId] = useState<string | null>(null);
  const [renameBandValue, setRenameBandValue] = useState('');

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

  const yearGroups = versionData.data.year_groups || [];
  const bands = versionData.data.bands || [];
  const formGroups = versionData.data.form_groups || [];

  // Smart increment for band letters
  const incrementBandLetter = (name: string): string => {
    const match = name.match(/^(\d+)([A-Z]+)$/);
    if (!match) return `${name}X`;
    
    const yearPart = match[1];
    const letterPart = match[2];
    
    if (letterPart.length === 1) {
      const charCode = letterPart.charCodeAt(0);
      if (charCode === 90) {
        return `${yearPart}AA`;
      } else {
        return `${yearPart}${String.fromCharCode(charCode + 1)}`;
      }
    }
    
    let letters = letterPart.split('');
    let carry = true;
    
    for (let i = letters.length - 1; i >= 0 && carry; i--) {
      if (letters[i] === 'Z') {
        letters[i] = 'A';
      } else {
        letters[i] = String.fromCharCode(letters[i].charCodeAt(0) + 1);
        carry = false;
      }
    }
    
    if (carry) {
      letters.unshift('A');
    }
    
    return `${yearPart}${letters.join('')}`;
  };

  // Generate form group name
  const generateFormGroupName = (bandName: string, column: number): string => {
    return `${bandName}${column}`;
  };

  // Get next year group number
  const getNextYearGroupNumber = (): number => {
    if (yearGroups.length === 0) return 7;
    const numbers = yearGroups.map(yg => parseInt(yg.name));
    return Math.max(...numbers) + 1;
  };

  // Get next available column for a band
  const getNextAvailableColumn = (bandId: string): number | null => {
    const bandFormGroups = formGroups.filter(fg => fg.band_id === bandId);
    
    if (bandFormGroups.length === 0) return 1;
    
    const occupiedColumns = new Set(bandFormGroups.map(fg => fg.column));
    for (let col = 1; col <= 20; col++) {
      if (!occupiedColumns.has(col)) return col;
    }
    return null;
  };

  // Quick add form group from grid cell
  const handleQuickAddFormGroup = (bandId: string, column: number) => {
    const band = bands.find(b => b.id === bandId);
    if (!band) return;

    const formGroupName = generateFormGroupName(band.name, column);
    const newFormGroup: FormGroup = {
      id: formGroupName,
      name: formGroupName,
      band_id: bandId,
      column
    };

    updateBandsData(yearGroups, bands, [...formGroups, newFormGroup]);
    setPopoverOpen(null);
  };

  // Delete form group from grid cell
  const handleDeleteFormGroup = (formGroupId: string) => {
    updateBandsData(
      yearGroups, 
      bands, 
      formGroups.filter(fg => fg.id !== formGroupId)
    );
    setPopoverOpen(null);
  };

  // Add year group
  const handleAddYearGroup = () => {
    const nextNumber = getNextYearGroupNumber();
    const yearGroupId = `${nextNumber}`;
    
    const newYearGroup: YearGroup = {
      id: yearGroupId,
      name: `${nextNumber}`,
      order: yearGroups.length + 1
    };

    const defaultBandId = `${nextNumber}X`;
    const defaultBand: Band = {
      id: defaultBandId,
      name: `${nextNumber}X`,
      year_group_id: yearGroupId,
      order: 1
    };

    updateBandsData(
      [...yearGroups, newYearGroup],
      [...bands, defaultBand],
      formGroups
    );
  };

  // Add band to year group
  const handleAddBand = (yearGroupId: string) => {
    const yearGroup = yearGroups.find(yg => yg.id === yearGroupId);
    if (!yearGroup) return;

    const yearGroupBands = bands.filter(b => b.year_group_id === yearGroupId);
    const newOrder = yearGroupBands.length + 1;
    
    const lastBand = yearGroupBands.sort((a, b) => b.order - a.order)[0];
    const newBandName = lastBand 
      ? incrementBandLetter(lastBand.name)
      : `${yearGroup.name}X`;

    const newBand: Band = {
      id: newBandName,
      name: newBandName,
      year_group_id: yearGroupId,
      order: newOrder
    };

    updateBandsData(yearGroups, [...bands, newBand], formGroups);
  };

  // Duplicate year group
  const handleDuplicateYearGroup = (yearGroupId: string) => {
    const yearGroupToDuplicate = yearGroups.find(yg => yg.id === yearGroupId);
    if (!yearGroupToDuplicate) return;

    const nextNumber = getNextYearGroupNumber();
    const newYearGroupId = `${nextNumber}`;
    
    const newYearGroup: YearGroup = {
      id: newYearGroupId,
      name: `${nextNumber}`,
      order: yearGroups.length + 1
    };

    const yearGroupBands = bands.filter(b => b.year_group_id === yearGroupId);
    const newBands: Band[] = yearGroupBands.map(band => {
      const letterPart = band.name.replace(yearGroupToDuplicate.name, '');
      const newBandName = `${nextNumber}${letterPart}`;
      
      return {
        ...band,
        id: newBandName,
        name: newBandName,
        year_group_id: newYearGroupId
      };
    });

    const newFormGroups: FormGroup[] = [];
    yearGroupBands.forEach(band => {
      const bandFormGroups = formGroups.filter(fg => fg.band_id === band.id);
      const newBand = newBands.find(nb => {
        const oldLetterPart = band.name.replace(yearGroupToDuplicate.name, '');
        const newLetterPart = nb.name.replace(`${nextNumber}`, '');
        return oldLetterPart === newLetterPart;
      });
      
      if (newBand) {
        bandFormGroups.forEach(fg => {
          const newFormGroupName = generateFormGroupName(newBand.name, fg.column);
          newFormGroups.push({
            id: newFormGroupName,
            name: newFormGroupName,
            band_id: newBand.id,
            column: fg.column
          });
        });
      }
    });

    updateBandsData(
      [...yearGroups, newYearGroup],
      [...bands, ...newBands],
      [...formGroups, ...newFormGroups]
    );
  };

  // Delete year group
  const handleDeleteYearGroup = (yearGroupId: string) => {
    const yearGroupBands = bands.filter(b => b.year_group_id === yearGroupId);
    const bandIds = yearGroupBands.map(b => b.id);
    
    updateBandsData(
      yearGroups.filter(yg => yg.id !== yearGroupId),
      bands.filter(b => b.year_group_id !== yearGroupId),
      formGroups.filter(fg => !bandIds.includes(fg.band_id))
    );
  };

  // Duplicate band
  const handleDuplicateBand = (bandId: string) => {
    const bandToDuplicate = bands.find(b => b.id === bandId);
    if (!bandToDuplicate) return;
    
    const yearGroupBands = bands.filter(b => b.year_group_id === bandToDuplicate.year_group_id);
    const newOrder = Math.max(...yearGroupBands.map(b => b.order)) + 1;
    const newBandName = incrementBandLetter(bandToDuplicate.name);
    
    const newBand: Band = {
      id: newBandName,
      name: newBandName,
      year_group_id: bandToDuplicate.year_group_id,
      order: newOrder
    };
    
    const bandFormGroups = formGroups.filter(fg => fg.band_id === bandId);
    const newFormGroups: FormGroup[] = bandFormGroups.map(fg => {
      const newFormGroupName = generateFormGroupName(newBandName, fg.column);
      return {
        id: newFormGroupName,
        name: newFormGroupName,
        band_id: newBand.id,
        column: fg.column
      };
    });

    updateBandsData(
      yearGroups,
      [...bands, newBand],
      [...formGroups, ...newFormGroups]
    );
  };

  // Delete band
  const handleDeleteBand = (bandId: string) => {
    updateBandsData(
      yearGroups,
      bands.filter(b => b.id !== bandId),
      formGroups.filter(fg => fg.band_id !== bandId)
    );
  };

  // Open rename band dialog
  const openRenameBandDialog = (bandId: string) => {
    const band = bands.find(b => b.id === bandId);
    if (!band) return;
    
    setRenameBandId(bandId);
    setRenameBandValue(band.name);
    setShowRenameBandDialog(true);
  };

  // Rename band (and cascade to form groups)
  const handleRenameBand = () => {
    if (!renameBandId || !renameBandValue.trim()) return;
    
    const newBandName = renameBandValue.trim();
    const newBandId = newBandName;

    const updatedBands = bands.map(band => {
      if (band.id !== renameBandId) return band;
      return {
        ...band,
        id: newBandId,
        name: newBandName
      };
    });

    const updatedFormGroups = formGroups.map(fg => {
      if (fg.band_id !== renameBandId) return fg;
      const newFormGroupName = generateFormGroupName(newBandName, fg.column);
      return {
        ...fg,
        id: newFormGroupName,
        name: newFormGroupName,
        band_id: newBandId
      };
    });

    updateBandsData(yearGroups, updatedBands, updatedFormGroups);

    setShowRenameBandDialog(false);
    setRenameBandId(null);
    setRenameBandValue('');
  };

  // Organize data for grid display
  const getGridData = () => {
    return yearGroups
      .sort((a, b) => a.order - b.order)
      .map(yearGroup => ({
        yearGroup,
        bands: bands
          .filter(b => b.year_group_id === yearGroup.id)
          .sort((a, b) => a.order - b.order)
      }));
  };

  const gridData = getGridData();
  const columns = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <div className="bg-gray-50">
      <div className="bg-white border-b min-h-12 flex justify-between items-center px-4">
        <Button
          onClick={handleAddYearGroup}
          variant="default"
          size="xs"
          className="text-xs"
        >
          <Plus className="size-3" />
          New Year Group
        </Button>
      </div>

      {/* Grid */}
      <div className="overflow-auto bg-white">
        <table className="text-xs w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-t-0 border-l-0 px-4 py-2 text-left font-semibold w-24 sticky left-0 bg-gray-50 z-10 whitespace-nowrap">
                Year Group
              </th>
              <th className="border border-t-0 px-4 py-2 text-left font-semibold w-24 sticky left-24 bg-gray-50 z-10">
                Band
              </th>
              {columns.map(col => (
                <th key={col} className="border border-t-0 px-2 py-2 text-center text-xs font-medium w-12">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gridData.map(({ yearGroup, bands: yearGroupBands }) => (
              <React.Fragment key={yearGroup.id}>
                {yearGroupBands.length > 0 ? (
                  yearGroupBands.map((band, bandIndex) => {
                    const bandFormGroups = formGroups.filter(fg => fg.band_id === band.id);
                    
                    return (
                      <tr key={band.id} className="hover:bg-gray-50">
                        {bandIndex === 0 && (
                          <td
                            rowSpan={yearGroupBands.length}
                            className="border border-l-0 px-4 py-2 font-medium bg-gray-50 align-center sticky left-0 z-10 group/yeargroup"
                            onMouseEnter={() => setHoveredYearGroupId(yearGroup.id)}
                            onMouseLeave={() => setHoveredYearGroupId(null)}
                          >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-50">
                              <DropdownMenu
                                onOpenChange={(open) =>
                                  setYearGroupDropdownOpen(open ? yearGroup.id : null)
                                }
                              >
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className={`w-3 h-6 flex items-center justify-center hover:bg-gray-200 rounded bg-white border border-gray-300 transition-opacity shadow-sm ${
                                      hoveredYearGroupId === yearGroup.id ||
                                      yearGroupDropdownOpen === yearGroup.id
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    }`}
                                  >
                                    <GripVertical className="w-4 h-4 text-gray-500" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem
                                    onClick={() => handleDuplicateYearGroup(yearGroup.id)}
                                  >
                                    <Copy className="w-4 h-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleAddBand(yearGroup.id)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Band
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteYearGroup(yearGroup.id)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            {yearGroup.name}
                          </td>
                        )}
                        <td
                          className="border px-4 py-2 sticky left-24 bg-white hover:bg-gray-50 z-10 align-center group/band"
                          onMouseEnter={() => setHoveredBandId(band.id)}
                          onMouseLeave={() => setHoveredBandId(null)}
                        >
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-50">
                            <DropdownMenu
                              onOpenChange={(open) =>
                                setBandDropdownOpen(open ? band.id : null)
                              }
                            >
                              <DropdownMenuTrigger asChild>
                                <button
                                  className={`w-3 h-6 flex items-center justify-center hover:bg-gray-200 rounded bg-white border border-gray-300 transition-opacity shadow-sm ${
                                    hoveredBandId === band.id ||
                                    bandDropdownOpen === band.id
                                      ? 'opacity-100'
                                      : 'opacity-0'
                                  }`}
                                >
                                  <GripVertical className="w-4 h-4 text-gray-500" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="start">
                                <DropdownMenuItem
                                  onClick={() => openRenameBandDialog(band.id)}
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDuplicateBand(band.id)}
                                >
                                  <Copy className="w-4 h-4 mr-2" />
                                  Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleDeleteBand(band.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {band.name}
                        </td>
                        {columns.map(col => {
                          const formGroup = bandFormGroups.find(fg => fg.column === col);
                          const nextAvailable = getNextAvailableColumn(band.id);
                          const isNextAvailable = !formGroup && col === nextAvailable;
                          
                          if (formGroup) {
                            // Cell has a form group - show it with delete option
                            return (
                              <td key={col} className="border p-0 hover:bg-blue-100">
                                <Popover 
                                  open={popoverOpen === `${band.id}-${col}`}
                                  onOpenChange={(open) => setPopoverOpen(open ? `${band.id}-${col}` : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <button className="w-full h-10 px-2 text-xs text-center hover:opacity-80 transition-opacity">
                                      {formGroup.name}
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-1">
                                    <button
                                      onClick={() => handleDeleteFormGroup(formGroup.id)}
                                      className="w-full px-3 py-2 flex items-center gap-2 text-left text-xs rounded hover:bg-red-100 text-red-600 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      Delete
                                    </button>
                                  </PopoverContent>
                                </Popover>
                              </td>
                            );
                          } else if (isNextAvailable) {
                            // This is the next available cell - make it clickable
                            return (
                              <td key={col} className="border p-0">
                                <button 
                                  onClick={() => handleQuickAddFormGroup(band.id, col)}
                                  className="w-full h-10 hover:bg-gray-100 transition-colors"
                                >
                                  <Plus className="size-3 mx-auto text-gray-400" />
                                </button>
                              </td>
                            );
                          } else {
                            // Empty cell that's not next available
                            return (
                              <td key={col} className="border">
                                <div className="h-10"></div>
                              </td>
                            );
                          }
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      className="border border-l-0 px-4 py-2 font-medium bg-gray-50 sticky left-0 z-10 group/yeargroup"
                      onMouseEnter={() => setHoveredYearGroupId(yearGroup.id)}
                      onMouseLeave={() => setHoveredYearGroupId(null)}
                    >
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-50">
                        <DropdownMenu
                          onOpenChange={(open) =>
                            setYearGroupDropdownOpen(open ? yearGroup.id : null)
                          }
                        >
                          <DropdownMenuTrigger asChild>
                            <button
                              className={`w-3 h-6 flex items-center justify-center hover:bg-gray-200 rounded bg-white border border-gray-300 transition-opacity shadow-sm ${
                                hoveredYearGroupId === yearGroup.id ||
                                yearGroupDropdownOpen === yearGroup.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              }`}
                            >
                              <GripVertical className="w-4 h-4 text-gray-500" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => handleDuplicateYearGroup(yearGroup.id)}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAddBand(yearGroup.id)}>
                              <Plus className="w-4 h-4 mr-2" />
                              Add Band
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteYearGroup(yearGroup.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {yearGroup.name}
                    </td>
                    <td
                      colSpan={26}
                      className="border px-4 py-2 text-center text-gray-400 text-xs"
                    >
                      No bands added yet
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {gridData.length === 0 && (
              <tr>
                <td
                  colSpan={27}
                  className="border border-l-0 px-4 py-8 text-center text-gray-500"
                >
                  No year groups added yet. Click "New Year Group" to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Rename Band Dialog */}
      <Dialog open={showRenameBandDialog} onOpenChange={setShowRenameBandDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Band</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="band-name">Band Name</Label>
              <Input
                id="band-name"
                value={renameBandValue}
                onChange={(e) => setRenameBandValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRenameBand()}
                placeholder="e.g., 7X"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRenameBandDialog(false);
                setRenameBandId(null);
                setRenameBandValue('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRenameBand} disabled={!renameBandValue.trim()}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}