import { prisma } from "@/lib/prisma"
import { StatementStatus } from "@prisma/client"
import { FinanceService } from "./finance"

export class StatementService {
  static async generateStatement(landlordId: string, periodStart: Date, periodEnd: Date, generatedBy: string) {
    // Check if statement already exists for this period
    const existing = await prisma.statement.findFirst({
      where: {
        landlordId,
        periodStart,
        periodEnd,
      },
    })

    if (existing) {
      throw new Error("Statement already exists for this period")
    }

    // Calculate financial data
    const balance = await FinanceService.calculateLandlordBalance(landlordId, periodStart, periodEnd)

    // Get opening balance (from previous statement or 0)
    const previousStatement = await prisma.statement.findFirst({
      where: {
        landlordId,
        periodEnd: { lt: periodStart },
        status: StatementStatus.FINALIZED,
      },
      orderBy: { periodEnd: "desc" },
    })

    const openingBalance = previousStatement?.netPayable || 0

    const statement = await prisma.statement.create({
      data: {
        landlordId,
        periodStart,
        periodEnd,
        openingBalance,
        rentCollected: balance.rentCollected,
        otherIncome: 0, // To be implemented
        expenses: balance.totalExpenses,
        managementFees: balance.managementFee,
        adjustments: 0, // To be implemented
        netPayable: openingBalance + balance.rentCollected - balance.totalExpenses - balance.managementFee,
        status: StatementStatus.GENERATED,
        generatedAt: new Date(),
      },
      include: {
        landlord: { include: { user: true } },
      },
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: generatedBy,
        action: "STATEMENT_GENERATED",
        entityType: "Statement",
        entityId: statement.id,
        metadata: {
          landlordId,
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
          netPayable: statement.netPayable,
        },
      },
    })

    return statement
  }

  static async approveStatement(id: string, approvedBy: string) {
    const statement = await prisma.statement.update({
      where: { id },
      data: {
        status: StatementStatus.APPROVED,
        approvedBy,
        approvedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: approvedBy,
        action: "STATEMENT_APPROVED",
        entityType: "Statement",
        entityId: id,
        metadata: { netPayable: statement.netPayable },
      },
    })

    return statement
  }

  static async finalizeStatement(id: string, finalizedBy: string) {
    const statement = await prisma.statement.update({
      where: { id },
      data: {
        status: StatementStatus.FINALIZED,
        finalizedBy,
        finalizedAt: new Date(),
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: finalizedBy,
        action: "STATEMENT_FINALIZED",
        entityType: "Statement",
        entityId: id,
        metadata: { netPayable: statement.netPayable },
      },
    })

    return statement
  }

  static async getStatementsByLandlord(landlordId: string) {
    return prisma.statement.findMany({
      where: { landlordId },
      orderBy: { periodStart: "desc" },
    })
  }

  static async getPendingStatements() {
    return prisma.statement.findMany({
      where: {
        status: { in: [StatementStatus.GENERATED, StatementStatus.REVIEWED] },
      },
      include: {
        landlord: { include: { user: true } },
      },
      orderBy: { generatedAt: "desc" },
    })
  }
}
