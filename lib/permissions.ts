import { auth } from "./auth"
import { Role } from "@prisma/client"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    redirect("/login")
  }
  return session
}

export async function requireRole(allowedRoles: Role[]) {
  const session = await requireAuth()
  const userRole = session.user.role as Role

  if (!allowedRoles.includes(userRole)) {
    redirect("/")
  }

  return session
}

export async function requireSuperAdmin() {
  return requireRole([Role.SUPER_ADMIN])
}

export async function requireSecretary() {
  return requireRole([Role.SUPER_ADMIN, Role.SECRETARY])
}

export async function requireLandlord() {
  return requireRole([Role.LANDLORD])
}

export async function requireTenant() {
  return requireRole([Role.TENANT])
}

export function hasRole(session: any, role: Role): boolean {
  return session?.user?.role === role
}

export function hasAnyRole(session: any, roles: Role[]): boolean {
  return roles.includes(session?.user?.role)
}

// Phase 3 Permissions - Finance and Payments
export async function requireFinanceAccess() {
  return requireRole([Role.SUPER_ADMIN, Role.SECRETARY, Role.LANDLORD])
}

export async function requirePaymentAccess() {
  return requireRole([Role.SUPER_ADMIN, Role.SECRETARY, Role.LANDLORD, Role.TENANT])
}

export async function requireStatementAccess() {
  return requireRole([Role.SUPER_ADMIN, Role.SECRETARY, Role.LANDLORD])
}

export async function requireExpenseAccess() {
  return requireRole([Role.SUPER_ADMIN, Role.SECRETARY, Role.LANDLORD])
}

// Resource ownership checks
export async function checkLandlordOwnership(landlordId: string, session: any) {
  if (session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SECRETARY) {
    return true
  }
  if (session?.user?.role === Role.LANDLORD) {
    return session?.user?.landlordProfileId === landlordId
  }
  return false
}

export async function checkTenantOwnership(tenantId: string, session: any) {
  if (session?.user?.role === Role.SUPER_ADMIN || session?.user?.role === Role.SECRETARY) {
    return true
  }
  if (session?.user?.role === Role.TENANT) {
    return session?.user?.tenantProfileId === tenantId
  }
  return false
}
