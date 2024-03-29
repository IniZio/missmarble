"use client"

import * as React from "react"
import { CalendarIcon } from "@radix-ui/react-icons"
import { addDays, format } from "date-fns"
import { type DateRange } from "react-day-picker"

import { cn } from "@/lib/ui"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DateRangePickerProps {
  className?: string
  value?: DateRange
  onChange: (value?: DateRange) => void
}

export function DateRangePicker({
  className,
  value,
  onChange: onChangeProp,
}: DateRangePickerProps & React.HTMLAttributes<HTMLDivElement>) {
  // Instead of unselect, set it to the date user is clicking on
  const onChange = React.useCallback(
    (v?: DateRange) => {
      if (!v?.from && !v?.to) {
        onChangeProp({ from: value?.from, to: value?.from })
        return;
      }

      onChangeProp(v);
    },
    [onChangeProp, value]
  )

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
