import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl

  // Protected routes
  const protectedPaths = ["/admin", "/secretary", "/landlord", "/tenant"]
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path))

  if (isProtectedPath && !session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Role-based redirects
  if (session) {
    const userRole = session.user.role

    if (pathname === "/admin" && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (pathname === "/secretary" && userRole !== "SUPER_ADMIN" && userRole !== "SECRETARY") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (pathname === "/landlord" && userRole !== "LANDLORD") {
      return NextResponse.redirect(new URL("/", request.url))
    }

    if (pathname === "/tenant" && userRole !== "TENANT") {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*", "/secretary/:path*", "/landlord/:path*", "/tenant/:path*"],
}
