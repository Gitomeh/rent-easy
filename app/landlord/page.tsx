import { requireLandlord } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, CheckCircle, Clock, FileText, Plus, DollarSign, Receipt, Wallet } from "lucide-react"
import Link from "next/link"

export default async function LandlordDashboard() {
  const session = await requireLandlord()

  const landlordProfile = await prisma.landlordProfile.findUnique({
    where: { userId: session.user.id },
  })

  if (!landlordProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Your landlord profile could not be found. Please contact support.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const properties = await prisma.property.findMany({
    where: { landlordId: landlordProfile.id },
    include: {
      units: true,
      images: {
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const stats = {
    totalProperties: properties.length,
    totalUnits: properties.reduce((sum, p) => sum + p.units.length, 0),
    occupiedUnits: properties.reduce((sum, p) => sum + p.units.filter((u) => u.status === "OCCUPIED").length, 0),
    vacantUnits: properties.reduce((sum, p) => sum + p.units.filter((u) => u.status === "VACANT").length, 0),
    pendingProperties: properties.filter((p) => p.status === "PENDING_REVIEW").length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Landlord Dashboard</h1>
            <p className="mt-2 text-gray-600">Welcome back, {session.user.name}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/list-property"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Add Property
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
              <Building2 className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <Home className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUnits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupied Units</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupiedUnits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <FileText className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingProperties}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vacant Units</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.vacantUnits}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/landlord/finance" className="hover:opacity-80">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finance</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">View income and expenses</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/landlord/expenses" className="hover:opacity-80">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                <Receipt className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Manage property expenses</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/landlord/statements" className="hover:opacity-80">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Statements</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">View financial statements</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="mb-6 flex gap-4 border-b pb-4">
          <Link href="/landlord" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
            Dashboard
          </Link>
          <Link href="/landlord/finance" className="text-gray-600 hover:text-blue-600 pb-2">
            Finance
          </Link>
          <Link href="/landlord/expenses" className="text-gray-600 hover:text-blue-600 pb-2">
            Expenses
          </Link>
          <Link href="/landlord/statements" className="text-gray-600 hover:text-blue-600 pb-2">
            Statements
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Properties</CardTitle>
          </CardHeader>
          <CardContent>
            {properties.length === 0 ? (
              <p className="text-gray-600 text-center py-8">
                You haven't listed any properties yet.{" "}
                <Link href="/list-property" className="text-blue-600 hover:underline">
                  Add your first property
                </Link>
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="border rounded-lg overflow-hidden">
                    {property.images[0] && (
                      <img
                        src={property.images[0].url}
                        alt={property.images[0].altText || property.name}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg">{property.name}</h3>
                      <p className="text-gray-600 text-sm">{property.location}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            property.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : property.status === "PENDING_REVIEW"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {property.status.replace("_", " ")}
                        </span>
                        <span className="text-sm text-gray-600">
                          {property.units.length} units
                        </span>
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
