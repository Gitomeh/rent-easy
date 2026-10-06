import { requireTenant } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, Calendar, DollarSign, FileText, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export default async function TenantTenancyPage() {
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

  const tenancies = await prisma.tenancy.findMany({
    where: { tenantId: tenantProfile.id },
    include: {
      tenant: { include: { user: true } },
      landlord: { include: { user: true } },
      property: true,
      unit: true,
      rentCharges: {
        orderBy: { dueDate: "desc" },
        take: 5,
      },
      payments: {
        orderBy: { paymentDate: "desc" },
        take: 5,
      },
    },
    orderBy: { startDate: "desc" },
  })

  const activeTenancy = tenancies.find((t) => t.status === "ACTIVE")

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Tenancy</h1>
          <p className="mt-2 text-gray-600">View your rental agreement and tenancy details</p>
        </div>

        <div className="mb-6 flex gap-4 border-b pb-4">
          <Link href="/tenant" className="text-gray-600 hover:text-blue-600 pb-2">
            Dashboard
          </Link>
          <Link href="/tenant/payments" className="text-gray-600 hover:text-blue-600 pb-2">
            Payments
          </Link>
          <Link href="/tenant/tenancy" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
            My Tenancy
          </Link>
        </div>

        {!activeTenancy ? (
          <Card>
            <CardHeader>
              <CardTitle>No Active Tenancy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                You don't have an active tenancy. Browse available properties and submit an application to get
                started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Rent</CardTitle>
                  <DollarSign className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES {activeTenancy.monthlyRent.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Deposit</CardTitle>
                  <FileText className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">KES {activeTenancy.depositAmount.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Start Date</CardTitle>
                  <Calendar className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{new Date(activeTenancy.startDate).toLocaleDateString()}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Status</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeTenancy.status.replace("_", " ")}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Property Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Property</p>
                      <p className="font-medium">{activeTenancy.property.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium">{activeTenancy.property.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Unit</p>
                      <p className="font-medium">{activeTenancy.unit.unitNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bedrooms</p>
                      <p className="font-medium">{activeTenancy.unit.bedrooms}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Bathrooms</p>
                      <p className="font-medium">{activeTenancy.unit.bathrooms}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Landlord Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{activeTenancy.landlord.user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{activeTenancy.landlord.user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{activeTenancy.landlord.user.phone}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Rent Charges</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTenancy.rentCharges.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No rent charges yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activeTenancy.rentCharges.map((charge) => (
                        <div key={charge.id} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">{charge.billingPeriod}</p>
                            <p className="text-sm text-gray-600">Due: {new Date(charge.dueDate).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">KES {charge.amount.toLocaleString()}</p>
                            <span
                              className={`px-2 py-1 rounded text-xs ${
                                charge.status === "PAID"
                                  ? "bg-green-100 text-green-800"
                                  : charge.status === "OVERDUE"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {charge.status.replace("_", " ")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {activeTenancy.payments.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No payments yet</p>
                  ) : (
                    <div className="space-y-3">
                      {activeTenancy.payments.map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center border-b pb-2">
                          <div>
                            <p className="font-medium">KES {payment.amount.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              payment.status === "CONFIRMED"
                                ? "bg-green-100 text-green-800"
                                : payment.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {payment.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {tenancies.length > 1 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Tenancy History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenancies
                  .filter((t) => t.id !== activeTenancy?.id)
                  .map((tenancy) => (
                    <div key={tenancy.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{tenancy.property.name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(tenancy.startDate).toLocaleDateString()} -{" "}
                            {tenancy.endDate ? new Date(tenancy.endDate).toLocaleDateString() : "Present"}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            tenancy.status === "ACTIVE"
                              ? "bg-green-100 text-green-800"
                              : tenancy.status === "EXPIRED"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {tenancy.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
