import { z } from "zod"
import { PropertyType, PropertyStatus, UnitStatus, ApplicationStatus, PaymentType, PaymentMethod, PaymentStatus, ExpenseCategory, ExpenseStatus, StatementStatus } from "@prisma/client"

// Property validation
export const propertySchema = z.object({
  name: z.string().min(3, "Property name must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  propertyType: z.enum(["BEDSITTER", "APARTMENT", "FLAT", "HOUSE", "MAISONETTE", "COMMERCIAL", "OTHER"]),
  address: z.string().min(5, "Address must be at least 5 characters"),
  town: z.string().min(2, "Town must be at least 2 characters"),
  county: z.string().min(2, "County must be at least 2 characters"),
  location: z.string().optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "ARCHIVED"]).optional(),
  rejectionReason: z.string().optional(),
})

// Unit validation
export const unitSchema = z.object({
  unitNumber: z.string().min(1, "Unit number is required"),
  bedrooms: z.number().int().min(0, "Bedrooms must be 0 or more"),
  bathrooms: z.number().int().min(1, "Bathrooms must be at least 1"),
  monthlyRent: z.number().int().positive("Monthly rent must be positive"),
  deposit: z.number().int().positive("Deposit must be positive"),
  status: z.enum(["VACANT", "RESERVED", "OCCUPIED", "MAINTENANCE", "UNAVAILABLE"]).optional(),
  description: z.string().optional(),
})

// Rental application validation
export const rentalApplicationSchema = z.object({
  propertyId: z.string().uuid("Invalid property ID"),
  unitId: z.string().uuid("Invalid unit ID").optional(),
  moveInDate: z.coerce.date(),
  occupants: z.number().int().min(1, "At least 1 occupant required").max(20, "Maximum 20 occupants"),
  applicantInformation: z.object({
    employmentStatus: z.string().optional(),
    monthlyIncome: z.number().optional(),
    previousAddress: z.string().optional(),
  }),
})

// Property update validation
export const propertyUpdateSchema = propertySchema.partial()

// Unit update validation
export const unitUpdateSchema = unitSchema.partial()

// Property status update
export const propertyStatusSchema = z.object({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "APPROVED", "REJECTED", "SUSPENDED", "ARCHIVED"]),
  rejectionReason: z.string().optional(),
})

// User update validation
export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  isActive: z.boolean().optional(),
})

// Payment validation
export const paymentSchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID"),
  tenancyId: z.string().uuid("Invalid tenancy ID"),
  propertyId: z.string().uuid("Invalid property ID"),
  unitId: z.string().uuid("Invalid unit ID"),
  amount: z.number().int().positive("Amount must be positive"),
  paymentType: z.enum(["RENT", "DEPOSIT", "LATE_FEE", "OTHER"]),
  paymentMethod: z.enum(["MPESA", "BANK", "CASH", "CARD", "OTHER"]),
  paymentDate: z.coerce.date(),
  recordedBy: z.string().uuid("Invalid user ID"),
  rentChargeIds: z.array(z.string().uuid()).optional(),
  transactionReference: z.string().optional(),
  mpesaTransactionId: z.string().optional(),
  mpesaPhoneNumber: z.string().optional(),
  merchantReference: z.string().optional(),
  checkoutRequestId: z.string().optional(),
})

// Payment status update
export const paymentStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "FAILED", "REVERSED", "CANCELLED"]),
})

// Rent charge validation
export const rentChargeSchema = z.object({
  tenancyId: z.string().uuid("Invalid tenancy ID"),
  amount: z.number().int().positive("Amount must be positive"),
  dueDate: z.coerce.date(),
  billingPeriod: z.string().min(1, "Billing period is required"),
})

// Rent charge status update
export const rentChargeStatusSchema = z.object({
  status: z.enum(["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "WAIVED", "CANCELLED"]),
})

// Expense validation
export const expenseSchema = z.object({
  landlordId: z.string().uuid("Invalid landlord ID"),
  propertyId: z.string().uuid("Invalid property ID").optional(),
  unitId: z.string().uuid("Invalid unit ID").optional(),
  category: z.enum(["REPAIR", "MAINTENANCE", "UTILITIES", "CLEANING", "SECURITY", "MANAGEMENT", "OTHER"]),
  description: z.string().min(5, "Description must be at least 5 characters"),
  amount: z.number().int().positive("Amount must be positive"),
  expenseDate: z.coerce.date(),
  createdBy: z.string().uuid("Invalid user ID"),
})

// Expense status update
export const expenseStatusSchema = z.object({
  status: z.enum(["PENDING_APPROVAL", "APPROVED", "REJECTED", "CANCELLED"]),
  rejectionReason: z.string().optional(),
})

// Statement generation validation
export const statementSchema = z.object({
  landlordId: z.string().uuid("Invalid landlord ID"),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  generatedBy: z.string().uuid("Invalid user ID"),
})

// Statement status update
export const statementStatusSchema = z.object({
  status: z.enum(["DRAFT", "GENERATED", "REVIEWED", "APPROVED", "FINALIZED"]),
})

// Tenancy validation
export const tenancySchema = z.object({
  tenantId: z.string().uuid("Invalid tenant ID"),
  landlordId: z.string().uuid("Invalid landlord ID"),
  propertyId: z.string().uuid("Invalid property ID"),
  unitId: z.string().uuid("Invalid unit ID"),
  applicationId: z.string().uuid("Invalid application ID").optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  monthlyRent: z.number().int().positive("Monthly rent must be positive"),
  depositAmount: z.number().int().positive("Deposit amount must be positive"),
})

// Tenancy status update
export const tenancyStatusSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "EXPIRED", "TERMINATED", "SUSPENDED"]),
})

// M-Pesa STK Push validation
export const mpesaStkPushSchema = z.object({
  phoneNumber: z.string().regex(/^254\d{9}$/, "Invalid phone number. Use format 254XXXXXXXXX"),
  amount: z.number().int().positive("Amount must be positive"),
  tenantId: z.string().uuid("Invalid tenant ID"),
  tenancyId: z.string().uuid("Invalid tenancy ID"),
  description: z.string().min(1, "Description is required"),
})
