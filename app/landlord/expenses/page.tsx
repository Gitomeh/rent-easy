import { requireLandlord } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Receipt, CheckCircle, XCircle, Clock } from "lucide-react"
import Link from "next/link"

export default async function LandlordExpensesPage() {
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

  const expenses = await prisma.expense.findMany({
    where: { landlordId: landlordProfile.id },
    include: {
      property: true,
      unit: true,
    },
    orderBy: { expenseDate: "desc" },
  })

  const stats = {
    total: expenses.length,
    pending: expenses.filter((e) => e.status === "PENDING_APPROVAL").length,
    approved: expenses.filter((e) => e.status === "APPROVED").length,
    rejected: expenses.filter((e) => e.status === "REJECTED").length,
  }

  const totalAmount = expenses.filter((e) => e.status === "APPROVED").reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
            <p className="mt-2 text-gray-600">Track and manage your property expenses</p>
          </div>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="h-4 w-4" />
            Add Expense
          </button>
        </div>

        <div className="mb-6 flex gap-4 border-b pb-4">
          <Link href="/landlord" className="text-gray-600 hover:text-blue-600 pb-2">
            Dashboard
          </Link>
          <Link href="/landlord/finance" className="text-gray-600 hover:text-blue-600 pb-2">
            Finance
          </Link>
          <Link href="/landlord/expenses" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
            Expenses
          </Link>
          <Link href="/landlord/statements" className="text-gray-600 hover:text-blue-600 pb-2">
            Statements
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <Receipt className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No expenses recorded yet</p>
            ) : (
              <div className="space-y-4">
                {expenses.map((expense) => (
                  <div key={expense.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{expense.description}</h3>
                        <p className="text-gray-600 text-sm">{expense.category.replace("_", " ")}</p>
                        {expense.property && (
                          <p className="text-sm text-gray-600">Property: {expense.property.name}</p>
                        )}
                        {expense.unit && <p className="text-sm text-gray-600">Unit: {expense.unit.unitNumber}</p>}
                        <p className="text-sm text-gray-500 mt-2">
                          Date: {new Date(expense.expenseDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold">KES {expense.amount.toLocaleString()}</p>
                        <span
                          className={`mt-2 px-3 py-1 rounded text-sm font-medium ${
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
