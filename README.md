# Rent Easy

**"Find Your Place. Live With Ease."**

Rent Easy is a Kenyan rental/property-management platform that connects tenants with available properties and helps property owners manage rentals.

## Current Phase

**Phase 3 — Payments, Finance & Notifications**

This phase completes the platform with payment processing, financial management, expense tracking, statement generation, and notification systems.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma 5
- **Authentication**: NextAuth.js (Credentials provider)
- **Validation**: Zod
- **Password Hashing**: bcryptjs
- **Payments**: M-Pesa Integration (STK Push)
- **Notifications**: SMS (Africa's Talking), Email (SendGrid)

## Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud-based)
- npm or pnpm

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the following environment variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/rent_easy?schema=public"

# Authentication (NextAuth.js)
AUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"

# M-Pesa Configuration
MPESA_CONSUMER_KEY="your-mpesa-consumer-key"
MPESA_CONSUMER_SECRET="your-mpesa-consumer-secret"
MPESA_PASSKEY="your-mpesa-passkey"
MPESA_SHORTCODE="your-mpesa-shortcode"
MPESA_ENVIRONMENT="sandbox" # or "production"

# SMS Notification (Africa's Talking)
AFRICASTALKING_USERNAME="your-africastalking-username"
AFRICASTALKING_API_KEY="your-africastalking-api-key"

# Email Notification (SendGrid)
SENDGRID_API_KEY="your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="noreply@renteasy.co.ke"
```

**Important**: 
- Generate a secure `AUTH_SECRET` using: `openssl rand -base64 32`
- Never commit `.env` to version control
- Use different secrets for production

### 3. Database Setup

#### Option A: Local PostgreSQL

If you have PostgreSQL installed locally:

```bash
# Create database
createdb rent_easy

# Run migrations
npm run db:migrate

# Seed database with demo data
npm run db:seed
```

#### Option B: Cloud PostgreSQL (Supabase, Neon, Railway)

1. Create a PostgreSQL database on your preferred cloud service
2. Get the connection string
3. Update `DATABASE_URL` in `.env`
4. Run migrations and seed:
```bash
npm run db:migrate
npm run db:seed
```

#### Option C: Docker (Recommended for Development)

```bash
# Start PostgreSQL container
docker run --name rent-easy-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=rent_easy \
  -p 5432:5432 \
  -d postgres:15

# Run migrations
npm run db:migrate

# Seed database
npm run db:seed
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:reset     # Reset database (⚠️ deletes all data)
```

## Demo Credentials

The seed script creates the following demo accounts (password: `Demo123!`):

### Admin Access
- **Super Admin**: admin@renteasy.local
- **Secretary**: secretary@renteasy.local

### Landlord Access
- **Landlord 1**: landlord1@renteasy.local
- **Landlord 2**: landlord2@renteasy.local

### Tenant Access
- **Tenant 1**: tenant1@renteasy.local
- **Tenant 2**: tenant2@renteasy.local
- **Tenant 3**: tenant3@renteasy.local

**⚠️ Security Warning**: These credentials are for development only. Never use them in production.

## Database Schema

### Core Models

- **User**: Authentication and user management
- **Role**: SUPER_ADMIN, SECRETARY, LANDLORD, TENANT
- **LandlordProfile**: Extended landlord information
- **TenantProfile**: Extended tenant information
- **Property**: Property listings with approval workflow
- **Unit**: Individual rental units within properties
- **PropertyImage**: Property images
- **RentalApplication**: Tenant rental applications
- **Tenancy**: Active tenancy agreements
- **AuditLog**: System activity tracking

### Key Relationships

```
User (Landlord) → LandlordProfile → Property → Unit → RentalApplication
User (Tenant) → TenantProfile → RentalApplication
User (Admin/Secretary) → AuditLog
```

## Role-Based Access Control (RBAC)

### Super Admin
- Full system administration
- Create/manage users
- Approve/reject properties
- View all data
- Access audit logs

### Secretary
- View properties, units, landlords, tenants
- View rental applications
- View reports
- ❌ Cannot manage system configuration
- ❌ Cannot delete critical records
- ❌ Cannot modify user roles

### Landlord
- Create/manage own landlord profile
- Submit properties
- View/edit own properties
- Manage own units
- View own rental applications
- ❌ Cannot access other landlords' data
- ❌ Cannot access admin functions

### Tenant
- Manage own profile
- View available properties
- Submit rental applications
- View own applications
- ❌ Cannot access landlord dashboards
- ❌ Cannot view other tenants' data

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js handler
- `GET /api/auth/session` - Get current session

### Properties
- `GET /api/properties` - List properties (with filters)
- `POST /api/properties` - Create property (landlord only)
- `GET /api/properties/[id]` - Get property details
- `PUT /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property
- `PUT /api/properties/[id]/status` - Update property status (admin/secretary)
- `GET /api/properties/[id]/applications` - Get property applications

### Units
- `POST /api/units` - Create unit
- `GET /api/units/[id]` - Get unit details
- `PUT /api/units/[id]` - Update unit
- `DELETE /api/units/[id]` - Delete unit

### Applications
- `GET /api/applications` - List user's applications
- `POST /api/applications` - Submit rental application (tenant only)
- `GET /api/applications/[id]` - Get application details
- `PUT /api/applications/[id]` - Update application status

## Security Features

### Authentication
- Secure password hashing with bcrypt
- JWT-based sessions
- Protected routes with middleware
- Role-based redirects

### Authorization
- Server-side permission checks
- Resource ownership verification
- IDOR (Insecure Direct Object Reference) protection
- Data isolation between landlords and tenants

### Validation
- Server-side Zod validation
- Input sanitization
- Error handling without exposing sensitive data

### Audit Logging
- Tracks sensitive operations
- User attribution
- Entity-level tracking
- Timestamped records

## Dashboards

### Admin Dashboard (`/admin`)
- System statistics
- User management
- Property approval workflow
- Audit log viewer

### Secretary Dashboard (`/secretary`)
- View-only access to properties, units, landlords, tenants
- Rental application overview
- Report generation

### Landlord Dashboard (`/landlord`)
- Property management
- Unit management
- Rental application tracking
- Occupancy statistics

### Tenant Dashboard (`/tenant`)
- Rental application history
- Application status tracking
- Profile management
- Tenancy information (future)

## Data Ownership & Isolation

### Landlord Isolation
- Landlords can only access their own properties
- Cannot view or modify other landlords' data
- Server-side verification on all property/unit operations

### Tenant Isolation
- Tenants can only view their own applications
- Cannot access other tenants' information
- Cannot access landlord financial data

### Public Access
- Only approved properties are visible to public
- Vacant units only shown in listings
- Private information (phone, email) not exposed

## Pending Database Setup

⚠️ **Important**: Database migrations have not been run yet because PostgreSQL is not installed on this system.

To complete the setup:

1. Install PostgreSQL locally or use a cloud service
2. Configure `DATABASE_URL` in `.env`
3. Run: `npm run db:migrate`
4. Run: `npm run db:seed`

## Phase 3 Features (Implemented)

### Payment Processing
- **M-Pesa Integration**: STK Push for mobile payments
- **Payment Recording**: Manual payment entry for cash/bank transfers
- **Payment Tracking**: Full payment history and status tracking
- **Receipt Generation**: Automatic receipt numbering
- **Payment Status**: PENDING, CONFIRMED, FAILED, REVERSED, CANCELLED

### Financial Management
- **Rent Charges**: Automated rent charge generation
- **Balance Calculation**: Real-time landlord balance computation
- **Management Fees**: Configurable percentage-based fees
- **Income Tracking**: Rent collection and other income sources
- **Expense Tracking**: Property-related expense management

### Expense Management
- **Expense Categories**: Repair, Maintenance, Utilities, Cleaning, Security, Management, Other
- **Approval Workflow**: Pending → Approved/Rejected
- **Expense Recording**: Landlords can submit expenses
- **Rejection Reasons**: Track why expenses were rejected
- **Expense History**: Complete expense audit trail

### Statement Generation
- **Statement Creation**: Automated monthly statements
- **Approval Workflow**: Generated → Reviewed → Approved → Finalized
- **Financial Summary**: Rent collected, expenses, management fees, net payable
- **Opening Balance**: Carried forward from previous statements
- **Statement History**: Complete statement archive

### Notification System
- **SMS Notifications**: Africa's Talking integration (ready for configuration)
- **Email Notifications**: SendGrid integration (ready for configuration)
- **Notification Types**:
  - Payment received/failed
  - Rent due/overdue
  - Application received/approved/rejected
  - Tenancy created/expiring
  - Expense approved/rejected
  - Statement generated
- **Multi-channel**: Send via SMS, email, or both

### API Endpoints

**Payments**:
- `GET /api/payments` - List payments (filtered by role)
- `POST /api/payments` - Record payment
- `GET /api/payments/[id]` - Get payment details
- `PUT /api/payments/[id]` - Update payment status

**Expenses**:
- `GET /api/expenses` - List expenses (filtered by role)
- `POST /api/expenses` - Create expense
- `GET /api/expenses/[id]` - Get expense details
- `PUT /api/expenses/[id]` - Approve/reject expense
- `DELETE /api/expenses/[id]` - Delete expense

**Statements**:
- `GET /api/statements` - List statements (filtered by role)
- `POST /api/statements` - Generate statement
- `GET /api/statements/[id]` - Get statement details
- `PUT /api/statements/[id]` - Approve/finalize statement

**Rent Charges**:
- `GET /api/rent-charges` - List rent charges for tenancy
- `POST /api/rent-charges` - Create rent charge

**Tenancies**:
- `GET /api/tenancies` - List tenancies (filtered by role)
- `POST /api/tenancies` - Create tenancy
- `GET /api/tenancies/[id]` - Get tenancy details
- `PUT /api/tenancies/[id]` - Update tenancy status

**M-Pesa**:
- `POST /api/mpesa/stkpush` - Initiate STK Push payment
- `POST /api/mpesa/callback` - M-Pesa callback handler

### Phase 3 Dashboards

**Landlord Finance Dashboard** (`/landlord/finance`):
- Total rent collected
- Total expenses
- Net income
- Recent payments
- Recent expenses
- Statement summary

**Landlord Expenses Dashboard** (`/landlord/expenses`):
- Total expenses
- Pending/approved/rejected counts
- Expense list with status
- Add expense functionality

**Landlord Statements Dashboard** (`/landlord/statements`):
- Statement history
- Statement status tracking
- Download finalized statements
- Financial summaries

**Tenant Payments Dashboard** (`/tenant/payments`):
- Total paid
- Pending charges
- Payment history
- Payment status tracking
- M-Pesa payment initiation

**Tenant Tenancy Dashboard** (`/tenant/tenancy`):
- Active tenancy details
- Property information
- Landlord contact
- Rent charges
- Payment history
- Tenancy history

## Future Features (Not Yet Implemented)

The following features are planned for future phases:

- Maintenance request system
- AI chatbot backend
- WhatsApp integration
- Advanced dispute management
- Document management
- Support ticket system
- Notification preferences UI

The database schema is designed to support all future modules.

## Testing

### Manual Testing Checklist

- [ ] Register as tenant
- [ ] Register as landlord
- [ ] Login with demo credentials
- [ ] Test role-based redirects
- [ ] Test landlord property submission
- [ ] Test tenant application submission
- [ ] Test admin property approval
- [ ] Test data isolation (landlord A cannot access landlord B's properties)
- [ ] Test logout and session invalidation
- [ ] Test protected routes when logged out

### Authorization Testing

Test IDOR protection by attempting to access:
- `/api/properties/[another-landlord's-property-id]` (should fail)
- `/api/applications/[another-tenant's-application]` (should fail)
- Direct URL access to unauthorized dashboards (should redirect)

## Troubleshooting

### Database Connection Issues
```
Error: Can't reach database server at `localhost:5432`
```
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists

### Prisma Client Issues
```bash
npm run db:generate
```

### Build Errors
```bash
npm run build
npx tsc --noEmit
```

### Session Issues
- Clear browser cookies
- Check `AUTH_SECRET` is set
- Verify `NEXTAUTH_URL` matches your domain

## Development Notes

- The project uses Prisma 5 (not the newer Prisma 8)
- NextAuth.js beta version for Next.js 16 compatibility
- Middleware is used for route protection
- All sensitive operations require server-side verification
- Never trust client-supplied IDs for authorization

## License

Proprietary - Rent Easy

## Support

For support, contact the Rent Easy development team.

**Contact Information:**
- **Email**: renteasy26@gmail.com
- **Phone**: 0715366415

## System Administrator

**Super Admin Account:**
- **Email**: renteasy26@gmail.com
- **Password**: 123
- **Role**: Super Admin (Full system access)
