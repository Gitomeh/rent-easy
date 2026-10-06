import { PrismaClient, Role, PropertyType, PropertyStatus, UnitStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  const passwordHash = await bcrypt.hash('Demo123!', 10)

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@renteasy.local' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@renteasy.local',
      phone: '+254700000001',
      passwordHash,
      role: Role.SUPER_ADMIN,
      emailVerified: true,
    },
  })

  const secretary = await prisma.user.upsert({
    where: { email: 'secretary@renteasy.local' },
    update: {},
    create: {
      name: 'Office Secretary',
      email: 'secretary@renteasy.local',
      phone: '+254700000002',
      passwordHash,
      role: Role.SECRETARY,
      emailVerified: true,
    },
  })

  const landlord1 = await prisma.user.upsert({
    where: { email: 'landlord1@renteasy.local' },
    update: {},
    create: {
      name: 'John Kamau',
      email: 'landlord1@renteasy.local',
      phone: '+254700000010',
      passwordHash,
      role: Role.LANDLORD,
      emailVerified: true,
      landlordProfile: {
        create: {
          idNumber: '12345678',
        },
      },
    },
    include: {
      landlordProfile: true,
    },
  })

  const landlord2 = await prisma.user.upsert({
    where: { email: 'landlord2@renteasy.local' },
    update: {},
    create: {
      name: 'Mary Wanjiku',
      email: 'landlord2@renteasy.local',
      phone: '+254700000011',
      passwordHash,
      role: Role.LANDLORD,
      emailVerified: true,
      landlordProfile: {
        create: {
          idNumber: '87654321',
        },
      },
    },
    include: {
      landlordProfile: true,
    },
  })

  const tenant1 = await prisma.user.upsert({
    where: { email: 'tenant1@renteasy.local' },
    update: {},
    create: {
      name: 'Peter Ochieng',
      email: 'tenant1@renteasy.local',
      phone: '+254700000020',
      passwordHash,
      role: Role.TENANT,
      emailVerified: true,
      tenantProfile: {
        create: {
          idNumber: '11111111',
          emergencyContact: 'Jane Ochieng',
          emergencyPhone: '+254700000021',
        },
      },
    },
    include: {
      tenantProfile: true,
    },
  })

  const tenant2 = await prisma.user.upsert({
    where: { email: 'tenant2@renteasy.local' },
    update: {},
    create: {
      name: 'Grace Njeri',
      email: 'tenant2@renteasy.local',
      phone: '+254700000022',
      passwordHash,
      role: Role.TENANT,
      emailVerified: true,
      tenantProfile: {
        create: {
          idNumber: '22222222',
          emergencyContact: 'David Njeri',
          emergencyPhone: '+254700000023',
        },
      },
    },
    include: {
      tenantProfile: true,
    },
  })

  const tenant3 = await prisma.user.upsert({
    where: { email: 'tenant3@renteasy.local' },
    update: {},
    create: {
      name: 'James Mwangi',
      email: 'tenant3@renteasy.local',
      phone: '+254700000024',
      passwordHash,
      role: Role.TENANT,
      emailVerified: true,
      tenantProfile: {
        create: {
          idNumber: '33333333',
          emergencyContact: 'Sarah Mwangi',
          emergencyPhone: '+254700000025',
        },
      },
    },
    include: {
      tenantProfile: true,
    },
  })

  const property1 = await prisma.property.create({
    data: {
      landlordId: landlord1.landlordProfile!.id,
      name: 'Tiberious Plaza',
      description: 'Modern apartments in Olkalou town',
      propertyType: PropertyType.APARTMENT,
      address: 'Olkalou Town',
      town: 'Olkalou',
      county: 'Nyandarua',
      location: 'Olkalou',
      status: PropertyStatus.APPROVED,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85',
            altText: 'Modern apartment building exterior',
            sortOrder: 0,
          },
        ],
      },
      units: {
        create: [
          {
            unitNumber: 'A-101',
            bedrooms: 2,
            bathrooms: 2,
            monthlyRent: 25000,
            deposit: 25000,
            status: UnitStatus.VACANT,
          },
          {
            unitNumber: 'A-102',
            bedrooms: 2,
            bathrooms: 2,
            monthlyRent: 25000,
            deposit: 25000,
            status: UnitStatus.OCCUPIED,
          },
          {
            unitNumber: 'A-201',
            bedrooms: 3,
            bathrooms: 2,
            monthlyRent: 35000,
            deposit: 35000,
            status: UnitStatus.VACANT,
          },
        ],
      },
    },
    include: {
      units: true,
    },
  })

  const property2 = await prisma.property.create({
    data: {
      landlordId: landlord1.landlordProfile!.id,
      name: 'Gido Plaza',
      description: 'Quality apartments in Nakuru',
      propertyType: PropertyType.APARTMENT,
      address: 'Nakuru',
      town: 'Nakuru',
      county: 'Nakuru',
      location: 'Nakuru',
      status: PropertyStatus.APPROVED,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=85',
            altText: 'Apartment with garden view',
            sortOrder: 0,
          },
        ],
      },
      units: {
        create: [
          {
            unitNumber: 'B-101',
            bedrooms: 1,
            bathrooms: 1,
            monthlyRent: 15000,
            deposit: 15000,
            status: UnitStatus.VACANT,
          },
          {
            unitNumber: 'B-102',
            bedrooms: 1,
            bathrooms: 1,
            monthlyRent: 15000,
            deposit: 15000,
            status: UnitStatus.VACANT,
          },
        ],
      },
    },
    include: {
      units: true,
    },
  })

  const property3 = await prisma.property.create({
    data: {
      landlordId: landlord2.landlordProfile!.id,
      name: 'Jonajo House',
      description: 'Apartments in Olkalou town',
      propertyType: PropertyType.APARTMENT,
      address: 'Olkalou Town',
      town: 'Olkalou',
      county: 'Nyandarua',
      location: 'Olkalou',
      status: PropertyStatus.APPROVED,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85',
            altText: 'Modern apartment',
            sortOrder: 0,
          },
        ],
      },
      units: {
        create: [
          {
            unitNumber: 'C-101',
            bedrooms: 2,
            bathrooms: 2,
            monthlyRent: 48000,
            deposit: 48000,
            status: UnitStatus.VACANT,
          },
          {
            unitNumber: 'C-102',
            bedrooms: 2,
            bathrooms: 2,
            monthlyRent: 48000,
            deposit: 48000,
            status: UnitStatus.VACANT,
          },
        ],
      },
    },
    include: {
      units: true,
    },
  })

  const property4 = await prisma.property.create({
    data: {
      landlordId: landlord2.landlordProfile!.id,
      name: 'Lanet House',
      description: 'Family house in Nakuru',
      propertyType: PropertyType.HOUSE,
      address: 'Nakuru',
      town: 'Nakuru',
      county: 'Nakuru',
      location: 'Lanet',
      status: PropertyStatus.APPROVED,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1200&q=85',
            altText: 'Family home',
            sortOrder: 0,
          },
        ],
      },
      units: {
        create: [
          {
            unitNumber: 'H-001',
            bedrooms: 3,
            bathrooms: 2,
            monthlyRent: 32000,
            deposit: 32000,
            status: UnitStatus.VACANT,
          },
        ],
      },
    },
    include: {
      units: true,
    },
  })

  const property5 = await prisma.property.create({
    data: {
      landlordId: landlord1.landlordProfile!.id,
      name: 'Tewan Plaza',
      description: 'Studio apartments in Olkalou',
      propertyType: PropertyType.BEDSITTER,
      address: 'Olkalou Town',
      town: 'Olkalou',
      county: 'Nyandarua',
      location: 'Olkalou',
      status: PropertyStatus.PENDING_REVIEW,
      images: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85',
            altText: 'Studio apartment',
            sortOrder: 0,
          },
        ],
      },
      units: {
        create: [
          {
            unitNumber: 'S-101',
            bedrooms: 0,
            bathrooms: 1,
            monthlyRent: 9000,
            deposit: 9000,
            status: UnitStatus.VACANT,
          },
        ],
      },
    },
    include: {
      units: true,
    },
  })

  const application1 = await prisma.rentalApplication.create({
    data: {
      tenantId: tenant1.tenantProfile!.id,
      propertyId: property1.id,
      unitId: property1.units[0].id,
      status: 'SUBMITTED',
      applicantInformation: {
        employmentStatus: 'Employed',
        monthlyIncome: 50000,
        previousAddress: 'Nairobi',
      },
      moveInDate: new Date('2024-11-01'),
      occupants: 2,
      submittedAt: new Date(),
    },
  })

  const application2 = await prisma.rentalApplication.create({
    data: {
      tenantId: tenant2.tenantProfile!.id,
      propertyId: property3.id,
      unitId: property3.units[0].id,
      status: 'UNDER_REVIEW',
      applicantInformation: {
        employmentStatus: 'Self-employed',
        monthlyIncome: 80000,
        previousAddress: 'Mombasa',
      },
      moveInDate: new Date('2024-12-01'),
      occupants: 1,
      submittedAt: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: superAdmin.id,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: superAdmin.id,
      metadata: { role: 'SUPER_ADMIN' },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: landlord1.id,
      action: 'PROPERTY_CREATED',
      entityType: 'Property',
      entityId: property1.id,
      metadata: { propertyName: property1.name },
    },
  })

  await prisma.auditLog.create({
    data: {
      userId: tenant1.id,
      action: 'APPLICATION_SUBMITTED',
      entityType: 'RentalApplication',
      entityId: application1.id,
      metadata: { propertyId: property1.id },
    },
  })

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
