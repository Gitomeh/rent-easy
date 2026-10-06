import { requireTenant } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Home, User, Clock, CreditCard, Building2 } from "lucide-react"
import Link from "next/link"

export default async function TenantDashboard() {
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
            <p className="text-gray-600">Your tenant profile could not be found. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const applications = await prisma.rentalApplication.findMany({
    where: { tenantId: tenantProfile.id },
    include: {
      property: {
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
      unit: true,
    },
    orderBy: { submittedAt: "desc" },
  })

  const stats = {
    totalApplications: applications.length,
    pendingApplications: applications.filter((a) => a.status === "SUBMITTED" || a.status === "UNDER_REVIEW").length,
    approvedApplications: applications.filter((a) => a.status === "APPROVED").length,
    rejectedApplications: applications.filter((a) => a.status === "REJECTED").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tenant Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {session.user.name}</p>
        </div>

        <div className="mb-6 flex gap-4 border-b pb-4">
          <Link href="/tenant" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
            Dashboard
          </Link>
          <Link href="/tenant/payments" className="text-gray-600 hover:text-blue-600 pb-2">
            Payments
          </Link>
          <Link href="/tenant/tenancy" className="text-gray-600 hover:text-blue-600 pb-2">
            My Tenancy
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <Home className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profile</CardTitle>
              <User className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium">Active</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Rental Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                You haven't submitted any applications yet.{" "}
                <Link href="/properties" className="text-blue-600 hover:underline">
                  Browse available properties
                </Link>
              </p>
            ) : (
              <div className="space-y-4">
                {applications.map((application) => (
                  <div key={application.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{application.property.name}</h3>
                        <p className="text-gray-600 text-sm">{application.property.location}</p>
                        {application.unit && (
                          <p className="text-sm text-gray-600">Unit: {application.unit.unitNumber}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          Submitted: {new Date(application.submittedAt!).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          application.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : application.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : application.status === "WITHDRAWN"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {application.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/tenant/payments" className="hover:opacity-80">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">View payment history and make payments</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/tenant/tenancy" className="hover:opacity-80">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Tenancy</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">View rental agreement and details</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Tenancy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              No active tenancy information available yet. When your application is approved and you
              move in, your tenancy details will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
