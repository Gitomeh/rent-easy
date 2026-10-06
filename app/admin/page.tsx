import { requireSuperAdmin } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building2, Home, FileText, CheckCircle, Clock, XCircle, DollarSign, Receipt, Wallet } from "lucide-react"

export default async function AdminDashboard() {
  const session = await requireSuperAdmin()

  const [
    totalUsers,
    totalLandlords,
    totalTenants,
    totalProperties,
    totalUnits,
    occupiedUnits,
    vacantUnits,
    pendingProperties,
    totalPayments,
    totalExpenses,
    pendingStatements,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "LANDLORD" } }),
    prisma.user.count({ where: { role: "TENANT" } }),
    prisma.property.count(),
    prisma.unit.count(),
    prisma.unit.count({ where: { status: "OCCUPIED" } }),
    prisma.unit.count({ where: { status: "VACANT" } }),
    prisma.property.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.payment.count({ where: { status: "CONFIRMED" } }),
    prisma.expense.count({ where: { status: "APPROVED" } }),
    prisma.statement.count({ where: { status: { in: ["GENERATED", "REVIEWED"] } } }),
  ])

  const recentAuditLogs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
    },
  })

  const stats = [
    { title: "Total Users", value: totalUsers, icon: Users, color: "blue" },
    { title: "Landlords", value: totalLandlords, icon: Building2, color: "green" },
    { title: "Tenants", value: totalTenants, icon: Users, color: "purple" },
    { title: "Properties", value: totalProperties, icon: Home, color: "orange" },
    { title: "Total Units", value: totalUnits, icon: Home, color: "blue" },
    { title: "Occupied Units", value: occupiedUnits, icon: CheckCircle, color: "green" },
    { title: "Vacant Units", value: vacantUnits, icon: Clock, color: "yellow" },
    { title: "Pending Reviews", value: pendingProperties, icon: FileText, color: "red" },
    { title: "Payments", value: totalPayments, icon: DollarSign, color: "green" },
    { title: "Expenses", value: totalExpenses, icon: Receipt, color: "red" },
    { title: "Pending Statements", value: pendingStatements, icon: Wallet, color: "blue" },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome back, {session.user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Finance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                View all payments, expenses, and financial transactions across the platform.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Statement Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Generate, review, and finalize landlord statements for payment processing.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expense Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Review and approve or reject landlord expense submissions.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAuditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="font-medium">{log.action}</p>
                    <p className="text-sm text-gray-600">
                      {log.user?.name || "System"} • {log.entityType}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
