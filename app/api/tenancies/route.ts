import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { tenancySchema } from "@/lib/validation/schemas"
import { requireAuth } from "@/lib/permissions"

// GET /api/tenancies - List tenancies (filtered by role)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const searchParams = request.nextUrl.searchParams
    const landlordId = searchParams.get("landlordId")
    const tenantId = searchParams.get("tenantId")
    const { prisma } = await import("@/lib/prisma")

    let tenancies

    if (session.user.role === "TENANT") {
      // Tenants can only see their own tenancies
      if (!session.user.tenantProfileId) {
        return NextResponse.json({ error: "Tenant profile not found" }, { status: 404 })
      }
      tenancies = await prisma.tenancy.findMany({
        where: { tenantId: session.user.tenantProfileId },
        include: {
          tenant: { include: { user: true } },
          landlord: { include: { user: true } },
          property: true,
          unit: true,
          rentCharges: {
            orderBy: { dueDate: "desc" },
            take: 5,
          },
          payments: {
            orderBy: { paymentDate: "desc" },
            take: 5,
          },
        },
        orderBy: { startDate: "desc" },
      })
    } else if (session.user.role === "LANDLORD") {
      // Landlords can see tenancies for their properties
      if (!session.user.landlordProfileId) {
        return NextResponse.json({ error: "Landlord profile not found" }, { status: 404 })
      }
      tenancies = await prisma.tenancy.findMany({
        where: { landlordId: session.user.landlordProfileId },
        include: {
          tenant: { include: { user: true } },
          landlord: { include: { user: true } },
          property: true,
          unit: true,
          rentCharges: {
            orderBy: { dueDate: "desc" },
            take: 5,
          },
          payments: {
            orderBy: { paymentDate: "desc" },
            take: 5,
          },
        },
        orderBy: { startDate: "desc" },
      })
    } else if (session.user.role === "SUPER_ADMIN" || session.user.role === "SECRETARY") {
      // Admins can see any tenancies
      if (landlordId) {
        tenancies = await prisma.tenancy.findMany({
          where: { landlordId },
          include: {
            tenant: { include: { user: true } },
            landlord: { include: { user: true } },
            property: true,
            unit: true,
          },
          orderBy: { startDate: "desc" },
        })
      } else if (tenantId) {
        tenancies = await prisma.tenancy.findMany({
          where: { tenantId },
          include: {
            tenant: { include: { user: true } },
            landlord: { include: { user: true } },
            property: true,
            unit: true,
          },
          orderBy: { startDate: "desc" },
        })
      } else {
        return NextResponse.json({ error: "Please provide landlordId or tenantId filter" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    return NextResponse.json({ tenancies })
  } catch (error: any) {
    console.error("Error fetching tenancies:", error)
    return NextResponse.json({ error: "Failed to fetch tenancies" }, { status: 500 })
  }
}

// POST /api/tenancies - Create a tenancy
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Only secretaries and super admins can create tenancies
    if (session.user.role !== "SECRETARY" && session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Unauthorized to create tenancies" }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = tenancySchema.parse(body)
    const { prisma } = await import("@/lib/prisma")

    // Verify application exists if provided
    if (validatedData.applicationId) {
      const application = await prisma.rentalApplication.findUnique({
        where: { id: validatedData.applicationId },
      })
      if (!application) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 })
      }
    }

    // Verify unit is available
    const unit = await prisma.unit.findUnique({
      where: { id: validatedData.unitId },
    })
    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 })
    }
    if (unit.status !== "VACANT") {
      return NextResponse.json({ error: "Unit is not available" }, { status: 400 })
    }

    // Create tenancy
    const tenancy = await prisma.tenancy.create({
      data: validatedData,
      include: {
        tenant: { include: { user: true } },
        landlord: { include: { user: true } },
        property: true,
        unit: true,
      },
    })

    // Update unit status
    await prisma.unit.update({
      where: { id: validatedData.unitId },
      data: { status: "OCCUPIED" },
    })

    // Update application status if provided
    if (validatedData.applicationId) {
      await prisma.rentalApplication.update({
        where: { id: validatedData.applicationId },
        data: { status: "APPROVED" },
      })
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "TENANCY_CREATED",
        entityType: "Tenancy",
        entityId: tenancy.id,
        metadata: {
          tenantId: validatedData.tenantId,
          landlordId: validatedData.landlordId,
          propertyId: validatedData.propertyId,
          unitId: validatedData.unitId,
        },
      },
    })

    return NextResponse.json({ tenancy }, { status: 201 })
  } catch (error: any) {
    console.error("Error creating tenancy:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Failed to create tenancy" }, { status: 500 })
  }
}
