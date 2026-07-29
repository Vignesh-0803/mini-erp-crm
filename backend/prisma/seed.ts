import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding sample data...');

  // Create Sample Customer
  const customer = await prisma.customer.create({
    data: {
      name: 'Alpha Traders',
      mobile: '9876543210',
      email: 'contact@alphatraders.com',
      businessName: 'Alpha Logistics',
      type: 'WHOLESALE',
      status: 'ACTIVE',
      address: 'Bhubaneswar, Odisha',
    },
  });

  // Create Sample Product
  const product = await prisma.product.create({
    data: {
      name: 'Industrial Valve 10mm',
      sku: 'VALVE-10MM',
      category: 'Hardware',
      unitPrice: 450,
      currentStock: 100,
      minStockAlert: 10,
      location: 'Warehouse A',
    },
  });

  console.log('Seeding complete!', { customer, product });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });