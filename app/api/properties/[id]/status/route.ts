import { NextRequest, NextResponse } from "next/server"
import { requireRole } from "@/lib/permissions"
import { PropertyService } from "@/lib/services/properties"
import { Role } from "@prisma/client"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole([Role.SUPER_ADMIN, Role.SECRETARY])
    const { id } = await params
    const body = await request.json()

    const property = await PropertyService.updatePropertyStatus(id, body, session.user.id)

    return NextResponse.json(property)
  } catch (error) {
    console.error("Update property status error:", error)
    return NextResponse.json(
      { error: "Failed to update property status" },
      { status: 500 }
    )
  }
}
