import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { FinanceService } from "@/lib/services/finance"
import { expenseSchema } from "@/lib/validation/schemas"
import { requireAuth } from "@/lib/permissions"

// GET /api/expenses - List expenses (filtered by role)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const landlordId = searchParams.get("landlordId")

    let expenses

    if (session.user.role === "LANDLORD") {
      // Landlords can only see their own expenses
      if (!session.user.landlordProfileId) {
        return NextResponse.json({ error: "Landlord profile not found" }, { status: 404 })
      }
      expenses = await FinanceService.getExpensesByLandlord(session.user.landlordProfileId)
    } else if (session.user.role === "SUPER_ADMIN" || session.user.role === "SECRETARY") {
      // Admins can see expenses for any landlord
      if (landlordId) {
        expenses = await FinanceService.getExpensesByLandlord(landlordId)
      } else {
        return NextResponse.json({ error: "Please provide landlordId filter" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ expenses })
  } catch (error: any) {
    console.error("Error fetching expenses:", error)
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 })
  }
}

// POST /api/expenses - Create an expense
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Only landlords can create expenses for their properties
    if (session.user.role !== "LANDLORD" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized to create expenses" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = expenseSchema.parse({
      ...body,
      landlordId: session.user.role === "LANDLORD" ? session.user.landlordProfileId : body.landlordId,
      createdBy: session.user.id,
    })

    const expense = await FinanceService.createExpense(validatedData)

    return NextResponse.json({ expense }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating expense:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 })
  }
}
