import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protected routes that require authentication
const protectedRoutes = ["/search", "/recipe", "/profile", "/saved"];

export function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname;

  // Check if the path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route)
  );

  // If it's not a protected route, allow the request to proceed
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Check for the auth token in cookies
  const authToken = request.cookies.get("auth-token")?.value;

  // If there's no auth token and the path is a protected route, redirect to login
  if (!authToken) {
    // Create the URL to redirect to
    const loginUrl = new URL("/login", request.url);

    // Add the original URL as a query parameter to redirect back after login
    loginUrl.searchParams.set("redirectTo", path);

    // Redirect to the login page
    return NextResponse.redirect(loginUrl);
  }

  // If there's an auth token, allow the request to proceed
  return NextResponse.next();
}

// Configure the middleware to run only on specific paths
export const config = {
  matcher: [
    "/search/:path*",
    "/recipe/:path*",
    "/profile/:path*",
    "/saved/:path*",
  ],
};
