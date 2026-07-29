import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

dotenv.config();

const app = express();

// Initialize Prisma Driver Adapter for Prisma v7
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper to access challan delegate regardless of schema naming (challan vs deliveryChallan)
const getChallanDelegate = (client: any) => {
  return client.challan || client.deliveryChallan;
};

// ================= CUSTOMERS API =================

// Get all customers
app.get('/api/customers', async (_req: Request, res: Response) => {
  try {
    const customers = await prisma.customer.findMany();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// Create new customer
app.post('/api/customers', async (req: Request, res: Response) => {
  try {
    const { name, mobile, email, businessName, gstNumber, type, address, status, followUpDate, notes } = req.body;
    const customer = await prisma.customer.create({
      data: {
        name,
        mobile,
        email,
        businessName,
        gstNumber,
        type: type || 'WHOLESALE',
        address,
        status: status || 'LEAD',
        followUpDate: followUpDate ? new Date(followUpDate) : null,
        notes,
      },
    });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// ================= PRODUCTS API =================

// Get all products
app.get('/api/products', async (_req: Request, res: Response) => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Create product
app.post('/api/products', async (req: Request, res: Response) => {
  try {
    const { name, sku, category, unitPrice, currentStock, minStockAlert, location } = req.body;
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category: category || 'GENERAL',
        unitPrice: parseFloat(unitPrice),
        currentStock: parseInt(currentStock) || 0,
        minStockAlert: parseInt(minStockAlert) || 5,
        location,
      },
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ================= STOCK MOVEMENTS API =================

// Log Stock Movement & Update Stock
app.post('/api/stock', async (req: Request, res: Response) => {
  try {
    const { productId, type, movementType, quantity, reason } = req.body;
    const stockType = movementType || type || 'IN';
    const qty = parseInt(quantity);

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create stock movement record using connection mapping
      const movement = await tx.stockMovement.create({
        data: {
          product: { connect: { id: productId } },
          type: stockType,
          quantity: qty,
          reason,
        } as any,
      });

      // 2. Update product stock level
      const stockChange = stockType === 'IN' ? qty : -qty;
      await tx.product.update({
        where: { id: productId },
        data: {
          currentStock: {
            increment: stockChange,
          },
        },
      });

      return movement;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Stock Movement Error:', error);
    res.status(500).json({ error: 'Failed to record stock movement' });
  }
});

// ================= DELIVERY CHALLANS API =================

// Get all challans
app.get('/api/challans', async (_req: Request, res: Response) => {
  try {
    const challanDelegate = getChallanDelegate(prisma);
    const challans = await challanDelegate.findMany({
      include: {
        customer: true,
        items: true,
      },
    });
    res.json(challans);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch delivery challans' });
  }
});

// Create delivery challan and deduct stock in a transaction
app.post('/api/challans', async (req: Request, res: Response) => {
  try {
    const { customerId, items } = req.body; // items: [{ productId, quantity, price }]
    const challanNumber = `CH-${Date.now().toString().slice(-6)}`;

    const result = await prisma.$transaction(async (tx: any) => {
      const challanDelegate = getChallanDelegate(tx);

      // 1. Create Delivery Challan
      const challan = await challanDelegate.create({
        data: {
          challanNumber,
          customer: { connect: { id: customerId } },
          status: 'ISSUED',
          items: {
            create: items.map((item: { productId: string; quantity: number; price: number }) => ({
              product: { connect: { id: item.productId } },
              quantity: item.quantity,
              price: item.price,
            })),
          },
        } as any,
        include: {
          items: true,
        },
      });

      // 2. Deduct stock for each line item and create stock movement logs
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            product: { connect: { id: item.productId } },
            type: 'OUT',
            quantity: item.quantity,
            reason: `Dispatched via ${challanNumber}`,
          } as any,
        });
      }

      return challan;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Delivery Challan Error:', error);
    res.status(500).json({ error: 'Failed to generate delivery challan' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});