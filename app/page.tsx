"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { registerServiceWorker } from "@/lib/register-sw";
import { Camera, Search, Bookmark, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth-provider";
import { getUserProfile, saveUserProfile } from "@/lib/db";

export default function Home() {
  const { user, loading } = useAuth();

  const checkAndCreateUserProfile = async () => {
    if (!user) {
      console.warn("User is not signed in")
      return
    }

    try {
      const userProfile = await getUserProfile(user?.uid);
      if (!userProfile) {
        console.log("Creating user data for:", user.email);
        await saveUserProfile(user.uid, { sessions: {}, email: user.email });
      }
    } catch (error) {
      console.error("Error when checking user profile:", error)
    }
  }

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    checkAndCreateUserProfile();
  }, [user])

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <section className="py-12 md:py-24 lg:py-32 bg-gradient-to-b from-white to-primary/10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Find Recipes with What You Have
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                  Take a photo of your ingredients or enter them manually to
                  discover delicious recipes you can make right now.
                </p>
              </div>
              <div className="space-x-4">
                {!loading &&
                  (user ? (
                    <>
                      <Button asChild size="lg">
                        <Link href="/search">
                          <Camera className="mr-2 h-4 w-4" />
                          Start with a Photo
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg">
                        <Link href="/search?mode=text">
                          <Search className="mr-2 h-4 w-4" />
                          Enter Ingredients
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <Button asChild size="lg">
                      <Link href="/login">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In to Get Started
                      </Link>
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Snap a Photo</h3>
                  <p className="text-gray-500">
                    Take a photo of your ingredients and let our AI identify
                    them for you.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Search className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Get Recipe Ideas</h3>
                  <p className="text-gray-500">
                    Discover recipes that match your available ingredients with
                    detailed instructions.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Bookmark className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Save Your Favorites</h3>
                  <p className="text-gray-500">
                    Bookmark recipes you love to easily find them later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
          <p className="text-center text-sm leading-loose text-gray-500 md:text-left">
            © {new Date().getFullYear()} Recipe Finder. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
