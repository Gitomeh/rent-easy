import { requireLandlord } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Download, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

export default async function LandlordStatementsPage() {
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

  const statements = await prisma.statement.findMany({
    where: { landlordId: landlordProfile.id },
    orderBy: { periodStart: "desc" },
  })

  const stats = {
    total: statements.length,
    finalized: statements.filter((s) => s.status === "FINALIZED").length,
    pending: statements.filter((s) => s.status === "GENERATED" || s.status === "REVIEWED").length,
  }

  const totalNetPayable = statements
    .filter((s) => s.status === "FINALIZED")
    .reduce((sum, s) => sum + s.netPayable, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Statements</h1>
          <p className="mt-2 text-gray-600">View your financial statements and payment summaries</p>
        </div>

        <div className="mb-6 flex gap-4 border-b pb-4">
          <Link href="/landlord" className="text-gray-600 hover:text-blue-600 pb-2">
            Dashboard
          </Link>
          <Link href="/landlord/finance" className="text-gray-600 hover:text-blue-600 pb-2">
            Finance
          </Link>
          <Link href="/landlord/expenses" className="text-gray-600 hover:text-blue-600 pb-2">
            Expenses
          </Link>
          <Link href="/landlord/statements" className="text-blue-600 font-medium border-b-2 border-blue-600 pb-2">
            Statements
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Statements</CardTitle>
              <FileText className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Finalized</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.finalized}</div>
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Statement History</CardTitle>
          </CardHeader>
          <CardContent>
            {statements.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No statements generated yet</p>
            ) : (
              <div className="space-y-4">
                {statements.map((statement) => (
                  <div key={statement.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          Statement: {new Date(statement.periodStart).toLocaleDateString()} -{" "}
                          {new Date(statement.periodEnd).toLocaleDateString()}
                        </h3>
                        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Rent Collected</p>
                            <p className="font-medium">KES {statement.rentCollected.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Expenses</p>
                            <p className="font-medium">KES {statement.expenses.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Management Fees</p>
                            <p className="font-medium">KES {statement.managementFees.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Net Payable</p>
                            <p className="font-bold text-green-600">KES {statement.netPayable.toLocaleString()}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          Generated: {new Date(statement.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <span
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            statement.status === "FINALIZED"
                              ? "bg-green-100 text-green-800"
                              : statement.status === "APPROVED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {statement.status.replace("_", " ")}
                        </span>
                        {statement.status === "FINALIZED" && (
                          <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm">
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                        )}
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
