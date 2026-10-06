import { prisma } from "@/lib/prisma"

export enum NotificationType {
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  RENT_DUE = "RENT_DUE",
  RENT_OVERDUE = "RENT_OVERDUE",
  APPLICATION_RECEIVED = "APPLICATION_RECEIVED",
  APPLICATION_APPROVED = "APPLICATION_APPROVED",
  APPLICATION_REJECTED = "APPLICATION_REJECTED",
  TENANCY_CREATED = "TENANCY_CREATED",
  TENANCY_EXPIRING = "TENANCY_EXPIRING",
  EXPENSE_APPROVED = "EXPENSE_APPROVED",
  EXPENSE_REJECTED = "EXPENSE_REJECTED",
  STATEMENT_GENERATED = "STATEMENT_GENERATED",
  MAINTENANCE_REQUEST = "MAINTENANCE_REQUEST",
}

export interface NotificationData {
  type: NotificationType
  recipientId: string
  recipientType: "TENANT" | "LANDLORD" | "ADMIN"
  recipientPhone?: string
  recipientEmail?: string
  subject?: string
  message: string
  metadata?: Record<string, any>
}

export class NotificationService {
  // Send SMS notification
  static async sendSMS(data: NotificationData): Promise<boolean> {
    try {
      // In production, integrate with SMS provider (e.g., Africa's Talking, Twilio, Infobip)
      // For now, we'll log the notification
      console.log("SMS Notification:", {
        to: data.recipientPhone,
        message: data.message,
        type: data.type,
      })

      // Example Africa's Talking integration:
      // const response = await fetch('https://api.africastalking.com/version1/messaging', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/x-www-form-urlencoded',
      //   },
      //   body: new URLSearchParams({
      //     username: process.env.AFRICASTALKING_USERNAME,
      //     to: data.recipientPhone,
      //     message: data.message,
      //     apiKey: process.env.AFRICASTALKING_API_KEY,
      //   }),
      // })

      // Log to database
      await prisma.auditLog.create({
        data: {
          action: "SMS_SENT",
          entityType: "Notification",
          metadata: {
            type: data.type,
            recipientId: data.recipientId,
            recipientPhone: data.recipientPhone,
            message: data.message,
          },
        },
      })

      return true
    } catch (error) {
      console.error("Error sending SMS:", error)
      return false
    }
  }

  // Send Email notification
  static async sendEmail(data: NotificationData): Promise<boolean> {
    try {
      // In production, integrate with email provider (e.g., SendGrid, Mailgun, AWS SES)
      // For now, we'll log the notification
      console.log("Email Notification:", {
        to: data.recipientEmail,
        subject: data.subject,
        message: data.message,
        type: data.type,
      })

      // Example SendGrid integration:
      // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     personalizations: [{
      //       to: [{ email: data.recipientEmail }],
      //       subject: data.subject,
      //     }],
      //     from: { email: process.env.SENDGRID_FROM_EMAIL },
      //     content: [{
      //       type: 'text/plain',
      //       value: data.message,
      //     }],
      //   }),
      // })

      // Log to database
      await prisma.auditLog.create({
        data: {
          action: "EMAIL_SENT",
          entityType: "Notification",
          metadata: {
            type: data.type,
            recipientId: data.recipientId,
            recipientEmail: data.recipientEmail,
            subject: data.subject,
            message: data.message,
          },
        },
      })

      return true
    } catch (error) {
      console.error("Error sending email:", error)
      return false
    }
  }

  // Send notification (SMS and/or Email based on preferences)
  static async send(data: NotificationData, channels: ("sms" | "email")[] = ["email"]): Promise<{
    sms: boolean
    email: boolean
  }> {
    const results = {
      sms: false,
      email: false,
    }

    if (channels.includes("sms") && data.recipientPhone) {
      results.sms = await this.sendSMS(data)
    }

    if (channels.includes("email") && data.recipientEmail) {
      results.email = await this.sendEmail(data)
    }

    return results
  }

