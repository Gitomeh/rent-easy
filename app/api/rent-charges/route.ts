import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { FinanceService } from "@/lib/services/finance"
import { rentChargeSchema } from "@/lib/validation/schemas"
import { requireAuth } from "@/lib/permissions"

// GET /api/rent-charges - List rent charges (filtered by tenancy)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const tenancyId = searchParams.get("tenancyId")

    if (!tenancyId) {
      return NextResponse.json({ error: "tenancyId is required" }, { status: 400 })
    }

    const charges = await FinanceService.getRentChargesByTenancy(tenancyId)

    // Check access - tenant can only see their own tenancy charges
    if (session.user.role === "TENANT") {
      const { prisma } = await import("@/lib/prisma")
      const tenancy = await prisma.tenancy.findUnique({
        where: { id: tenancyId },
      })
      if (tenancy?.tenantId !== session.user.tenantProfileId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({ charges })
  } catch (error: any) {
    console.error("Error fetching rent charges:", error)
    return NextResponse.json({ error: "Failed to fetch rent charges" }, { status: 500 })
  }
}

// POST /api/rent-charges - Create a rent charge
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Only secretaries and super admins can create rent charges
    if (session.user.role !== "SECRETARY" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized to create rent charges" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = rentChargeSchema.parse(body)

    const charge = await FinanceService.createRentCharge(validatedData)

    return NextResponse.json({ charge }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating rent charge:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create rent charge" }, { status: 500 })
  }
}
