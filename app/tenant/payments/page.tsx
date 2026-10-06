import { requireTenant } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Smartphone, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"

export default async function TenantPaymentsPage() {
  const session = await requireTenant()

  const tenantProfile = await prisma.tenantProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!tenantProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Your tenant profile could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const payments = await prisma.payment.findMany({
    where: { tenantId: tenantProfile.id },
    include: {
      tenancy: {
        include: {
          property: true,
          unit: true,
        },
      },
    },
    orderBy: { paymentDate: "desc" },
  })

  // Get active tenancy
  const activeTenancy = await prisma.tenancy.findFirst({
    where: {
      tenantId: tenantProfile.id,
      status: "ACTIVE",
    },
    include: {
      rentCharges: {
        where: { status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] } },
        orderBy: { dueDate: "asc" },
      },
    },
  })

  const stats = {
    totalPaid: payments.filter((p) => p.status === "CONFIRMED").reduce((sum, p) => sum + p.amount, 0),
    pendingPayments: payments.filter((p) => p.status === "PENDING").length,
    failedPayments: payments.filter((p) => p.status === "FAILED").length,
    pendingCharges: activeTenancy?.rentCharges.length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="mt-2 text-gray-600">Manage your rent payments and view payment history</p>
        </div>

        <div className="mb-6 flex gap-4 border-b pb-4">
          <Link href="/tenant" className="text-gray-600 hover:text-blue-600 pb-2">
            Dashboard
          </Link>
          <Link href="/tenant/payments" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
            Payments
          </Link>
          <Link href="/tenant/tenancy" className="text-gray-600 hover:text-blue-600 pb-2">
            My Tenancy
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {stats.totalPaid.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Charges</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingCharges}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.failedPayments}</div>
            </CardContent>
          </Card>
        </div>

        {activeTenancy && activeTenancy.rentCharges.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pending Rent Charges</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeTenancy.rentCharges.map((charge) => (
                  <div key={charge.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <p className="font-medium">{charge.billingPeriod}</p>
                      <p className="text-sm text-gray-600">Due: {new Date(charge.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">KES {charge.amount.toLocaleString()}</p>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          charge.status === "OVERDUE"
                            ? "bg-red-100 text-red-800"
                            : charge.status === "PARTIALLY_PAID"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {charge.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No payments recorded yet</p>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div key={payment.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">KES {payment.amount.toLocaleString()}</h3>
                        <p className="text-gray-600 text-sm">{payment.tenancy.property.name}</p>
                        <p className="text-sm text-gray-600">Unit: {payment.tenancy.unit.unitNumber}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Date: {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                        {payment.receiptNumber && (
                          <p className="text-sm text-gray-600">Receipt: {payment.receiptNumber}</p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            payment.status === "CONFIRMED"
                              ? "bg-green-100 text-green-800"
                              : payment.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : payment.status === "FAILED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {payment.status.replace("_", " ")}
                        </span>
                        <span className="text-sm text-gray-600">{payment.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
