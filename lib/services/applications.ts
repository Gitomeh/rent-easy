import { prisma } from "@/lib/prisma"
import { ApplicationStatus } from "@prisma/client"
import { rentalApplicationSchema } from "@/lib/validation/schemas"

export class ApplicationService {
  static async createApplication(data: any, tenantId: string) {
    const validated = rentalApplicationSchema.parse(data)

    // Verify property exists and is approved
    const property = await prisma.property.findUnique({
      where: { id: validated.propertyId },
      include: {
        units: true,
      },
    })

    if (!property) {
      throw new Error("Property not found")
    }

    if (property.status !== "APPROVED") {
      throw new Error("Property is not available for applications")
    }

    // Verify unit exists and is vacant if unitId is provided
    if (validated.unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: validated.unitId },
      })

      if (!unit) {
        throw new Error("Unit not found")
      }

      if (unit.status !== "VACANT") {
        throw new Error("Unit is not available")
      }
    }

    const application = await prisma.rentalApplication.create({
      data: {
        ...validated,
        tenantId,
        status: ApplicationStatus.SUBMITTED,
        submittedAt: new Date(),
      },
      include: {
        property: {
          include: {
            images: true,
          },
        },
        unit: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: tenantId,
        action: "APPLICATION_SUBMITTED",
        entityType: "RentalApplication",
        entityId: application.id,
        metadata: { propertyId: validated.propertyId },
      },
    })

    return application
  }

  static async getApplicationById(id: string, userId: string, userRole: string) {
    const application = await prisma.rentalApplication.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            images: true,
            landlord: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: false,
                    phone: false,
                  },
                },
              },
            },
          },
        },
        unit: true,
        tenant: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: false,
                phone: false,
              },
            },
          },
        },
      },
    })

    if (!application) {
      return null
    }

    // Tenants can only see their own applications
    if (userRole === "TENANT") {
      const tenantProfile = await prisma.tenantProfile.findUnique({
        where: { userId },
      })

      if (!tenantProfile || application.tenantId !== tenantProfile.id) {
        return null
      }
    }

    // Landlords can only see applications for their properties
    if (userRole === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId },
      })

      if (!landlordProfile || application.property.landlordId !== landlordProfile.id) {
        return null
      }
    }

    return application
  }

  static async getApplicationsByTenant(tenantId: string) {
    return prisma.rentalApplication.findMany({
      where: { tenantId },
      include: {
        property: {
          include: {
            images: true,
          },
        },
        unit: true,
      },
      orderBy: { submittedAt: "desc" },
    })
  }

  static async getApplicationsByProperty(propertyId: string, userId: string, userRole: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })

    if (!property) {
      throw new Error("Property not found")
    }

    // Landlords can only see applications for their own properties
    if (userRole === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId },
      })

      if (!landlordProfile || property.landlordId !== landlordProfile.id) {
        throw new Error("Unauthorized")
      }
    }

    return prisma.rentalApplication.findMany({
      where: { propertyId },
      include: {
        tenant: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: false,
                phone: false,
              },
            },
          },
        },
        unit: true,
      },
      orderBy: { submittedAt: "desc" },
    })
  }

  static async updateApplicationStatus(id: string, status: ApplicationStatus, userId: string) {
    const application = await prisma.rentalApplication.update({
      where: { id },
      data: { status },
      include: {
        property: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "APPLICATION_STATUS_CHANGED",
        entityType: "RentalApplication",
        entityId: id,
        metadata: {
          propertyId: application.propertyId,
          newStatus: status,
        },
      },
    })

    return application
  }

  static async withdrawApplication(id: string, tenantId: string) {
    const application = await prisma.rentalApplication.findUnique({
      where: { id },
    })

    if (!application) {
      throw new Error("Application not found")
    }

    if (application.tenantId !== tenantId) {
      throw new Error("Unauthorized")
    }

    const updated = await prisma.rentalApplication.update({
      where: { id },
      data: { status: ApplicationStatus.WITHDRAWN },
    })

    await prisma.auditLog.create({
      data: {
        userId: tenantId,
        action: "APPLICATION_WITHDRAWN",
        entityType: "RentalApplication",
        entityId: id,
        metadata: { propertyId: application.propertyId },
      },
    })

    return updated
  }
}
