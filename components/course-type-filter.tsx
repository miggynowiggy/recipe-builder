"use client"

import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useState } from "react"

export type CourseType = "any" | "appetizer" | "main course" | "salad" | "dessert" | "drink"

const courseTypes = [
  { value: "any", label: "Any Course Type" },
  { value: "appetizer", label: "Appetizer" },
  { value: "main course", label: "Main Course" },
  { value: "salad", label: "Salad" },
  { value: "dessert", label: "Dessert" },
  { value: "drink", label: "Drink" },
]

interface CourseTypeFilterProps {
  selectedCourseType: CourseType
  onCourseTypeChange: (courseType: CourseType) => void
  className?: string
}

export function CourseTypeFilter({ selectedCourseType, onCourseTypeChange, className }: CourseTypeFilterProps) {
  const [open, setOpen] = useState(false)

  const selectedCourseLabel =
    courseTypes.find((course) => course.value === selectedCourseType)?.label || "Any Course Type"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCourseLabel}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Search course type..." />
          <CommandList>
            <CommandEmpty>No course type found.</CommandEmpty>
            <CommandGroup>
              {courseTypes.map((course) => (
                <CommandItem
                  key={course.value}
                  value={course.value}
                  onSelect={(currentValue) => {
                    onCourseTypeChange(currentValue as CourseType)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", selectedCourseType === course.value ? "opacity-100" : "opacity-0")}
                  />
                  {course.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
