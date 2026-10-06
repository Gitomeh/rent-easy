import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { FinanceService } from "@/lib/services/finance"
import { paymentStatusSchema } from "@/lib/validation/schemas"
import { PaymentStatus } from "@prisma/client"
import { requireAuth } from "@/lib/permissions"

// GET /api/payments/[id] - Get payment details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { prisma } = await import("@/lib/prisma")

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        tenant: { include: { user: true } },
        tenancy: {
          include: {
            property: true,
            unit: true,
          },
        },
        rentCharges: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Check access permissions
    if (session.user.role === "TENANT") {
      if (payment.tenantId !== session.user.tenantProfileId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    } else if (session.user.role === "LANDLORD") {
      const property = await prisma.property.findUnique({
        where: { id: payment.propertyId },
      })
      if (property?.landlordId !== session.user.landlordProfileId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({ payment })
  } catch (error: any) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 })
  }
}

// PUT /api/payments/[id] - Update payment status
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    // Only secretaries and super admins can update payment status
    if (session.user.role !== "SECRETARY" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized to update payment status" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = paymentStatusSchema.parse(body)

    const payment = await FinanceService.updatePaymentStatus(
      params.id,
      validatedData.status as PaymentStatus,
      session.user.id
    )

    return NextResponse.json({ payment })
  } catch (error: any) {
    console.error("Error updating payment:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update payment" }, { status: 500 })
  }
}
