import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/permissions"
import { UnitService } from "@/lib/services/units"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const unit = await UnitService.getUnitById(id)

    if (!unit) {
      return NextResponse.json(
        { error: "Unit not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(unit)
  } catch (error) {
    console.error("Get unit error:", error)
    return NextResponse.json(
      { error: "Failed to fetch unit" },
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

    const unit = await UnitService.updateUnit(
      id,
      body,
      session.user.id,
      session.user.role
    )

    return NextResponse.json(unit)
  } catch (error: any) {
    console.error("Update unit error:", error)
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update unit" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const result = await UnitService.deleteUnit(
      id,
      session.user.id,
      session.user.role
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Delete unit error:", error)
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: "Failed to delete unit" },
      { status: 500 }
    )
  }
}
