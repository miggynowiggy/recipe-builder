"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { type Recipe, saveRecipe, isRecipeBookmarked } from "@/lib/db"
import { ArrowLeft, Clock, ChefHat, Bookmark, BookmarkCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { MarkdownRenderer } from "@/components/markdown-renderer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()

  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"structured" | "markdown">("markdown")

  const title = decodeURIComponent(params.title as string)

  useEffect(() => {
    // In a real app, we would fetch the recipe from the database
    // For this demo, we'll use sessionStorage to pass recipe data between pages
    const storedRecipes = sessionStorage.getItem("recipeResults")
    if (storedRecipes) {
      const recipes = JSON.parse(storedRecipes) as Recipe[]
      const foundRecipe = recipes.find((r) => r.title === title)
      if (foundRecipe) {
        setRecipe(foundRecipe)
      }
    }

    // Check if the recipe is bookmarked
    const checkBookmarkStatus = async () => {
      if (user) {
        const bookmarked = await isRecipeBookmarked(user.uid, title)
        setIsBookmarked(bookmarked)
      }
      setLoading(false)
    }

    checkBookmarkStatus()
  }, [title, user])

  const handleBookmark = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save recipes.",
        variant: "default",
      })
      return
    }

    if (!recipe) return

    try {
      if (!isBookmarked) {
        await saveRecipe(user.uid, recipe)
        setIsBookmarked(true)

        toast({
          title: "Recipe saved",
          description: "This recipe has been added to your saved recipes.",
          variant: "default",
        })
      } else {
        toast({
          title: "Already saved",
          description: "This recipe is already in your saved recipes.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error("Error bookmarking recipe:", error)
      toast({
        title: "Error",
        description: "Failed to save recipe. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Generate markdown content if it doesn't exist
  const markdownContent =
    recipe?.markdownContent || recipe
      ? `
# ${recipe.title}

${recipe.courseType ? `## Course Type\n${recipe.courseType}\n` : ""}

## Ingredients
${recipe.ingredients.map((ingredient) => `- ${ingredient}`).join("\n")}

## Instructions
${recipe.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Time
- Preparation: ${recipe.prepTime || "Not specified"}
- Cooking: ${recipe.cookTime || "Not specified"}
`
      : ""

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container py-6">
        <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {recipe ? (
          <div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div className="flex items-center">
                <h1 className="text-3xl font-bold">{recipe.title}</h1>
                {recipe.courseType && (
                  <Badge variant="outline" className="ml-4">
                    {recipe.courseType}
                  </Badge>
                )}
              </div>
              <Button
                variant={isBookmarked ? "default" : "outline"}
                className="mt-4 md:mt-0"
                onClick={handleBookmark}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkCheck className="mr-2 h-4 w-4" />
                    Saved
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 h-4 w-4" />
                    Save Recipe
                  </>
                )}
              </Button>
            </div>

            {(recipe.prepTime || recipe.cookTime) && (
              <div className="flex items-center space-x-6 mb-6 text-sm text-muted-foreground">
                {recipe.prepTime && (
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Prep: {recipe.prepTime}</span>
                  </div>
                )}
                {recipe.cookTime && (
                  <div className="flex items-center">
                    <ChefHat className="mr-2 h-4 w-4" />
                    <span>Cook: {recipe.cookTime}</span>
                  </div>
                )}
              </div>
            )}

            {recipe.imageURL && (
              <div className="mb-6">
                <img
                  src={recipe.imageURL || "/placeholder.svg"}
                  alt={recipe.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <h2 className="text-xl font-semibold mb-4">Ingredients</h2>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-start">
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs mr-2 mt-0.5">
                        {index + 1}
                      </div>
                      <span>{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2">
                <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                <ol className="space-y-6">
                  {recipe.steps.map((step, index) => (
                    <li key={index} className="flex">
                      <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium mr-4 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </div>
                      <p>{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            {loading ? (
              <p className="text-muted-foreground">Loading recipe...</p>
            ) : (
              <>
                <h2 className="text-xl font-semibold mb-2">Recipe Not Found</h2>
                <p className="text-muted-foreground mb-4">
                  We couldn't find the recipe you're looking for.
                </p>
                <Button onClick={() => router.push("/search")}>
                  Search for Recipes
                </Button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
