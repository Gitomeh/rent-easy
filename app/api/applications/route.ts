import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/permissions"
import { ApplicationService } from "@/lib/services/applications"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()

    if (session.user.role === Role.TENANT) {
      const tenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!tenantProfile) {
        return NextResponse.json(
          { error: "Tenant profile not found" },
          { status: 404 }
        )
      }

      const applications = await ApplicationService.getApplicationsByTenant(tenantProfile.id)
      return NextResponse.json(applications)
    }

    // For other roles, return unauthorized
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 403 }
    )
  } catch (error) {
    console.error("Get applications error:", error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    if (session.user.role !== Role.TENANT) {
      return NextResponse.json(
        { error: "Only tenants can submit applications" },
        { status: 403 }
      )
    }

    const body = await request.json()

    const tenantProfile = await prisma.tenantProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!tenantProfile) {
      return NextResponse.json(
        { error: "Tenant profile not found" },
        { status: 404 }
      )
    }

    const application = await ApplicationService.createApplication(body, tenantProfile.id)

    return NextResponse.json(application, { status: 201 })
  } catch (error: any) {
    console.error("Create application error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create application" },
      { status: 500 }
    )
  }
}
