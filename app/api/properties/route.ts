import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/permissions"
import { PropertyService } from "@/lib/services/properties"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams

    const filters: any = {
      county: searchParams.get("county") || undefined,
      propertyType: searchParams.get("propertyType") as any,
      minRent: searchParams.get("minRent") ? parseInt(searchParams.get("minRent")!) : undefined,
      maxRent: searchParams.get("maxRent") ? parseInt(searchParams.get("maxRent")!) : undefined,
      bedrooms: searchParams.get("bedrooms") ? parseInt(searchParams.get("bedrooms")!) : undefined,
    }

    // Landlords can only see their own properties
    if (session.user.role === Role.LANDLORD) {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId: session.user.id },
      })

      if (landlordProfile) {
        filters.landlordId = landlordProfile.id
      }
    }

    const properties = await PropertyService.getProperties(filters)

    return NextResponse.json(properties)
  } catch (error) {
    console.error("Get properties error:", error)
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    if (session.user.role !== Role.LANDLORD) {
      return NextResponse.json(
        { error: "Only landlords can create properties" },
        { status: 403 }
      )
    }

    const body = await request.json()

    const landlordProfile = await prisma.landlordProfile.findUnique({
      where: { userId: session.user.id },
    })

    if (!landlordProfile) {
      return NextResponse.json(
        { error: "Landlord profile not found" },
        { status: 404 }
      )
    }

    const property = await PropertyService.createProperty(body, landlordProfile.id)

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error("Create property error:", error)
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    )
  }
}
