"use client"

import { useState, useRef, type KeyboardEvent } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface IngredientInputProps {
  ingredients: string[]
  setIngredients: (ingredients: string[]) => void
}

export function IngredientInput({ ingredients, setIngredients }: IngredientInputProps) {
  const [inputValue, setInputValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const addIngredient = () => {
    if (inputValue.trim()) {
      setIngredients([...ingredients, inputValue.trim()])
      setInputValue("")
      inputRef.current?.focus()
    }
  }

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addIngredient()
    } else if (e.key === "Backspace" && inputValue === "" && ingredients.length > 0) {
      removeIngredient(ingredients.length - 1)
    }
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center space-x-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add an ingredient and press Enter"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
        />
        <Button onClick={addIngredient} type="button">
          Add
        </Button>
      </div>

      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center bg-primary/10 text-primary rounded-full px-3 py-1 text-sm">
              <span>{ingredient}</span>
              <button
                onClick={() => removeIngredient(index)}
                className="ml-1 text-primary hover:text-primary/80 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
