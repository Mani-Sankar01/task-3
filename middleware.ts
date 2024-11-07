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

  const userRole = token.role;

  // Check role-based access
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin") && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    pathname.startsWith("/tsmwa") &&
    userRole !== "admin" &&
    userRole !== "tsmwaManager"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (
    pathname.startsWith("/twwa") &&
    userRole !== "admin" &&
    userRole !== "twwaManager"
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Allow access if conditions are met
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/tsmwa/:path*", "/twwa/:path*"], // Apply to these routes
};
