import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// 1. Auth Endpoint (Mocked for speed and role verification)
app.post('/api/auth/login', async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  return res.json({ token: `mock-jwt-token-${user.id}`, user });
});

// 2. Customer Routes
app.get('/api/customers', async (req, res) => {
  const customers = await prisma.customer.findMany();
  res.json(customers);
});

app.post('/api/customers', async (req, res) => {
  const customer = await prisma.customer.create({ data: req.body });
  res.status(201).json(customer);
});

// 3. Product & Inventory Routes
app.get('/api/products', async (req, res) => {
  const products = await prisma.product.findMany();
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json(product);
});

// 4. Sales Challan Creation & Confirmation Logic (Transactional Inventory Locking)
app.post('/api/challans', async (req, res) => {
  const { customerId, items, createdBy } = req.body;
  
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  let totalQty = 0;
  const challanItemsData = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) return res.status(404).json({ error: `Product ID ${item.productId} not found` });

    totalQty += item.quantity;
    challanItemsData.push({
      productId: product.id,
      productName: product.name, // Snapshot data
      unitPrice: product.unitPrice, // Snapshot data
      quantity: item.quantity,
    });
  }

  const challan = await prisma.challan.create({
    data: {
      challanNumber: `CHN-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      totalQuantity: totalQty,
      createdBy,
      status: 'DRAFT',
      items: { create: challanItemsData },
    },
    include: { items: true },
  });

  res.status(201).json(challan);
});

// Confirm Challan Endpoint (Handles transactional stock deduction)
app.post('/api/challans/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.challan.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!challan) throw new Error('Challan not found');
      if (challan.status === 'CONFIRMED') throw new Error('Challan already confirmed');

      // Check stock levels first
      for (const item of challan.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.currentStock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${item.productName}`);
        }
      }

      // Deduct stock and log stock movement
      for (const item of challan.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { currentStock: { decrement: item.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            quantity: item.quantity,
            movementType: 'OUT',
            reason: `Challan Confirmed: ${challan.challanNumber}`,
            createdBy: userId || 'System',
          },
        });
      }

      return await tx.challan.update({
        where: { id },
        data: { status: 'CONFIRMED' },
      });
    });

    res.json({ message: 'Challan confirmed successfully', challan: result });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));