import { prisma } from "@/lib/prisma"
import { PaymentStatus, PaymentMethod, PaymentType } from "@prisma/client"

// M-Pesa configuration interface
interface MpesaConfig {
  consumerKey: string
  consumerSecret: string
  passkey: string
  shortcode: string
  environment: "sandbox" | "production"
}

// M-Pesa STK Push response
interface MpesaStkPushResponse {
  MerchantRequestID: string
  CheckoutRequestID: string
  ResponseCode: string
  ResponseDescription: string
  CustomerMessage: string
}

// M-Pesa callback data
interface MpesaCallbackData {
  Body: {
    stkCallback: {
      MerchantRequestID: string
      CheckoutRequestID: string
      ResultCode: number
      ResultDesc: string
      CallbackMetadata: {
        Item: Array<{
          Name: string
          Value: string | number
        }>
      }
    }
  }
}

export class MpesaService {
  private static config: MpesaConfig | null = null

  static configure(config: MpesaConfig) {
    this.config = config
  }

  private static getConfig(): MpesaConfig {
    if (!this.config) {
      throw new Error("M-Pesa not configured")
    }
    return this.config
  }

  private static getAuthUrl(): string {
    const config = this.getConfig()
    return config.environment === "sandbox"
      ? "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
      : "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
  }

  private static getStkPushUrl(): string {
    const config = this.getConfig()
    return config.environment === "sandbox"
      ? "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
      : "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
  }

  // Generate OAuth token
  private static async generateToken(): Promise<string> {
    const config = this.getConfig()
    const auth = Buffer.from(`${config.consumerKey}:${config.consumerSecret}`).toString("base64")

    const response = await fetch(this.getAuthUrl(), {
      method: "GET",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    })

    const data = await response.json()
    return data.access_token
  }

  // Format phone number to M-Pesa format (254...)
  private static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, "")

    // If starts with 0, replace with 254
    if (cleaned.startsWith("0")) {
      return "254" + cleaned.substring(1)
    }

    // If starts with +254, remove +
    if (cleaned.startsWith("+254")) {
      return cleaned.substring(1)
    }

    // If starts with 254, return as is
    if (cleaned.startsWith("254")) {
      return cleaned
    }

    // Default: add 254 prefix
    return "254" + cleaned
  }

  // Generate timestamp for M-Pesa
  private static generateTimestamp(): string {
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hour = String(date.getHours()).padStart(2, "0")
    const minute = String(date.getMinutes()).padStart(2, "0")
    const second = String(date.getSeconds()).padStart(2, "0")
    return `${year}${month}${day}${hour}${minute}${second}`
  }

  // Generate password for STK Push
  private static generatePassword(timestamp: string): string {
    const config = this.getConfig()
    const str = `${config.shortcode}${config.passkey}${timestamp}`
    return Buffer.from(str).toString("base64")
  }

  // Initiate STK Push
  static async initiateStkPush(data: {
    phoneNumber: string
    amount: number
    tenantId: string
    tenancyId: string
    propertyId: string
    unitId: string
    description: string
  }): Promise<MpesaStkPushResponse> {
    try {
      const config = this.getConfig()
      const token = await this.generateToken()
      const timestamp = this.generateTimestamp()
      const password = this.generatePassword(timestamp)
      const formattedPhone = this.formatPhoneNumber(data.phoneNumber)

      const requestBody = {
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: data.amount,
        PartyA: formattedPhone,
        PartyB: config.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: `${process.env.NEXTAUTH_URL}/api/mpesa/callback`,
        AccountReference: data.tenancyId,
        TransactionDesc: data.description,
      }

      const response = await fetch(this.getStkPushUrl(), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      // Create pending payment record
      if (result.ResponseCode === "0") {
        await prisma.payment.create({
          data: {
            tenantId: data.tenantId,
            tenancyId: data.tenancyId,
            propertyId: data.propertyId,
            unitId: data.unitId,
            amount: data.amount,
            paymentType: PaymentType.RENT,
            paymentMethod: PaymentMethod.MPESA,
            paymentDate: new Date(),
            status: PaymentStatus.PENDING,
            mpesaTransactionId: result.MerchantRequestID,
            mpesaPhoneNumber: formattedPhone,
            checkoutRequestId: result.CheckoutRequestID,
            receiptNumber: await this.generateTempReceiptNumber(),
          },
        })
      }

      return result
    } catch (error: any) {
      console.error("M-Pesa STK Push error:", error)
      throw new Error("Failed to initiate STK Push")
    }
  }

  // Process M-Pesa callback
  static async processCallback(callbackData: MpesaCallbackData): Promise<void> {
    try {
      const { Body } = callbackData
      const { stkCallback } = Body

      const checkoutRequestId = stkCallback.CheckoutRequestID
      const resultCode = stkCallback.ResultCode

      // Find the payment by checkout request ID
      const payment = await prisma.payment.findFirst({
        where: { checkoutRequestId },
      })

      if (!payment) {
        console.error("Payment not found for checkout request:", checkoutRequestId)
        return
      }

      if (resultCode === 0) {
        // Success - extract metadata
        const metadata = stkCallback.CallbackMetadata.Item
        const mpesaReceipt = metadata.find((item) => item.Name === "MpesaReceiptNumber")?.Value as string
        const transactionDate = metadata.find((item) => item.Name === "TransactionDate")?.Value as string
        const phoneNumber = metadata.find((item) => item.Name === "PhoneNumber")?.Value as string

        // Update payment
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.CONFIRMED,
            transactionReference: mpesaReceipt,
            mpesaTransactionId: mpesaReceipt,
            mpesaPhoneNumber: phoneNumber as string,
          },
        })

        // Link to rent charges if applicable
        // This logic can be enhanced based on business rules
      } else {
        // Failed
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
          },
        })
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          action: "MPESA_CALLBACK_PROCESSED",
          entityType: "Payment",
          entityId: payment.id,
          metadata: {
            resultCode,
            resultDesc: stkCallback.ResultDesc,
            checkoutRequestId,
          },
        },
      })
    } catch (error: any) {
      console.error("Error processing M-Pesa callback:", error)
      throw new Error("Failed to process callback")
    }
  }

  // Check STK Push status
  static async checkStatus(checkoutRequestId: string): Promise<any> {
    try {
      const config = this.getConfig()
      const token = await this.generateToken()
      const timestamp = this.generateTimestamp()
      const password = this.generatePassword(timestamp)

      const requestBody = {
        BusinessShortCode: config.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      }

      const url =
        config.environment === "sandbox"
          ? "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query"
          : "https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query"

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      return await response.json()
    } catch (error: any) {
      console.error("Error checking STK Push status:", error)
      throw new Error("Failed to check status")
    }
  }

  private static async generateTempReceiptNumber(): Promise<string> {
    const prefix = "MPESA"
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

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
}
