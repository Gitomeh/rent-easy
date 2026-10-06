import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/permissions"
import { ApplicationService } from "@/lib/services/applications"
import { Role } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const applications = await ApplicationService.getApplicationsByProperty(
      id,
      session.user.id,
      session.user.role
    )

    return NextResponse.json(applications)
  } catch (error: any) {
    console.error("Get property applications error:", error)
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}
