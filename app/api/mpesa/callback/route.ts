import { NextRequest, NextResponse } from "next/server"
import { MpesaService } from "@/lib/services/mpesa"

// POST /api/mpesa/callback - M-Pesa STK Push callback
export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json()

    // Process the callback
    await MpesaService.processCallback(callbackData)

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
  } catch (error: any) {
    console.error("Error processing M-Pesa callback:", error)
    // Always return success to M-Pesa to avoid retries
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
  }
}
