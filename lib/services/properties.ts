import { prisma } from "@/lib/prisma"
import { PropertyStatus, PropertyType } from "@prisma/client"
import { propertySchema, propertyUpdateSchema, propertyStatusSchema } from "@/lib/validation/schemas"

export class PropertyService {
  static async createProperty(data: any, landlordId: string) {
    const validated = propertySchema.parse(data)

    const property = await prisma.property.create({
      data: {
        ...validated,
        landlordId,
        status: PropertyStatus.PENDING_REVIEW,
      },
      include: {
        images: true,
        units: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: landlordId,
        action: "PROPERTY_CREATED",
        entityType: "Property",
        entityId: property.id,
        metadata: { propertyName: property.name },
      },
    })

    return property
  }

  static async getPropertyById(id: string, userId?: string, userRole?: string) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        units: {
          where: {
            status: "VACANT",
          },
        },
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
    })

    if (!property) {
      return null
    }

    // For public users, only show approved properties
    if (!userId || !userRole) {
      if (property.status !== PropertyStatus.APPROVED) {
        return null
      }
    }

    // For landlords, only show their own properties
    if (userRole === "LANDLORD") {
      if (property.landlord.userId !== userId) {
        return null
      }
    }

    return property
  }

  static async getProperties(filters: {
    county?: string
    propertyType?: PropertyType
    minRent?: number
    maxRent?: number
    bedrooms?: number
    status?: PropertyStatus
    landlordId?: string
  }) {
    const where: any = {
      status: filters.status || PropertyStatus.APPROVED,
    }

    if (filters.county) {
      where.county = filters.county
    }

    if (filters.propertyType) {
      where.propertyType = filters.propertyType
    }

    if (filters.minRent || filters.maxRent) {
      where.units = {
        some: {
          monthlyRent: {
            ...(filters.minRent && { gte: filters.minRent }),
            ...(filters.maxRent && { lte: filters.maxRent }),
          },
          status: "VACANT",
        },
      }
    }

    if (filters.bedrooms) {
      where.units = {
        some: {
          bedrooms: { gte: filters.bedrooms },
          status: "VACANT",
        },
      }
    }

    if (filters.landlordId) {
      where.landlordId = filters.landlordId
    }

    return prisma.property.findMany({
      where,
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
        units: {
          where: { status: "VACANT" },
        },
      },
    })
  }

  static async updateProperty(id: string, data: any, userId: string, userRole: string) {
    const property = await prisma.property.findUnique({
      where: { id },
    })

    if (!property) {
      throw new Error("Property not found")
    }

    // Landlords can only update their own properties
    if (userRole === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId },
      })

      if (!landlordProfile || property.landlordId !== landlordProfile.id) {
        throw new Error("Unauthorized")
      }
    }

    const validated = propertyUpdateSchema.parse(data)

    const updated = await prisma.property.update({
      where: { id },
      data: validated,
      include: {
        images: true,
        units: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "PROPERTY_UPDATED",
        entityType: "Property",
        entityId: id,
        metadata: { propertyName: property.name },
      },
    })

    return updated
  }

  static async updatePropertyStatus(id: string, data: any, userId: string) {
    const validated = propertyStatusSchema.parse(data)

    const property = await prisma.property.update({
      where: { id },
      data: validated,
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "PROPERTY_STATUS_CHANGED",
        entityType: "Property",
        entityId: id,
        metadata: {
          oldStatus: property.status,
          newStatus: validated.status,
          rejectionReason: validated.rejectionReason,
        },
      },
    })

    return property
  }

  static async deleteProperty(id: string, userId: string, userRole: string) {
    const property = await prisma.property.findUnique({
      where: { id },
    })

    if (!property) {
      throw new Error("Property not found")
    }

    // Landlords can only delete their own properties
    if (userRole === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId },
      })

      if (!landlordProfile || property.landlordId !== landlordProfile.id) {
        throw new Error("Unauthorized")
      }
    }

    await prisma.property.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "PROPERTY_DELETED",
        entityType: "Property",
        entityId: id,
        metadata: { propertyName: property.name },
      },
    })

    return { success: true }
  }

  static async getPropertyStats(landlordId?: string) {
    const where = landlordId ? { landlordId } : {}

    const properties = await prisma.property.findMany({
      where,
      include: {
        units: true,
      },
    })

    const totalProperties = properties.length
    const totalUnits = properties.reduce((sum, p) => sum + p.units.length, 0)
    const occupiedUnits = properties.reduce(
      (sum, p) => sum + p.units.filter((u) => u.status === "OCCUPIED").length,
      0
    )
    const vacantUnits = properties.reduce(
      (sum, p) => sum + p.units.filter((u) => u.status === "VACANT").length,
      0
    )
    const pendingProperties = properties.filter((p) => p.status === "PENDING_REVIEW").length

    return {
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      pendingProperties,
    }
  }
}
