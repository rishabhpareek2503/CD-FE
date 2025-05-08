import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// This is a simplified middleware that doesn't rely on Firebase Admin SDK
// which was causing the initialization error
export async function middleware(request: NextRequest) {
  // Check if the route is protected
  if (request.nextUrl.pathname.startsWith("/dashboard/model-training")) {
    // Get the session cookie or auth token
    const authToken = request.cookies.get("auth_token")?.value

    if (!authToken) {
      // Redirect to login if no auth token
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // For now, we'll implement a simpler approach
    // In a production app, you would verify the token and check permissions
    // on the server side in the actual route handler

    // Allow access to the route
    return NextResponse.next()
  }

  // Allow access to all other routes
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/model-training/:path*"],
}
