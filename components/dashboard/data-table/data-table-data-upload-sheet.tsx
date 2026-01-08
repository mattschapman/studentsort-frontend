// components/data-table/data-upload-sheet.tsx
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';

// Define the type for our parsed CSV data
interface ParsedCSVData {
  data: Record<string, string>[];
  errors: Papa.ParseError[];
  meta: {
    fields: string[];
    delimiter: string;
    linebreak: string;
    aborted: boolean;
    truncated: boolean;
    cursor: number;
  };
}

// Define the type for table columns
interface TableColumn {
  name: string;
  displayName: string;
  type: string;
  required?: boolean;
}

interface DataUploadSheetProps {
  onClose?: () => void;
  tableName?: string;
  customMessage?: string;
  tableColumns?: TableColumn[];
  onImport?: (data: Record<string, string>[]) => void;
  isImporting?: boolean;
  buttonContent?: React.ReactNode;
  templateData?: string; // New prop for template CSV content
  templateFilename?: string; // New prop for template filename
}

// New interface to track validation issues
interface ValidationIssue {
  row: number;
  column: string;
  issue: string;
  severity: 'warning' | 'error';
}

export const DataUploadSheet: React.FC<DataUploadSheetProps> = ({ 
  onClose,
  tableName = 'public.TEST_simple_table',
  customMessage=' ',
  tableColumns = [],
  onImport,
  isImporting = false,
  buttonContent = 'Import data',
  templateData,
  templateFilename = 'template.csv'
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [csvText, setCsvText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [isDataCompatible, setIsDataCompatible] = useState(true);
  const [duplicateRows, setDuplicateRows] = useState<number[]>([]);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [missingRequiredColumns, setMissingRequiredColumns] = useState<string[]>([]);

  useEffect(() => {
    // Initialize selected columns when parsed data is updated
    if (parsedData && parsedData.meta && parsedData.meta.fields) {
      setSelectedColumns(parsedData.meta.fields);
    }
  }, [parsedData]);
  
  // Re-check for duplicates and validate data when selected columns change
  useEffect(() => {
    if (parsedData && parsedData.data) {
      checkDuplicateRows(parsedData.data);
      validateData(parsedData);
    }
  }, [selectedColumns]);

  // Only close the sheet when import is explicitly complete, not during the importing process
  useEffect(() => {
    if (!isImporting && !isOpen && onClose) {
      onClose();
    }
  }, [isImporting, isOpen, onClose]);

  const handlePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setCsvText(text);
    
    if (text.trim()) {
      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
      });
      
      setParsedData(result as unknown as ParsedCSVData);
      validateData(result as unknown as ParsedCSVData);
    } else {
      setParsedData(null);
      setIsDataCompatible(true);
      setValidationIssues([]);
      setMissingRequiredColumns([]);
    }
  };

  // Helper function to check data type
  const validateDataType = (value: string, expectedType: string): boolean => {
    switch (expectedType.toLowerCase()) {
      case 'number':
      case 'integer':
      case 'float':
      case 'decimal':
        return !isNaN(Number(value));
      case 'boolean':
        return ['true', 'false', '0', '1'].includes(value.toLowerCase());
      case 'date':
      case 'datetime':
        return !isNaN(Date.parse(value));
      case 'string':
      case 'text':
      default:
        return true; // String can be anything
    }
  };

  const validateData = (data: ParsedCSVData) => {
    const issues: ValidationIssue[] = [];
    const missing: string[] = [];
    let isCompatible = true;

    // Check if all required columns are present
    if (tableColumns.length > 0 && data.meta.fields) {
      // Get all the required columns
      const requiredColumns = tableColumns.filter(col => col.required).map(col => col.name);
      
      // Calculate how many required columns can be mapped based on selected columns count
      const mappableRequiredColumns = requiredColumns.slice(0, selectedColumns.length);
      
      // Check if number of selected columns is less than required columns
      if (selectedColumns.length < requiredColumns.length) {
        missing.push(...requiredColumns.slice(selectedColumns.length));
        isCompatible = false;
      }
      
      setMissingRequiredColumns(missing);
    }

    // Check data types for each column if we have table columns defined
    if (tableColumns.length > 0 && data.data.length > 0) {
      data.data.forEach((row, rowIndex) => {
        selectedColumns.forEach((sourceCol, colIndex) => {
          if (colIndex < tableColumns.length) {
            const expectedType = tableColumns[colIndex].type;
            const value = row[sourceCol];
            
            // Skip empty values for now (could be handled differently based on requirements)
            if (value && !validateDataType(value, expectedType)) {
              issues.push({
                row: rowIndex,
                column: sourceCol,
                issue: `Expected type '${expectedType}', got '${value}'`,
                severity: 'error'
              });
              isCompatible = false;
            }
          }
        });
      });
    }
    
    // Update state
    setValidationIssues(issues);
    setIsDataCompatible(isCompatible);
    
    // Check for duplicate rows
    checkDuplicateRows(data.data);
  };
  
  const checkDuplicateRows = (data: Record<string, string>[]) => {
    const duplicates: number[] = [];
    const uniqueRows = new Set();
    
    data.forEach((row, index) => {
      // Create a string representation of the row for comparison
      // We're only considering the selected columns for duplication check
      const rowString = selectedColumns
        .map(col => row[col])
        .join('|');
      
      if (uniqueRows.has(rowString)) {
        duplicates.push(index);
      } else {
        uniqueRows.add(rowString);
      }
    });
    
    setDuplicateRows(duplicates);
  };

  const toggleColumnSelection = (columnName: string) => {
    if (selectedColumns.includes(columnName)) {
      setSelectedColumns(selectedColumns.filter(col => col !== columnName));
    } else {
      setSelectedColumns([...selectedColumns, columnName]);
    }
  };

  const handleOpenChange = (open: boolean) => {
    // Only allow closing if not currently importing
    if (isImporting && !open) {
      return;
    }
    
    setIsOpen(open);
    if (!open && onClose && !isImporting) {
      onClose();
    }
  };

  const handleImport = () => {
    if (parsedData && parsedData.data && onImport) {
      // Filter data to only include selected columns and map to tableColumns
      const filteredData = parsedData.data.map(row => {
        const filteredRow: Record<string, string> = {};
        
        // Map the selected source columns to the destination table columns
        selectedColumns.forEach((sourceColumn, index) => {
          if (index < tableColumns.length) {
            // Use the table column name as the key
            const destColumn = tableColumns[index].name;
            filteredRow[destColumn] = row[sourceColumn];
          }
        });
        
        return filteredRow;
      });
      
      onImport(filteredData);
    }
  };

  const downloadTemplate = () => {
    if (!templateData) {
      toast.error("No template available for download");
      return;
    }

    const blob = new Blob([templateData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = templateFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success("Template downloaded");
  };

  // Helper to get rows with validation issues
  const getRowsWithIssues = (): number[] => {
    return Array.from(new Set(validationIssues.map(issue => issue.row)));
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto p-6">
        <SheetHeader className="mb-4 p-0 space-y-0">
          <SheetTitle className="text-lg">Bulk upload {tableName.toLowerCase()}</SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Supported file formats: csv, xls, xlsx
          </SheetDescription>
        </SheetHeader>

        {/* Download Template Section */}
        {templateData && (
          <div className="mb-6 space-y-2">
            <Label htmlFor="template">Download Template</Label>
            <p className="text-sm text-gray-600 mb-3">
              Download a template csv file that you can populate with your data and upload/paste below.
            </p>
            <Button
              variant="outline"
              onClick={downloadTemplate}
              // className="w-full"
            >
              <Download className="h-4 w-4" />
              Download CSV Template
            </Button>
          </div>
        )}

        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="upload">Upload CSV</TabsTrigger>
            <TabsTrigger value="paste">Text</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="w-full">
            <div className="border border-gray-300 rounded-md p-8 text-center">
              <p className="text-gray-500 mb-4">Upload CSV functionality placeholder</p>
              <Button variant="outline" className="w-full">Upload CSV</Button>
            </div>
          </TabsContent>

          <TabsContent value="paste" className="w-full">
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Paste or type your data below. The first row should be the headers of the table, and your headers should not include any
                special characters other than hyphens (-) or underscores (_).
              </p>

              <Textarea
                placeholder="Start typing, or copy a table from Excel/Sheets and paste it here..."
                className="h-full min-h-50 max-h-75 w-full"
                value={csvText}
                onChange={handlePaste}
                disabled={isImporting}
              />
            </div>
          </TabsContent>
        </Tabs>

        {parsedData && parsedData.data && parsedData.data.length > 0 && (
          <>
            {missingRequiredColumns.length > 0 && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                <p className="font-medium">Missing required columns:</p>
                <ul className="list-disc list-inside mt-1">
                  {missingRequiredColumns.map((col, idx) => (
                    <li key={idx}>{col}</li>
                  ))}
                </ul>
                <p className="mt-2">Please make sure your data includes all required columns.</p>
              </div>
            )}

            <Accordion type="single" collapsible className="mt-6">
              <AccordionItem value="configure-import">
                <AccordionTrigger className="text-md font-medium">
                  Configure import
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-2">
                    <p className="text-sm text-gray-700 mb-5">
                      Select which columns to import. By default, all columns are selected to be imported. Required columns are marked with an asterisk*.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.meta.fields.map((header, index) => {
                        // Determine if this column would map to a required column
                        const mapsToRequired = index < tableColumns.length && tableColumns[index].required;
                        
                        return (
                        <div
                          key={index}
                          className={`px-3 py-1 rounded-md cursor-pointer flex items-center gap-2 ${
                            selectedColumns.includes(header) 
                              ? 'bg-blue-100 border border-blue-200' 
                              : 'bg-gray-100 border border-gray-200'
                          } ${mapsToRequired ? 'border-blue-300' : ''}`}
                          onClick={() => !isImporting && toggleColumnSelection(header)}
                        >
                          <Checkbox 
                            id={`column-${index}`} 
                            checked={selectedColumns.includes(header)}
                            onCheckedChange={() => toggleColumnSelection(header)}
                            disabled={mapsToRequired || isImporting} // Prevent deselecting required columns or while importing
                          />
                          <Label 
                            htmlFor={`column-${index}`}
                            className={`text-sm cursor-pointer ${mapsToRequired ? 'font-medium' : ''}`}
                          >
                            {header}
                            {mapsToRequired && <span className="ml-1 text-red-600">*</span>}
                          </Label>
                        </div>
                      )})}
                    </div>

                    {tableColumns.length > 0 && (
                      <div className="text-sm text-yellow-800 bg-yellow-50 p-4 rounded-md mt-5">
                        <p><strong>Important:</strong> Regardless of what the columns are called in your Excel file/Google Sheet, the column headers will be mapped to the structure of the <strong>{tableName}</strong> table as follows:</p>
                        <ul className="list-disc list-inside">
                          {tableColumns.map((col, index) => (
                              <li key={index} className="mt-1">
                              Column {index + 1} will be mapped to "{col.displayName}" 
                              {col.type && <span className="text-gray-600"> ({col.type})</span>}
                              {col.required && <span className="font-semibold"> (Required)</span>}
                              </li>
                          ))}
                        </ul>
                        <p className="mt-2">Please ensure your data columns are in the correct order and match the expected types.</p>
                        {customMessage? (
                          <p className="mt-2"><strong>Notes:</strong> {customMessage}</p>
                        ) : null}
                      </div>
                    )}

                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="preview-data">
                <AccordionTrigger className="text-md font-medium flex justify-between">
                  <span>Preview import</span>
                  <div className="flex gap-2">
                    {duplicateRows.length > 0 && (
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md">
                        {duplicateRows.length} duplicate row(s)
                      </span>
                    )}
                    {validationIssues.length > 0 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md">
                        {validationIssues.length} type error(s)
                      </span>
                    )}
                    {!isDataCompatible && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-md">
                        Data incompatible
                      </span>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="py-2">
                    <p className="text-sm text-gray-700 mb-3">
                      A total of {parsedData.data.length} rows will be added to the table <strong>{tableName.split('.').pop()}</strong>.
                    </p>
                    <p className="text-sm text-gray-700 mb-5">
                      Here is a preview of the data that will be added (up to the first 20 columns and first 20 rows).
                    </p>
                    
                    {/* Display warnings */}
                    {duplicateRows.length > 0 && (
                      <p className="text-sm text-yellow-800 bg-yellow-50 p-2 rounded-md mb-2">
                        <strong>Warning:</strong> {duplicateRows.length} duplicate row(s) detected. Duplicate rows are highlighted in yellow.
                      </p>
                    )}
                    
                    {validationIssues.length > 0 && (
                      <p className="text-sm text-red-800 bg-red-50 p-2 rounded-md mb-4">
                        <strong>Error:</strong> {validationIssues.length} data type issue(s) detected. Affected cells are highlighted in red.
                      </p>
                    )}
                    
                    <div className="border rounded overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            {selectedColumns.map((_, index) => {
                              // Use tableColumns names for the headers if available
                              const headerName = index < tableColumns.length 
                                ? tableColumns[index].displayName
                                : `Column ${index+1}`;
                              
                              const columnType = index < tableColumns.length 
                                ? tableColumns[index].type 
                                : null;
                                
                              const isRequired = index < tableColumns.length && tableColumns[index].required;
                              
                              return (
                                <th 
                                  key={index}
                                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {headerName}
                                  {isRequired && <span className="text-red-600 ml-1">*</span>}
                                  {columnType && <span className="block text-gray-400 font-normal normal-case">({columnType})</span>}
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {parsedData.data.slice(0, 20).map((row, rowIndex) => {
                            const rowHasIssues = getRowsWithIssues().includes(rowIndex);
                            
                            return (
                              <tr 
                                key={rowIndex} 
                                className={`
                                  ${duplicateRows.includes(rowIndex) ? "bg-yellow-50" : ""}
                                  ${rowHasIssues ? "bg-red-50" : ""}
                                `}
                              >
                                {selectedColumns.map((field, cellIndex) => {
                                  // Check if this particular cell has validation issues
                                  const cellHasIssue = validationIssues.some(
                                    issue => issue.row === rowIndex && issue.column === field
                                  );
                                  
                                  return (
                                    <td 
                                      key={cellIndex}
                                      className={`px-4 py-2 whitespace-nowrap text-sm 
                                        ${duplicateRows.includes(rowIndex) ? "text-yellow-800" : "text-gray-500"}
                                        ${cellHasIssue ? "text-red-700 bg-red-100" : ""}
                                      `}
                                    >
                                      {row[field]}
                                      {duplicateRows.includes(rowIndex) && cellIndex === 0 && (
                                        <span className="ml-2 inline-block text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                                          Duplicate
                                        </span>
                                      )}
                                      {cellHasIssue && (
                                        <span className="ml-2 inline-block text-xs bg-red-100 text-red-800 px-1 rounded">
                                          Type Error
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}

        <div className="mt-6 flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)} 
            size={"sm"}
            disabled={isImporting}
          >
            Cancel
          </Button>
          <Button 
            className="bg-blue-500 hover:bg-blue-600" 
            size={"sm"}
            onClick={handleImport}
            disabled={!parsedData || parsedData.data.length === 0 || !isDataCompatible || isImporting}
          >
            {buttonContent}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};