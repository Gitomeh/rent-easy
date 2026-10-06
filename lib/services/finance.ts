import { prisma } from "@/lib/prisma"
import { PaymentType, PaymentMethod, PaymentStatus, RentChargeStatus, ExpenseStatus, ExpenseCategory } from "@prisma/client"

export class FinanceService {
  // Rent Charge Management
  static async createRentCharge(data: {
    tenancyId: string
    amount: number
    dueDate: Date
    billingPeriod: string
  }) {
    return prisma.rentCharge.create({
      data,
      include: {
        tenancy: {
          include: {
            tenant: { include: { user: true } },
            property: true,
            unit: true,
          },
        },
      },
    })
  }

  static async getRentChargesByTenancy(tenancyId: string) {
    return prisma.rentCharge.findMany({
      where: { tenancyId },
      include: {
        payments: true,
      },
      orderBy: { dueDate: "desc" },
    })
  }

  static async updateRentChargeStatus(id: string, status: RentChargeStatus) {
    return prisma.rentCharge.update({
      where: { id },
      data: { status },
    })
  }

  // Payment Management
  static async createPayment(data: {
    tenantId: string
    tenancyId: string
    propertyId: string
    unitId: string
    amount: number
    paymentType: PaymentType
    paymentMethod: PaymentMethod
    paymentDate: Date
    recordedBy: string
    rentChargeIds?: string[]
  }) {
    const payment = await prisma.payment.create({
      data: {
        ...data,
        receiptNumber: await this.generateReceiptNumber(),
        status: PaymentStatus.CONFIRMED,
      },
    })

    // Link payment to rent charges if provided
    if (data.rentChargeIds && data.rentChargeIds.length > 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          rentCharges: {
            connect: data.rentChargeIds.map((id) => ({ id })),
          },
        },
      })

      // Update rent charge statuses
      for (const chargeId of data.rentChargeIds) {
        await this.updateRentChargeStatus(chargeId, RentChargeStatus.PARTIALLY_PAID)
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: data.recordedBy,
        action: "PAYMENT_CREATED",
        entityType: "Payment",
        entityId: payment.id,
        metadata: {
          amount: data.amount,
          tenantId: data.tenantId,
          receiptNumber: payment.receiptNumber,
        },
      },
    })

    return payment
  }

  static async getPaymentsByTenant(tenantId: string) {
    return prisma.payment.findMany({
      where: { tenantId },
      include: {
        tenancy: {
          include: {
            property: true,
            unit: true,
          },
        },
        rentCharges: true,
      },
      orderBy: { paymentDate: "desc" },
    })
  }

  static async getPaymentsByLandlord(landlordId: string) {
    const properties = await prisma.property.findMany({
      where: { landlordId },
      select: { id: true },
    })

    const propertyIds = properties.map((p) => p.id)

    return prisma.payment.findMany({
      where: { propertyId: { in: propertyIds } },
      include: {
        tenant: { include: { user: true } },
        tenancy: true,
        rentCharges: true,
      },
      orderBy: { paymentDate: "desc" },
    })
  }

  static async updatePaymentStatus(id: string, status: PaymentStatus, userId: string) {
    const payment = await prisma.payment.update({
      where: { id },
      data: { status },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "PAYMENT_STATUS_CHANGED",
        entityType: "Payment",
        entityId: id,
        metadata: { newStatus: status },
      },
    })

    return payment
  }

  private static async generateReceiptNumber(): Promise<string> {
    const prefix = "REC"
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    // Find the last receipt number for today
    const lastPayment = await prisma.payment.findFirst({
      where: {
        receiptNumber: {
          startsWith: `${prefix}${year}${month}${day}`,
        },
      },
      orderBy: { receiptNumber: "desc" },
    })

    let sequence = 1
    if (lastPayment) {
      const lastSequence = parseInt(lastPayment.receiptNumber.slice(-4))
      sequence = lastSequence + 1
    }

    const sequenceStr = String(sequence).padStart(4, "0")
    return `${prefix}${year}${month}${day}${sequenceStr}`
  }

  // Expense Management
  static async createExpense(data: {
    landlordId: string
    propertyId?: string
    unitId?: string
    category: ExpenseCategory
    description: string
    amount: number
    expenseDate: Date
    createdBy: string
  }) {
    const expense = await prisma.expense.create({
      data: {
        ...data,
        status: ExpenseStatus.PENDING_APPROVAL,
      },
      include: {
        landlord: { include: { user: true } },
        property: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: data.createdBy,
        action: "EXPENSE_CREATED",
        entityType: "Expense",
        entityId: expense.id,
        metadata: {
          amount: data.amount,
          category: data.category,
          landlordId: data.landlordId,
        },
      },
    })

    return expense
  }

  static async getExpensesByLandlord(landlordId: string) {
    return prisma.expense.findMany({
      where: { landlordId },
      include: {
        property: true,
        unit: true,
      },
      orderBy: { expenseDate: "desc" },
    })
  }

  static async approveExpense(id: string, userId: string) {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.APPROVED,
        approvedBy: userId,
        approvedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "EXPENSE_APPROVED",
        entityType: "Expense",
        entityId: id,
        metadata: { amount: expense.amount },
      },
    })

    return expense
  }

  static async rejectExpense(id: string, reason: string, userId: string) {
    const expense = await prisma.expense.update({
      where: { id },
      data: {
        status: ExpenseStatus.REJECTED,
        rejectedBy: userId,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId,
        action: "EXPENSE_REJECTED",
        entityType: "Expense",
        entityId: id,
        metadata: { amount: expense.amount, reason },
      },
    })

    return expense
  }

  // Landlord Balance Calculation
  static async calculateLandlordBalance(landlordId: string, periodStart?: Date, periodEnd?: Date) {
    const properties = await prisma.property.findMany({
      where: { landlordId },
      select: { id: true },
    })

    const propertyIds = properties.map((p) => p.id)

    // Get rent collected
    const payments = await prisma.payment.findMany({
      where: {
        propertyId: { in: propertyIds },
        paymentType: PaymentType.RENT,
        status: PaymentStatus.CONFIRMED,
        ...(periodStart && { paymentDate: { gte: periodStart } }),
        ...(periodEnd && { paymentDate: { lte: periodEnd } }),
      },
    })

    const rentCollected = payments.reduce((sum, p) => sum + p.amount, 0)

    // Get approved expenses
    const expenses = await prisma.expense.findMany({
      where: {
        landlordId,
        status: ExpenseStatus.APPROVED,
        ...(periodStart && { expenseDate: { gte: periodStart } }),
        ...(periodEnd && { expenseDate: { lte: periodEnd } }),
      },
    })

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    // Get management fee configuration
    const feeConfig = await prisma.managementFeeConfiguration.findFirst({
      where: { active: true },
      orderBy: { effectiveFrom: "desc" },
    })

    const managementFee = feeConfig ? Math.round(rentCollected * (feeConfig.percentage / 100)) : 0

    const netPayable = rentCollected - totalExpenses - managementFee

    return {
      rentCollected,
      totalExpenses,
      managementFee,
      netPayable,
    }
  }
}
