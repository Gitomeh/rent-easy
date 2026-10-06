import { prisma } from "@/lib/prisma"
import { UnitStatus } from "@prisma/client"
import { unitSchema, unitUpdateSchema } from "@/lib/validation/schemas"

export class UnitService {
  static async createUnit(data: any, propertyId: string, userId: string, userRole: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })

    if (!property) {
      throw new Error("Property not found")
    }

    // Landlords can only create units for their own properties
    if (userRole === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId },
      })

      if (!landlordProfile || property.landlordId !== landlordProfile.id) {
        throw new Error("Unauthorized")
      }
    }

    const validated = unitSchema.parse(data)

    const unit = await prisma.unit.create({
      data: {
        ...validated,
        propertyId,
        status: UnitStatus.VACANT,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UNIT_CREATED",
        entityType: "Unit",
        entityId: unit.id,
        metadata: { propertyId, unitNumber: unit.unitNumber },
      },
    })

    return unit
  }

  static async getUnitById(id: string) {
    return prisma.unit.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            images: true,
          },
        },
      },
    })
  }

  static async updateUnit(id: string, data: any, userId: string, userRole: string) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
      },
    })

    if (!unit) {
      throw new Error("Unit not found")
    }

    // Landlords can only update units in their own properties
    if (userRole === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId },
      })

      if (!landlordProfile || unit.property.landlordId !== landlordProfile.id) {
        throw new Error("Unauthorized")
      }
    }

    const validated = unitUpdateSchema.parse(data)

    const updated = await prisma.unit.update({
      where: { id },
      data: validated,
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UNIT_UPDATED",
        entityType: "Unit",
        entityId: id,
        metadata: { propertyId: unit.propertyId, unitNumber: unit.unitNumber },
      },
    })

    return updated
  }

  static async deleteUnit(id: string, userId: string, userRole: string) {
    const unit = await prisma.unit.findUnique({
      where: { id },
      include: {
        property: true,
      },
    })

    if (!unit) {
      throw new Error("Unit not found")
    }

    // Landlords can only delete units in their own properties
    if (userRole === "LANDLORD") {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId },
      })

      if (!landlordProfile || unit.property.landlordId !== landlordProfile.id) {
        throw new Error("Unauthorized")
      }
    }

    await prisma.unit.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "UNIT_DELETED",
        entityType: "Unit",
        entityId: id,
        metadata: { propertyId: unit.propertyId, unitNumber: unit.unitNumber },
      },
    })

    return { success: true }
  }

  static async getUnitsByProperty(propertyId: string, userId?: string, userRole?: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })

    if (!property) {
      throw new Error("Property not found")
    }

    // Landlords can only see units in their own properties
    if (userRole === "LANDLORD" && userId) {
      const landlordProfile = await prisma.landlordProfile.findUnique({
        where: { userId },
      })

      if (!landlordProfile || property.landlordId !== landlordProfile.id) {
        throw new Error("Unauthorized")
      }
    }

    return prisma.unit.findMany({
      where: { propertyId },
      orderBy: { unitNumber: "asc" },
    })
  }
}
