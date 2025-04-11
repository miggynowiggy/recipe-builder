import { db, storage } from "./firebase"
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, getBlob } from "firebase/storage"
import dayjs from "dayjs";

// Update the Recipe interface to include markdownContent
export interface Recipe {
  id?: string
  title: string
  ingredients: string[]
  steps: string[]
  imageURL?: string
  prepTime?: string
  cookTime?: string
  markdownContent?: string
  courseType?: string
}

export interface UserData {
  uid: string
  email: string
  session: Record<string, number>
}

// Save a recipe to user's bookmarks
export const saveRecipe = async (userId: string, recipe: Recipe) => {
  try {
    const bookmarksRef = collection(db, "users", userId, "bookmarks")
    await addDoc(bookmarksRef, recipe)
    return true
  } catch (error) {
    console.error("Error saving recipe:", error)
    return false
  }
}

// Get user's bookmarked recipes
export const getBookmarkedRecipes = async (userId: string) => {
  try {
    const bookmarksRef = collection(db, "users", userId, "bookmarks")
    const snapshot = await getDocs(bookmarksRef)
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Recipe[]
  } catch (error) {
    console.error("Error getting bookmarked recipes:", error)
    return []
  }
}

// Remove a recipe from bookmarks
export const removeBookmark = async (userId: string, recipeId: string) => {
  try {
    const recipeRef = doc(db, "users", userId, "bookmarks", recipeId)
    await deleteDoc(recipeRef)
    return true
  } catch (error) {
    console.error("Error removing bookmark:", error)
    return false
  }
}

// Check if a recipe is bookmarked
export const isRecipeBookmarked = async (userId: string, recipeTitle: string) => {
  try {
    const bookmarksRef = collection(db, "users", userId, "bookmarks")
    const q = query(bookmarksRef, where("title", "==", recipeTitle))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  } catch (error) {
    console.error("Error checking bookmark status:", error)
    return false
  }
}

// Upload an image to Firebase Storage
export const uploadImage = async (userId: string, file: File) => {
  try {
    const storageRef = ref(storage, `users/${userId}/images/${Date.now()}_${file.name}`)
    await uploadBytes(storageRef, file)
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL
  } catch (error) {
    console.error("Error uploading image:", error)
    return null
  }
}

// Save user profile
export const saveUserProfile = async (userId: string, data: any) => {
  try {
    await setDoc(
      doc(db, "users", userId),
      {
        ...data,
        updatedAt: new Date(),
      },
      { merge: true },
    )
    return true
  } catch (error) {
    console.error("Error saving user profile:", error)
    return false
  }
}

// Get user profile
export const getUserProfile = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data()
    } else {
      return null
    }
  } catch (error) {
    console.error("Error getting user profile:", error)
    return null
  }
}

// update free tier call counter
export const updateFreeTierCounter = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const userDoc = await getDoc(docRef);
    const userData = userDoc.data() as Record<string, any>;
    const currentDate = dayjs().format("YYYY-MM-DD")
    userData.sessions[currentDate] = typeof(userData.sessions[currentDate]) === 'undefined' ? 1 : userData.sessions[currentDate] + 1;
    await updateDoc(docRef, userData);
    
    return true;
  } catch (error) {
    console.error("Error while updating call counter:", error);
    return false
  }
}

// check if user exceeds free tier call
const freeTierCall = Number(process.env.NEXT_PUBLIC_MAX_CALL ?? 0);
export const isFreeTierExceeded = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const userDoc = await getDoc(docRef);
    const userData = userDoc.data() as Record<string, any>;
    const currentDate = dayjs().format("YYYY-MM-DD");
    const sessionCount = userData?.sessions[currentDate];

    if (!sessionCount) {
      // if no session is recorded yet, allow the user since its the first time in the day.
      return false
    }

    if (sessionCount >= freeTierCall) {
      // return true since the user already exceeded the free tier limit for today
      return true
    }

    return false;
  } catch (error) {
    console.error("Error while checking user's free tier:", error);
    return true
  }
}