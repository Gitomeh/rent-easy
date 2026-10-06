import { requireSecretary } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Home, CheckCircle, Clock, FileText, Users } from "lucide-react"

export default async function SecretaryDashboard() {
  const session = await requireSecretary()

  const [
    totalProperties,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    pendingProperties,
    totalApplications,
  ] = await Promise.all([
    prisma.property.count({ where: { status: "APPROVED" } }),
    prisma.unit.count(),
    prisma.unit.count({ where: { status: "OCCUPIED" } }),
    prisma.unit.count({ where: { status: "VACANT" } }),
    prisma.property.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.rentalApplication.count(),
  ])

  const stats = [
    { title: "Approved Properties", value: totalProperties, icon: Building2, color: "blue" },
    { title: "Total Units", value: totalUnits, icon: Home, color: "green" },
    { title: "Occupied Units", value: occupiedUnits, icon: CheckCircle, color: "green" },
    { title: "Vacant Units", value: vacantUnits, icon: Clock, color: "yellow" },
    { title: "Pending Reviews", value: pendingProperties, icon: FileText, color: "red" },
    { title: "Total Applications", value: totalApplications, icon: Users, color: "purple" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Secretary Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {session.user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Secretary Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              As a Secretary, you have view-only access to properties, units, landlords, tenants,
              and rental applications. You can view reports and export permitted information.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
