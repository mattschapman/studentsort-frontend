// components/multi-select-combobox.tsx
import * as React from "react"
import { ChevronsUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

export interface Option {
  value: string
  label: string
}

interface MultiSelectComboboxProps {
  options: Option[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  emptyText?: string
}

export function MultiSelectCombobox({
  options,
  selectedValues,
  onChange,
  placeholder = "Select items...",
  emptyText = "No items found.",
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    return options.filter(option =>
      option.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search])

  // Check if all filtered options are selected
  const allFilteredSelected = filteredOptions.every(opt => selectedValues.includes(opt.value))
  const someFilteredSelected = filteredOptions.some(opt => selectedValues.includes(opt.value)) && !allFilteredSelected

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      // Deselect all filtered options, but keep other selected values
      const filteredValues = filteredOptions.map(opt => opt.value)
      onChange(selectedValues.filter(v => !filteredValues.includes(v)))
    } else {
      // Select all filtered options, keeping existing selections
      const filteredValues = filteredOptions.map(opt => opt.value)
      const newValues = Array.from(new Set([...selectedValues, ...filteredValues]))
      onChange(newValues)
    }
  }

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value]
    onChange(newValues)
  }

  const displayText = React.useMemo(() => {
    if (selectedValues.length === 0) return placeholder
    if (selectedValues.length === options.length) return `${options.length} selected`
    return `${selectedValues.length} selected`
  }, [selectedValues, options.length, placeholder])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between font-normal w-full"
        >
          <span className="truncate">{displayText}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-48" align="start">
        <Command shouldFilter={false}>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {/* Select All option */}
              <CommandItem
                onSelect={handleSelectAll}
                className="cursor-pointer"
              >
                <Checkbox
                  checked={someFilteredSelected ? "indeterminate" : allFilteredSelected}
                  className="mr-2"
                />
                <span className="font-medium">Select All</span>
              </CommandItem>
              
              {/* Individual options */}
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value)
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleToggle(option.value)}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={isSelected}
                      className="mr-2"
                    />
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}