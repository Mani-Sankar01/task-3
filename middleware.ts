// app/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // console.log("Token:", token);

  // If no token, redirect to sign-in
  const requestedPage = request.nextUrl.pathname;

  // If no token, redirect to sign-in with callbackUrl as the requested page
  if (!token) {
    const signInUrl = new URL("/api/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", requestedPage); // Set callback URL
    return NextResponse.redirect(signInUrl);
  }

  // Check if token is expired
  if (token.exp && typeof token.exp === "number") {
    const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
    if (token.exp < currentTime) {
      // Token is expired, automatically sign out by clearing session cookies
      console.log("Token expired. Automatically signing out user.");
      
      // Redirect to login page
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("expired", "true"); // Optional: add query param to show expiration message
      
      // Create response with redirect
      const response = NextResponse.redirect(loginUrl);
      
      // Clear NextAuth session cookies to automatically sign out
      // These cookie names may vary based on your NextAuth configuration
      const cookiesToDelete = [
        "next-auth.session-token",
        "__Secure-next-auth.session-token",
        "next-auth.csrf-token",
        "__Host-next-auth.csrf-token",
      ];
      
      cookiesToDelete.forEach((cookieName) => {
        response.cookies.delete(cookieName);
      });
      
      return response;
    }
  }

  const userRole = token.role;
  console.log("userRole", userRole);

  // Check role-based access
  const pathname = request.nextUrl.pathname;

  if (
    pathname.startsWith("/admin") &&
    userRole !== "ADMIN" &&
    userRole !== "ADMIN_VIEWER"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    pathname.startsWith("/tsmwa") &&
    userRole !== "ADMIN" &&
    userRole !== "TSMWA_EDITOR" &&
    userRole !== "TSMWA_VIEWER"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    pathname.startsWith("/twwa") &&
    userRole !== "ADMIN" &&
    userRole !== "TQMA_VIEWER" &&
    userRole !== "TQMA_EDITOR"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow access if conditions are met
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tsmwa/:path*", "/twwa/:path*"], // Apply to these routes
};
