import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { StatementService } from "@/lib/services/statements"
import { statementSchema } from "@/lib/validation/schemas"
import { requireAuth } from "@/lib/permissions"

// GET /api/statements - List statements (filtered by role)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const landlordId = searchParams.get("landlordId")
    const status = searchParams.get("status")

    let statements

    if (session.user.role === "LANDLORD") {
      // Landlords can only see their own statements
      if (!session.user.landlordProfileId) {
        return NextResponse.json({ error: "Landlord profile not found" }, { status: 404 })
      }
      statements = await StatementService.getStatementsByLandlord(session.user.landlordProfileId)
    } else if (session.user.role === "SUPER_ADMIN" || session.user.role === "SECRETARY") {
      // Admins can see pending statements or specific landlord statements
      if (status === "pending") {
        statements = await StatementService.getPendingStatements()
      } else if (landlordId) {
        statements = await StatementService.getStatementsByLandlord(landlordId)
      } else {
        return NextResponse.json({ error: "Please provide landlordId or status filter" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ statements })
  } catch (error: any) {
    console.error("Error fetching statements:", error)
    return NextResponse.json({ error: "Failed to fetch statements" }, { status: 500 })
  }
}

// POST /api/statements - Generate a statement
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Only secretaries and super admins can generate statements
    if (session.user.role !== "SECRETARY" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized to generate statements" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = statementSchema.parse({
      ...body,
      generatedBy: session.user.id,
    })

    const statement = await StatementService.generateStatement(
      validatedData.landlordId,
      validatedData.periodStart,
      validatedData.periodEnd,
      validatedData.generatedBy
    )

    return NextResponse.json({ statement }, { status: 201 })
  } catch (error: any) {
    console.error("Error generating statement:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Failed to generate statement" }, { status: 500 })
  }
}
