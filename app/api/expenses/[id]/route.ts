import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { FinanceService } from "@/lib/services/finance"
import { expenseStatusSchema } from "@/lib/validation/schemas"
import { ExpenseStatus } from "@prisma/client"
import { requireAuth } from "@/lib/permissions"

// GET /api/expenses/[id] - Get expense details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { prisma } = await import("@/lib/prisma")

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        landlord: { include: { user: true } },
        property: true,
        unit: true,
      },
    })

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    // Check access permissions
    if (session.user.role === "LANDLORD") {
      if (expense.landlordId !== session.user.landlordProfileId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({ expense })
  } catch (error: any) {
    console.error("Error fetching expense:", error)
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 })
  }
}

// PUT /api/expenses/[id] - Update expense status (approve/reject)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    // Only secretaries and super admins can approve/reject expenses
    if (session.user.role !== "SECRETARY" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized to update expense status" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = expenseStatusSchema.parse(body)

    let expense
    if (validatedData.status === ExpenseStatus.APPROVED) {
      expense = await FinanceService.approveExpense(params.id, session.user.id)
    } else if (validatedData.status === ExpenseStatus.REJECTED) {
      if (!validatedData.rejectionReason) {
        return NextResponse.json({ error: "Rejection reason is required" }, { status: 400 })
      }
      expense = await FinanceService.rejectExpense(params.id, validatedData.rejectionReason, session.user.id)
    } else {
      return NextResponse.json({ error: "Invalid status transition" }, { status: 400 })
    }

    return NextResponse.json({ expense })
  } catch (error: any) {
    console.error("Error updating expense:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 })
  }
}

// DELETE /api/expenses/[id] - Delete an expense
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { prisma } = await import("@/lib/prisma")

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
    })

    if (!expense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 })
    }

    // Only the landlord who created it or super admin can delete
    if (session.user.role === "LANDLORD") {
      if (expense.landlordId !== session.user.landlordProfileId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      // Can only delete pending expenses
      if (expense.status !== ExpenseStatus.PENDING_APPROVAL) {
        return NextResponse.json({ error: "Can only delete pending expenses" }, { status: 400 })
      }
    } else if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    await prisma.expense.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Expense deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting expense:", error)
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 })
  }
}
