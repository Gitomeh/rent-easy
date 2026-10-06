import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/permissions"
import { PropertyService } from "@/lib/services/properties"
import { Role } from "@prisma/client"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth()
    const { id } = await params

    const property = await PropertyService.getPropertyById(
      id,
      session.user.id,
      session.user.role
    )

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error("Get property error:", error)
    return NextResponse.json(
      { error: "Failed to fetch property" },
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

    const property = await PropertyService.updateProperty(
      id,
      body,
      session.user.id,
      session.user.role
    )

    return NextResponse.json(property)
  } catch (error: any) {
    console.error("Update property error:", error)
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update property" },
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

    const result = await PropertyService.deleteProperty(
      id,
      session.user.id,
      session.user.role
    )

    return NextResponse.json(result)
  } catch (error: any) {
    console.error("Delete property error:", error)
    if (error.message === "Unauthorized") {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    )
  }
}
