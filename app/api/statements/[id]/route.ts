import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { StatementService } from "@/lib/services/statements"
import { statementStatusSchema } from "@/lib/validation/schemas"
import { StatementStatus } from "@prisma/client"
import { requireAuth } from "@/lib/permissions"

// GET /api/statements/[id] - Get statement details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { prisma } = await import("@/lib/prisma")

    const statement = await prisma.statement.findUnique({
      where: { id: params.id },
      include: {
        landlord: { include: { user: true } },
      },
    })

    if (!statement) {
      return NextResponse.json({ error: "Statement not found" }, { status: 404 })
    }

    // Check access permissions
    if (session.user.role === "LANDLORD") {
      if (statement.landlordId !== session.user.landlordProfileId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({ statement })
  } catch (error: any) {
    console.error("Error fetching statement:", error)
    return NextResponse.json({ error: "Failed to fetch statement" }, { status: 500 })
  }
}

// PUT /api/statements/[id] - Update statement status (approve/finalize)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    const body = await request.json()
    const validatedData = statementStatusSchema.parse(body)

    let statement
    if (validatedData.status === StatementStatus.APPROVED) {
      // Only secretaries and super admins can approve
      if (session.user.role !== "SECRETARY" && session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized to approve statements" }, { status: 403 })
      }
      statement = await StatementService.approveStatement(params.id, session.user.id)
    } else if (validatedData.status === StatementStatus.FINALIZED) {
      // Only super admins can finalize
      if (session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized to finalize statements" }, { status: 403 })
      }
      statement = await StatementService.finalizeStatement(params.id, session.user.id)
    } else {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 })
    }

    return NextResponse.json({ statement })
  } catch (error: any) {
    console.error("Error updating statement:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update statement" }, { status: 500 })
  }
}
