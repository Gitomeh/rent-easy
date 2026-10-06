import { requireLandlord } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Wallet, ArrowDown } from "lucide-react"
import Link from "next/link"

export default async function LandlordFinancePage() {
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
            <p className="text-gray-600">Your landlord profile could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get properties
  const properties = await prisma.property.findMany({
    where: { landlordId: landlordProfile.id },
    select: { id: true },
  })

  const propertyIds = properties.map((p) => p.id)

  // Get payments
  const payments = await prisma.payment.findMany({
    where: {
      propertyId: { in: propertyIds },
      status: "CONFIRMED",
    },
    orderBy: { paymentDate: "desc" },
    take: 10,
  })

  // Get expenses
  const expenses = await prisma.expense.findMany({
    where: { landlordId: landlordProfile.id },
    orderBy: { expenseDate: "desc" },
    take: 10,
  })

  // Calculate totals
  const totalRentCollected = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalExpenses = expenses.filter((e) => e.status === "APPROVED").reduce((sum, e) => sum + e.amount, 0)

  // Get statements
  const statements = await prisma.statement.findMany({
    where: { landlordId: landlordProfile.id },
    orderBy: { periodStart: "desc" },
    take: 5,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Finance Overview</h1>
          <p className="mt-2 text-gray-600">Manage your rental income and expenses</p>
        </div>

        <div className="mb-6 flex gap-4 border-b pb-4">
          <Link href="/landlord" className="text-gray-600 hover:text-blue-600 pb-2">
            Dashboard
          </Link>
          <Link href="/landlord/finance" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
            Finance
          </Link>
          <Link href="/landlord/expenses" className="text-gray-600 hover:text-blue-600 pb-2">
            Expenses
          </Link>
          <Link href="/landlord/statements" className="text-gray-600 hover:text-blue-600 pb-2">
            Statements
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rent Collected</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {totalRentCollected.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <ArrowDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {totalExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {(totalRentCollected - totalExpenses).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statements</CardTitle>
              <Wallet className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statements.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">KES {payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        {payment.paymentType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No expenses recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((expense) => (
                    <div key={expense.id} className="flex justify-between items-center border-b pb-2">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-600">{new Date(expense.expenseDate).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">KES {expense.amount.toLocaleString()}</p>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            expense.status === "APPROVED"
                              ? "bg-green-100 text-green-800"
                              : expense.status === "REJECTED"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {expense.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Statements</CardTitle>
          </CardHeader>
          <CardContent>
            {statements.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No statements generated yet</p>
            ) : (
              <div className="space-y-3">
                {statements.map((statement) => (
                  <div key={statement.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">
                        {new Date(statement.periodStart).toLocaleDateString()} -{" "}
                        {new Date(statement.periodEnd).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">Net Payable: KES {statement.netPayable.toLocaleString()}</p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        statement.status === "FINALIZED"
                          ? "bg-green-100 text-green-800"
                          : statement.status === "APPROVED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {statement.status.replace("_", " ")}
                    </span>
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
