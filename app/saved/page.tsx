"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-provider"
import { Navbar } from "@/components/navbar"
import { RecipeCard } from "@/components/recipe-card"
import { type Recipe, getBookmarkedRecipes, removeBookmark } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Loader2, BookmarkX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function SavedRecipesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push("/login")
      return
    }

    const fetchBookmarkedRecipes = async () => {
      setLoading(true)
      try {
        const bookmarkedRecipes = await getBookmarkedRecipes(user.uid)
        setRecipes(bookmarkedRecipes)
      } catch (error) {
        console.error("Error fetching bookmarked recipes:", error)
        toast({
          title: "Error",
          description: "Failed to load your saved recipes. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchBookmarkedRecipes()
  }, [user, authLoading, router, toast])

  const handleRemoveBookmark = async (recipeId: string) => {
    if (!user || !recipeId) return

    try {
      await removeBookmark(user.uid, recipeId)
      setRecipes(recipes.filter((recipe) => recipe.id !== recipeId))

      toast({
        title: "Recipe removed",
        description: "The recipe has been removed from your saved recipes.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error removing bookmark:", error)
      toast({
        title: "Error",
        description: "Failed to remove recipe. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 container py-6">
        <h1 className="text-2xl font-bold mb-6">Saved Recipes</h1>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your saved recipes...</p>
          </div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="relative">
                <RecipeCard recipe={recipe} />
                {recipe.id && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleRemoveBookmark(recipe.id!)}
                  >
                    <BookmarkX className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You haven't saved any recipes yet.</p>
            <Button onClick={() => router.push("/search")}>Find Recipes</Button>
          </div>
        )}
      </main>
    </div>
  )
}
