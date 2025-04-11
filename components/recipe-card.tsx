"use client"

import type { Recipe } from "@/lib/db"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, ChefHat, Utensils } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface RecipeCardProps {
  recipe: Recipe
  onBookmark?: () => void
  isBookmarked?: boolean
}

export function RecipeCard({ recipe, onBookmark, isBookmarked }: RecipeCardProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{recipe.title}</CardTitle>
          {recipe.courseType && (
            <Badge variant="outline" className="ml-2">
              {recipe.courseType}
            </Badge>
          )}
        </div>
        <CardDescription className="flex items-center gap-4 text-xs">
          {recipe.prepTime && (
            <span className="flex items-center">
              <Clock className="h-3 w-3 mr-1" />
              Prep: {recipe.prepTime}
            </span>
          )}
          {recipe.cookTime && (
            <span className="flex items-center">
              <ChefHat className="h-3 w-3 mr-1" />
              Cook: {recipe.cookTime}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-4">
          {recipe.imageURL ? (
            <img
              src={recipe.imageURL || "/placeholder.svg"}
              alt={recipe.title}
              className="w-full h-40 object-cover rounded-md"
            />
          ) : (
            <div className="w-full h-40 bg-gray-100 rounded-md flex items-center justify-center">
              <Utensils className="h-10 w-10 text-gray-300" />
            </div>
          )}
        </div>
        <div>
          <h4 className="text-sm font-medium mb-1">Ingredients:</h4>
          <ul className="text-xs text-gray-600 list-disc pl-4 mb-2">
            {recipe.ingredients.slice(0, 3).map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
            {recipe.ingredients.length > 3 && <li className="text-primary">+{recipe.ingredients.length - 3} more</li>}
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <Link href={`/recipe/${encodeURIComponent(recipe.title)}`} passHref>
          <Button variant="outline" className="w-full mr-2">
            View Recipe
          </Button>
        </Link>
        {onBookmark && (
          <Button variant={isBookmarked ? "default" : "outline"} onClick={onBookmark} className="flex-shrink-0">
            {isBookmarked ? "Saved" : "Save"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
