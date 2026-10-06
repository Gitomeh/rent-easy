import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { tenancyStatusSchema } from "@/lib/validation/schemas"
import { TenancyStatus } from "@prisma/client"
import { requireAuth } from "@/lib/permissions"

// GET /api/tenancies/[id] - Get tenancy details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()
    const { prisma } = await import("@/lib/prisma")

    const tenancy = await prisma.tenancy.findUnique({
      where: { id: params.id },
      include: {
        tenant: { include: { user: true } },
        landlord: { include: { user: true } },
        property: true,
        unit: true,
        rentCharges: {
          orderBy: { dueDate: "desc" },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    })

    if (!tenancy) {
      return NextResponse.json({ error: "Tenancy not found" }, { status: 404 })
    }

    // Check access permissions
    if (session.user.role === "TENANT") {
      if (tenancy.tenantId !== session.user.tenantProfileId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    } else if (session.user.role === "LANDLORD") {
      if (tenancy.landlordId !== session.user.landlordProfileId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    return NextResponse.json({ tenancy })
  } catch (error: any) {
    console.error("Error fetching tenancy:", error)
    return NextResponse.json({ error: "Failed to fetch tenancy" }, { status: 500 })
  }
}

// PUT /api/tenancies/[id] - Update tenancy status
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth()

    // Only secretaries and super admins can update tenancy status
    if (session.user.role !== "SECRETARY" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized to update tenancy status" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = tenancyStatusSchema.parse(body)
    const { prisma } = await import("@/lib/prisma")

    const tenancy = await prisma.tenancy.update({
      where: { id: params.id },
      data: { status: validatedData.status as TenancyStatus },
      include: {
        tenant: { include: { user: true } },
        landlord: { include: { user: true } },
        property: true,
        unit: true,
      },
    })

    // If ending tenancy, update unit status to vacant
    if (validatedData.status === TenancyStatus.EXPIRED || validatedData.status === TenancyStatus.TERMINATED) {
      await prisma.unit.update({
        where: { id: tenancy.unitId },
        data: { status: "VACANT" },
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TENANCY_STATUS_CHANGED",
        entityType: "Tenancy",
        entityId: params.id,
        metadata: { newStatus: validatedData.status },
      },
    })

    return NextResponse.json({ tenancy })
  } catch (error: any) {
    console.error("Error updating tenancy:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to update tenancy" }, { status: 500 })
  }
}