  // Specific notification helpers
  static async notifyPaymentReceived(paymentId: string) {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        tenant: { include: { user: true } },
        tenancy: {
          include: {
            landlord: { include: { user: true } },
            property: true,
          },
        },
      },
    })

    if (!payment) return

    // Notify tenant
    await this.send({
      type: NotificationType.PAYMENT_RECEIVED,
      recipientId: payment.tenantId,
      recipientType: "TENANT",
      recipientPhone: payment.tenant.user.phone,
      recipientEmail: payment.tenant.user.email,
      subject: "Payment Received",
      message: `Your payment of KES ${payment.amount.toLocaleString()} for ${payment.tenancy.property.name} has been received. Receipt: ${payment.receiptNumber}`,
      metadata: { paymentId },
    })

    // Notify landlord
    await this.send({
      type: NotificationType.PAYMENT_RECEIVED,
      recipientId: payment.tenancy.landlordId,
      recipientType: "LANDLORD",
      recipientPhone: payment.tenancy.landlord.user.phone,
      recipientEmail: payment.tenancy.landlord.user.email,
      subject: "Payment Received",
      message: `Payment of KES ${payment.amount.toLocaleString()} received from ${payment.tenant.user.name} for ${payment.tenancy.property.name}`,
      metadata: { paymentId },
    })
  }

  static async notifyRentDue(tenancyId: string) {
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: tenancyId },
      include: {
        tenant: { include: { user: true } },
        property: true,
      },
    })

    if (!tenancy) return

    await this.send({
      type: NotificationType.RENT_DUE,
      recipientId: tenancy.tenantId,
      recipientType: "TENANT",
      recipientPhone: tenancy.tenant.user.phone,
      recipientEmail: tenancy.tenant.user.email,
      subject: "Rent Payment Due",
      message: `Your rent payment of KES ${tenancy.monthlyRent.toLocaleString()} for ${tenancy.property.name} is due soon. Please make payment to avoid late fees.`,
      metadata: { tenancyId },
    })
  }

  static async notifyApplicationReceived(applicationId: string) {
    const application = await prisma.rentalApplication.findUnique({
      where: { id: applicationId },
      include: {
        property: {
          include: {
            landlord: { include: { user: true } },
          },
        },
        tenant: { include: { user: true } },
      },
    })

    if (!application) return

    await this.send({
      type: NotificationType.APPLICATION_RECEIVED,
      recipientId: application.property.landlordId,
      recipientType: "LANDLORD",
      recipientPhone: application.property.landlord.user.phone,
      recipientEmail: application.property.landlord.user.email,
      subject: "New Rental Application",
      message: `You have received a new rental application from ${application.tenant.user.name} for ${application.property.name}`,
      metadata: { applicationId },
    })
  }

  static async notifyApplicationApproved(applicationId: string) {
    const application = await prisma.rentalApplication.findUnique({
      where: { id: applicationId },
      include: {
        property: true,
        tenant: { include: { user: true } },
      },
    })

    if (!application) return

    await this.send({
      type: NotificationType.APPLICATION_APPROVED,
      recipientId: application.tenantId,
      recipientType: "TENANT",
      recipientPhone: application.tenant.user.phone,
      recipientEmail: application.tenant.user.email,
      subject: "Application Approved",
      message: `Congratulations! Your rental application for ${application.property.name} has been approved. Please contact the landlord to proceed.`,
      metadata: { applicationId },
    })
  }

  static async notifyApplicationRejected(applicationId: string) {
    const application = await prisma.rentalApplication.findUnique({
      where: { id: applicationId },
      include: {
        property: true,
        tenant: { include: { user: true } },
      },
    })

    if (!application) return

    await this.send({
      type: NotificationType.APPLICATION_REJECTED,
      recipientId: application.tenantId,
      recipientType: "TENANT",
      recipientPhone: application.tenant.user.phone,
      recipientEmail: application.tenant.user.email,
      subject: "Application Status Update",
      message: `Your rental application for ${application.property.name} has been reviewed. Unfortunately, it was not approved at this time.`,
      metadata: { applicationId },
    })
  }

  static async notifyStatementGenerated(statementId: string) {
    const statement = await prisma.statement.findUnique({
      where: { id: statementId },
      include: {
        landlord: { include: { user: true } },
      },
    })

    if (!statement) return

    await this.send({
      type: NotificationType.STATEMENT_GENERATED,
      recipientId: statement.landlordId,
      recipientType: "LANDLORD",
      recipientPhone: statement.landlord.user.phone,
      recipientEmail: statement.landlord.user.email,
      subject: "Statement Generated",
      message: `Your statement for the period ${new Date(statement.periodStart).toLocaleDateString()} to ${new Date(statement.periodEnd).toLocaleDateString()} has been generated. Net payable: KES ${statement.netPayable.toLocaleString()}`,
      metadata: { statementId },
    })
  }
}
