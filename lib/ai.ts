import { vertexAI, getGenerativeModel } from "./firebase"
import type { CourseType } from "@/components/course-type-filter"

// Updated Recipe interface with markdown fields
export interface Recipe {
  id?: string
  title: string
  ingredients: string[]
  steps: string[]
  imageUrl?: string
  prepTime?: string
  cookTime?: string
  markdownContent?: string
  courseType?: string
}

// Function to get recipe suggestions from ingredients text
export async function getRecipesFromIngredients(ingredients: string[], courseType: CourseType = "any") {
  try {
    // Create the prompt for Gemini
    const courseTypeText =
      courseType !== "any" ? `Make sure all recipes are specifically for ${courseType} dishes.` : ""

    const prompt = `
      I have the following ingredients: ${ingredients.join(", ")}. 
      Please suggest recipes I can make with these ingredients. 
      ${courseTypeText}
      
      For each recipe, provide:
      1. Title
      2. A cover photo describing the appearance of the dish if the recipe is followed, use image URL to display the image.
      3. List of ingredients with measurements
      4. Step-by-step cooking instructions
      5. Approximate preparation and cooking time
      
      Format the response as a JSON containing array of objects with the following key-value pairs:
      - title: string
      - imageURL: string
      - ingredients: string[]
      - steps: string[]
      - prepTime: string
      - cookTime: string
      - courseType: string (e.g., "appetizer", "main course", "salad", "dessert", "drink")
    `

    // Get the generative model
    const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" },)

    // Generate content
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8000,
      },
    })

    // Try to parse the response as JSON
    const responseText = result.response
      .text()
      .replaceAll("```", "")
      .replaceAll("json", "");

    console.log(responseText)

    try {
      const recipes = JSON.parse(responseText) as Recipe[]

      console.log(responseText, recipes)

      // Ensure all recipes have the courseType field
      const processedRecipes = recipes.map((recipe) => {
        if (!recipe.courseType && courseType !== "any") {
          recipe.courseType = courseType
        }
        return recipe
      })

      return processedRecipes
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      // If parsing fails, use our fallback parser
      return parseNonJsonResponse(responseText)
    }
  } catch (error) {
    console.error("Error getting recipes:", error)
    return []
  }
}

// Function to get recipe suggestions from multiple images
export async function getRecipesFromImages(uploadedFiles: File[], courseType: CourseType = "any") {
  try {
    // Create the prompt for Gemini
    const courseTypeText =
      courseType !== "any" ? `Make sure all recipes are specifically for ${courseType} dishes.` : ""

    const prompt = `
      I'm sending you ${
        uploadedFiles.length > 1 ? "multiple images" : "an image"
      } of food ingredients. 
      Please identify all the ingredients visible in ${
        uploadedFiles.length > 1 ? "these images" : "this image"
      } and suggest 5 recipes I can make with these ingredients.
      ${courseTypeText}
      
      For each recipe, provide:
      1. Title
      2. A cover photo describing the appearance of the dish if the recipe is followed, use image URL to display the image.
      3. List of ingredients with measurements
      4. Step-by-step cooking instructions
      5. Approximate preparation and cooking time
      
      Format the response as a JSON containing array of objects with the following key-value pairs:
      - title: string
      - imageURL: string
      - ingredients: string[]
      - steps: string[]
      - prepTime: string
      - cookTime: string
      - courseType: string (e.g., "appetizer", "main course", "salad", "dessert", "drink")
    `;

    // Get the generative model
    const model = getGenerativeModel(vertexAI, { model: "gemini-2.0-flash" })

    // Prepare parts array with the prompt text and all images
    const parts: any[] = [{ text: prompt }]

    // Fetch all images and convert to base64
    for (const uploadedFile of uploadedFiles) {
      const base64Image = await blobToBase64(uploadedFile)

      parts.push({
        inlineData: {
          mimeType: uploadedFile.type,
          data: base64Image.split(",")[1], // Remove the data:image/jpeg;base64, part
        },
      })
    }

    // Generate content with all images
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: parts,
        },
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8000,
      },
    })

    const responseText = result.response
      .text()
      .replaceAll("```", "")
      .replaceAll("json", "");

    // Try to parse the response as JSON
    try {
      const jsonResponse = JSON.parse(responseText) as { recipes: Recipe[] };
      const recipes = jsonResponse.recipes;

      // Ensure all recipes have the courseType field
      const processedRecipes = recipes.map((recipe) => {
        if (!recipe.courseType && courseType !== "any") {
          recipe.courseType = courseType
        }
        return recipe
      })

      return processedRecipes
    } catch (error) {
      console.error("Error parsing JSON response:", error)
      // If parsing fails, use our fallback parser
      return parseNonJsonResponse(responseText)
    }
  } catch (error) {
    console.error("Error getting recipes from images:", error)
    return []
  }
}

// Helper function to convert Blob to base64
function blobToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// For local development or if the AI doesn't return proper JSON
export function parseNonJsonResponse(text: string) {
  // Simple fallback parser for when the AI doesn't return proper JSON
  const recipes = []
  const recipeBlocks = text.split(/Recipe \d+:|(?=Title:)/i).filter((block) => block.trim())

  for (const block of recipeBlocks) {
    try {
      const titleMatch = block.match(/Title:?\s*([^\n]+)/i)
      const ingredientsMatch = block.match(/Ingredients:?\s*([\s\S]*?)(?=Steps:|Instructions:|Preparation Time:|$)/i)
      const stepsMatch = block.match(
        /(?:Steps|Instructions):?\s*([\s\S]*?)(?=Preparation Time:|Cooking Time:|Prep Time:|Cook Time:|$)/i,
      )
      const prepTimeMatch = block.match(/(?:Preparation Time|Prep Time):?\s*([^\n]+)/i)
      const cookTimeMatch = block.match(/(?:Cooking Time|Cook Time):?\s*([^\n]+)/i)
      const courseTypeMatch = block.match(/(?:Course Type|Type):?\s*([^\n]+)/i)

      if (titleMatch) {
        const title = titleMatch[1].trim()
        const ingredients = ingredientsMatch
          ? ingredientsMatch[1]
              .split("\n")
              .map((line) => line.trim())
              .filter((line) => line && !line.match(/^[0-9.]+$/))
          : []
        const steps = stepsMatch
          ? stepsMatch[1]
              .split(/\d+\.\s*/)
              .map((line) => line.trim())
              .filter((line) => line)
          : []
        const prepTime = prepTimeMatch ? prepTimeMatch[1].trim() : ""
        const cookTime = cookTimeMatch ? cookTimeMatch[1].trim() : ""
        const courseType = courseTypeMatch ? courseTypeMatch[1].trim() : "main course"

        // Generate markdown content for the recipe
        const markdownContent = `
# ${title}

## Course Type
${courseType}

## Ingredients
${ingredients.map((ingredient) => `- ${ingredient}`).join("\n")}

## Instructions
${steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}

## Time
- Preparation: ${prepTime || "Not specified"}
- Cooking: ${cookTime || "Not specified"}
`

        recipes.push({
          title,
          ingredients,
          steps,
          prepTime,
          cookTime,
          courseType,
          markdownContent: markdownContent.trim(),
        })
      }
    } catch (e) {
      console.error("Error parsing recipe block:", e)
    }
  }

  return recipes
}
