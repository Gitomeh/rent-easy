import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { FinanceService } from "@/lib/services/finance"
import { paymentSchema } from "@/lib/validation/schemas"
import { requireAuth } from "@/lib/permissions"

// GET /api/payments - List payments (filtered by role)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const landlordId = searchParams.get("landlordId")
    const tenantId = searchParams.get("tenantId")

    let payments

    if (session.user.role === "TENANT") {
      // Tenants can only see their own payments
      if (!session.user.tenantProfileId) {
        return NextResponse.json({ error: "Tenant profile not found" }, { status: 404 })
      }
      payments = await FinanceService.getPaymentsByTenant(session.user.tenantProfileId)
    } else if (session.user.role === "LANDLORD") {
      // Landlords can see payments for their properties
      if (!session.user.landlordProfileId) {
        return NextResponse.json({ error: "Landlord profile not found" }, { status: 404 })
      }
      payments = await FinanceService.getPaymentsByLandlord(session.user.landlordProfileId)
    } else if (session.user.role === "SUPER_ADMIN" || session.user.role === "SECRETARY") {
      // Admins can see all payments if no filter is provided
      if (landlordId) {
        payments = await FinanceService.getPaymentsByLandlord(landlordId)
      } else if (tenantId) {
        payments = await FinanceService.getPaymentsByTenant(tenantId)
      } else {
        return NextResponse.json({ error: "Please provide landlordId or tenantId filter" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ payments })
  } catch (error: any) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

// POST /api/payments - Create a payment
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Only landlords, secretaries, and super admins can record payments
    if (
      session.user.role !== "LANDLORD" &&
      session.user.role !== "SECRETARY" &&
      session.user.role !== "SUPER_ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized to record payments" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = paymentSchema.parse({
      ...body,
      recordedBy: session.user.id,
    })

    const payment = await FinanceService.createPayment(validatedData)

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating payment:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 })
  }
}
