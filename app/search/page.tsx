"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { ImageUpload } from "@/components/ui/image-upload"
import { IngredientInput } from "@/components/ingredient-input"
import { RecipeCard } from "@/components/recipe-card"
import { type Recipe, uploadImage, saveRecipe, isRecipeBookmarked } from "@/lib/db"
import { getRecipesFromIngredients, getRecipesFromImages } from "@/lib/ai"
import { Loader2, Camera, List, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CourseTypeFilter, type CourseType } from "@/components/course-type-filter"

export default function SearchPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialMode = searchParams.get("mode") === "text" ? "text" : "photo"

  const [mode, setMode] = useState<"photo" | "text">(initialMode)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(false)
  const [bookmarkedRecipes, setBookmarkedRecipes] = useState<Set<string>>(new Set())
  const [courseType, setCourseType] = useState<CourseType>("any")

  useEffect(() => {
    // This effect will only run once on the client side
    setMode(initialMode)
  }, [initialMode])

  const handleImagesCapture = (files: File[]) => {
    setSelectedFiles(files)
  }

  const handleSearch = async () => {
    if (mode === "text" && ingredients.length === 0) {
      toast({
        title: "No ingredients added",
        description: "Please add at least one ingredient to search for recipes.",
        variant: "destructive",
      })
      return
    }

    if (mode === "photo" && selectedFiles.length === 0) {
      toast({
        title: "No images selected",
        description: "Please take photos or upload images of your ingredients.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setRecipes([])

    try {
      let results: Recipe[] = []

      if (mode === "text") {
        results = await getRecipesFromIngredients(ingredients, courseType)
      } else if (mode === "photo" && selectedFiles.length > 0 && user) {
        // Upload all images to Firebase Storage
        const imageUrls: string[] = []

        for (const file of selectedFiles) {
          const imageUrl = await uploadImage(user.uid, file)
          if (imageUrl) {
            imageUrls.push(imageUrl)
          }
        }

        if (imageUrls.length > 0) {
          results = await getRecipesFromImages(imageUrls, courseType)
        } else {
          throw new Error("Failed to upload images")
        }
      }

      setRecipes(results)

      // Store recipes in sessionStorage for access on the detail page
      sessionStorage.setItem("recipeResults", JSON.stringify(results))

      // Check which recipes are bookmarked
      if (user) {
        const bookmarkedSet = new Set<string>()
        for (const recipe of results) {
          const isBookmarked = await isRecipeBookmarked(user.uid, recipe.title)
          if (isBookmarked) {
            bookmarkedSet.add(recipe.title)
          }
        }
        setBookmarkedRecipes(bookmarkedSet)
      }
    } catch (error) {
      console.error("Error searching for recipes:", error)

      toast({
        title: "Error",
        description: "Failed to search for recipes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBookmark = async (recipe: Recipe) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save recipes.",
        variant: "default",
      })
      return
    }

    try {
      const isBookmarked = bookmarkedRecipes.has(recipe.title)

      if (!isBookmarked) {
        await saveRecipe(user.uid, recipe)
        setBookmarkedRecipes(new Set([...bookmarkedRecipes, recipe.title]))

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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-bold mb-6">Find Recipes</h1>

        <Tabs defaultValue={mode} onValueChange={(value) => setMode(value as "photo" | "text")} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="photo" className="flex items-center">
              <Camera className="mr-2 h-4 w-4" />
              Take Photos
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center">
              <List className="mr-2 h-4 w-4" />
              Enter Ingredients
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photo" className="space-y-4">
            <ImageUpload onImagesCapture={handleImagesCapture} />

            <div className="flex items-center space-x-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by course type:</span>
            </div>
            <CourseTypeFilter selectedCourseType={courseType} onCourseTypeChange={setCourseType} className="mb-4" />

            <Button onClick={handleSearch} disabled={loading || selectedFiles.length === 0} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Find Recipes"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <IngredientInput ingredients={ingredients} setIngredients={setIngredients} />

            <div className="flex items-center space-x-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter by course type:</span>
            </div>
            <CourseTypeFilter selectedCourseType={courseType} onCourseTypeChange={setCourseType} className="mb-4" />

            <Button onClick={handleSearch} disabled={loading || ingredients.length === 0} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Find Recipes"
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {mode === "photo" ? "Analyzing your ingredients..." : "Finding recipes for you..."}
            </p>
          </div>
        )}

        {!loading && recipes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">Recipe Suggestions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map((recipe, index) => (
                <RecipeCard
                  key={index}
                  recipe={recipe}
                  onBookmark={() => handleBookmark(recipe)}
                  isBookmarked={bookmarkedRecipes.has(recipe.title)}
                />
              ))}
            </div>
          </div>
        )}

        {!loading &&
          recipes.length === 0 &&
          ((mode === "photo" && selectedFiles.length > 0) || (mode === "text" && ingredients.length > 0)) && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Click "Find Recipes" to see recipe suggestions.</p>
            </div>
          )}
      </main>
    </div>
  )
}
