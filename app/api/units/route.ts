import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/permissions"
import { UnitService } from "@/lib/services/units"
import { Role } from "@prisma/client"

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    const body = await request.json()

    const unit = await UnitService.createUnit(
      body,
      body.propertyId,
      session.user.id,
      session.user.role
    )

    return NextResponse.json(unit, { status: 201 })
  } catch (error: any) {
    console.error("Create unit error:", error)
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create unit" },
      { status: 500 }
    )
  }
}
