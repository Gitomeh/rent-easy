import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { MpesaService } from "@/lib/services/mpesa"
import { mpesaStkPushSchema } from "@/lib/validation/schemas"
import { requireAuth } from "@/lib/permissions"

// POST /api/mpesa/stkpush - Initiate M-Pesa STK Push
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()

    // Only tenants can initiate payments for themselves
    if (session.user.role !== "TENANT") {
      return NextResponse.json({ error: "Only tenants can initiate payments" }, { status: 403 })
    }

    if (!session.user.tenantProfileId) {
      return NextResponse.json({ error: "Tenant profile not found" }, { status: 404 })
    }

    const body = await request.json()
    const validatedData = mpesaStkPushSchema.parse({
      ...body,
      tenantId: session.user.tenantProfileId,
    })

    // Verify tenant has active tenancy
    const { prisma } = await import("@/lib/prisma")
    const tenancy = await prisma.tenancy.findUnique({
      where: { id: validatedData.tenancyId },
    })

    if (!tenancy) {
      return NextResponse.json({ error: "Tenancy not found" }, { status: 404 })
    }

    if (tenancy.tenantId !== session.user.tenantProfileId) {
      return NextResponse.json({ error: "Unauthorized to pay for this tenancy" }, { status: 403 })
    }

    // Check if M-Pesa is configured
    if (!process.env.MPESA_CONSUMER_KEY || !process.env.MPESA_CONSUMER_SECRET || !process.env.MPESA_PASSKEY || !process.env.MPESA_SHORTCODE) {
      return NextResponse.json({ error: "M-Pesa not configured" }, { status: 500 })
    }

    // Configure M-Pesa service
    MpesaService.configure({
      consumerKey: process.env.MPESA_CONSUMER_KEY,
      consumerSecret: process.env.MPESA_CONSUMER_SECRET,
      passkey: process.env.MPESA_PASSKEY,
      shortcode: process.env.MPESA_SHORTCODE,
      environment: (process.env.MPESA_ENVIRONMENT as "sandbox" | "production") || "sandbox",
    })

    const result = await MpesaService.initiateStkPush({
      phoneNumber: validatedData.phoneNumber,
      amount: validatedData.amount,
      tenantId: validatedData.tenantId,
      tenancyId: validatedData.tenancyId,
      propertyId: tenancy.propertyId,
      unitId: tenancy.unitId,
      description: validatedData.description,
    })

    return NextResponse.json({ result })
  } catch (error: any) {
    console.error("Error initiating STK Push:", error)
    if (error.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message || "Failed to initiate STK Push" }, { status: 500 })
  }
}
