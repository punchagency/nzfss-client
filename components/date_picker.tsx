"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Filter } from "lucide-react"
import { DayPicker, useNavigation } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  mode?: "single" | "range"
  showMonthYearPicker?: boolean
  captionLayout?: string
}

type ViewMode = "day" | "month" | "year"

export function DatePicker({
  date,
  setDate,
  mode = "single",
  showMonthYearPicker = false,
  captionLayout = "default",
}: DatePickerProps) {
  const [month, setMonth] = React.useState<Date>(date || new Date())
  const [viewMode, setViewMode] = React.useState<ViewMode>("day")
  const [years, setYears] = React.useState<number[]>([])
  const [isOpen, setIsOpen] = React.useState(false)
  
  React.useEffect(() => {
    // Generate years array from 1950 to 2050
    const yearsArray = Array.from({ length: 101 }, (_, i) => 1950 + i)
    setYears(yearsArray)
  }, [])
  
  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Ensure we're using the exact local date values without timezone offsets
      // This prevents the "off by one day" issue
      const localDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        12  // Set to noon to avoid any timezone crossing issues
      );
      
      console.log(`DatePicker selected: ${selectedDate}, using local date: ${localDate}`);
      setDate(localDate);
      setMonth(localDate);
    } else {
      setDate(undefined);
    }
    setIsOpen(false); // Close popover on selection
  }
  
  const toggleViewMode = () => {
    setViewMode(prev => {
      if (prev === "day") return "month"
      if (prev === "month") return "year"
      return "day"
    })
  }
  
  const handleMonthSelect = (month: Date) => {
    setMonth(month)
    if (viewMode === "month") {
      setViewMode("day")
    }
  }
  
  const handleYearSelect = (year: number) => {
    const newDate = new Date(month)
    newDate.setFullYear(year)
    setMonth(newDate)
    setViewMode("month")
  }
  
  // Reset view mode when popover closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset to day view when closed
      setTimeout(() => setViewMode("day"), 100)
    }
  }
  
  // Render year picker grid
  const renderYearPicker = () => {
    const currentYear = month.getFullYear()
    const startYear = Math.floor(currentYear / 10) * 10 - 10
    const visibleYears = years.slice(
      years.findIndex(y => y === startYear),
      years.findIndex(y => y === startYear) + 24
    )
    
    return (
      <div className="year-picker picker-view">
        <div className="year-picker-header">
          <Button 
            variant="ghost" 
            onClick={() => {
              const newDate = new Date(month)
              newDate.setFullYear(newDate.getFullYear() - 24)
              setMonth(newDate)
            }}
          >
            {"<<"}
          </Button>
          <span>{visibleYears[0]} - {visibleYears[visibleYears.length - 1]}</span>
          <Button 
            variant="ghost" 
            onClick={() => {
              const newDate = new Date(month)
              newDate.setFullYear(newDate.getFullYear() + 24)
              setMonth(newDate)
            }}
          >
            {">>"}
          </Button>
        </div>
        <div className="year-picker-grid">
          {visibleYears.map((year) => (
            <Button
              key={year}
              variant="ghost"
              className={cn(
                "year-picker-cell",
                year === currentYear && "year-selected"
              )}
              onClick={() => handleYearSelect(year)}
            >
              {year}
            </Button>
          ))}
        </div>
      </div>
    )
  }
  
  // Custom component for month selection
  const renderMonthPicker = () => {
    const months = [
      "January", "February", "March", "April", 
      "May", "June", "July", "August",
      "September", "October", "November", "December"
    ]
    
    const currentMonth = month.getMonth()
    const currentYear = month.getFullYear()
    
    return (
      <div className="month-picker picker-view">
        <div className="month-picker-header">
          <Button 
            variant="ghost" 
            onClick={() => {
              const newDate = new Date(month)
              newDate.setFullYear(newDate.getFullYear() - 1)
              setMonth(newDate)
            }}
          >
            {"<"}
          </Button>
          <span className="month-year-display" onClick={() => setViewMode("year")}>
            {currentYear}
          </span>
          <Button 
            variant="ghost" 
            onClick={() => {
              const newDate = new Date(month)
              newDate.setFullYear(newDate.getFullYear() + 1)
              setMonth(newDate)
            }}
          >
            {">"}
          </Button>
        </div>
        <div className="month-picker-grid">
          {months.map((monthName, index) => (
            <Button
              key={monthName}
              variant="ghost"
              className={cn(
                "month-picker-cell",
                index === currentMonth && "month-selected"
              )}
              onClick={() => {
                const newDate = new Date(month)
                newDate.setMonth(index)
                handleMonthSelect(newDate)
              }}
            >
              {monthName.substring(0, 3)}
            </Button>
          ))}
        </div>
      </div>
    )
  }
  
  // Custom day picker wrapper for consistent sizing
  const renderDayPicker = () => {
    return (
      <div className="day-picker-wrapper picker-view">
        <DayPicker
          mode="single"
          selected={date}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          captionLayout={captionLayout === "dropdown" ? "dropdown" : "buttons"}
          fromYear={1950}
          toYear={2050}
          showOutsideDays
          fixedWeeks
          className="custom-day-picker"
        />
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-white py-[20.5px] px-[14px] pr-[60px] rounded-[12px] text-sm overflow-hidden text-ellipsis whitespace-nowrap relative",
            !date && "text-muted-foreground"
          )}
        >
          {date ? format(date, "MMM d, yyyy") : <span>Pick a date</span>}
          {date && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-1">
           
              <Button
                type="button" 
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                onClick={(e) => {
                  e.stopPropagation()
                  setDate(undefined)
                }}
              >
                ✕
              </Button>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
        <div className="date-picker-container">
          <div className="date-picker-header">
            <span className="text-sm font-medium">
              {viewMode === "day" ? "Date" : viewMode === "month" ? "Month" : "Year"}
            </span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleViewMode}
              className="filter-toggle-button"
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              {viewMode === "day" ? "Month" : viewMode === "month" ? "Year" : "Date"}
            </Button>
          </div>
          
          <div className="picker-view-container">
            {viewMode === "day" && renderDayPicker()}
            {viewMode === "month" && renderMonthPicker()}
            {viewMode === "year" && renderYearPicker()}
          </div>
        </div>
        <style jsx global>{`
          .date-picker-container {
            width: 300px;
            padding: 16px;
          }
          
          .date-picker-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
          }
          
          .picker-view-container {
            position: relative;
            height: 300px; /* Fixed height container */
            overflow: hidden;
          }
          
          .picker-view {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
          
          .custom-day-picker {
            font-family: inherit;
            margin: 0 auto;
          }
          
          .rdp {
            --rdp-cell-size: 36px; /* Slightly smaller cells */
            --rdp-accent-color: #2563eb;
            --rdp-background-color: #e5e7eb;
            --rdp-accent-color-dark: #2563eb;
            --rdp-background-color-dark: #e5e7eb;
            margin: 0;
            width: 100%;
          }
          
          .rdp-months {
            justify-content: center;
          }
          
          .rdp-month {
            background-color: white;
            width: 100%;
          }
          
          .rdp-table {
            width: 100%;
            margin: 0;
          }
          
          .rdp-day_selected, 
          .rdp-day_selected:focus-visible, 
          .rdp-day_selected:hover {
            background-color: var(--rdp-accent-color);
            color: white;
          }
          
          .rdp-day:hover:not(.rdp-day_selected) {
            background-color: var(--rdp-background-color);
          }
          
          .rdp-head_cell {
            font-weight: 500;
            color: #6b7280;
          }
          
          .rdp-dropdown {
            appearance: none;
            padding: 0.5rem;
            border: 1px solid #e2e8f0;
            border-radius: 0.375rem;
            background-color: white;
            font-size: 0.875rem;
            color: #1f2937;
            cursor: pointer;
            z-index: 10;
            position: relative;
          }
          
          .rdp-dropdown:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 1px #3b82f6;
          }
          
          .rdp-dropdown_month {
            margin-right: 0.5rem;
          }
          
          .rdp-dropdown_year {
            min-width: 5rem;
          }
          
          .rdp-nav {
            margin-bottom: 0.75rem;
          }
          
          .rdp-caption {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 0.75rem;
            font-size: 1rem;
            font-weight: 600;
            color: #1f2937;
          }
          
          .rdp-caption_dropdowns {
            display: flex;
            gap: 0.5rem;
          }
          
          .rdp-caption_label {
            font-weight: 600;
            font-size: 1rem;
            color: #1f2937;
          }
          
          .rdp-nav_button {
            width: 30px;
            height: 30px;
            border-radius: 0.375rem;
            background-color: transparent;
            color: #1f2937;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .rdp-nav_button:hover {
            background-color: #f3f4f6;
          }
          
          /* Fix for dropdown positioning */
          .rdp-vhidden {
            display: none;
          }
          
          /* Ensure calendar stays in view */
          .rdp-dropdown_container {
            position: relative;
          }
          
          /* Month Picker Styles */
          .month-picker {
            padding: 0.5rem;
            width: 100%;
          }
          
          .month-picker-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }
          
          .month-year-display {
            font-weight: 600;
            cursor: pointer;
          }
          
          .month-year-display:hover {
            color: #3b82f6;
          }
          
          .month-picker-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
          }
          
          .month-picker-cell {
            height: 2.5rem;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.375rem;
          }
          
          .month-selected {
            background-color: #2563eb !important;
            color: white;
          }
          
          /* Year Picker Styles */
          .year-picker {
            padding: 0.5rem;
            width: 100%;
          }
          
          .year-picker-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
          }
          
          .year-picker-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
          }
          
          .year-picker-cell {
            height: 2.5rem;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 0.375rem;
            font-size: 0.875rem;
          }
          
          .year-selected {
            background-color: #2563eb !important;
            color: white;
          }
          
          .filter-toggle-button {
            display: flex;
            align-items: center;
            font-size: 0.75rem;
            padding: 0 0.5rem;
          }
        `}</style>
      </PopoverContent>
    </Popover>
  )
}
