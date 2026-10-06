import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/permissions"
import { ApplicationService } from "@/lib/services/applications"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const application = await ApplicationService.getApplicationById(
      id,
      session.user.id,
      session.user.role
    )

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(application)
  } catch (error) {
    console.error("Get application error:", error)
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params
    const body = await request.json()

    // Tenants can withdraw their own applications
    if (body.status === "WITHDRAWN" && session.user.role === Role.TENANT) {
      const tenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (!tenantProfile) {
        return NextResponse.json(
          { error: "Tenant profile not found" },
          { status: 404 }
        )
      }

      const application = await ApplicationService.withdrawApplication(id, tenantProfile.id)
      return NextResponse.json(application)
    }

    // Other status updates (by landlords/admin)
    const application = await ApplicationService.updateApplicationStatus(
      id,
      body.status,
      session.user.id
    )

    return NextResponse.json(application)
  } catch (error: any) {
    console.error("Update application error:", error)
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    )
  }
}
