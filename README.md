# Mini ERP + CRM Operations Portal

A full-stack Mini ERP and CRM management portal built for distribution and wholesale operations. The application handles Customer CRM leads, Product Inventory, Stock Movements, and Sales/Delivery Challans with transaction-safe, real-time inventory deductions.

---

## 🏗️ Tech Stack & Architecture

### **Backend**
* **Runtime & Framework:** Node.js, Express.js (TypeScript)
* **Database & ORM:** PostgreSQL managed via Prisma ORM v7
* **Driver Adapter:** `@prisma/adapter-pg`

### **Frontend**
* **Framework:** React (TypeScript, HTML5, CSS3)
* **Design:** Clean, responsive admin-style UI with role-based component rendering

---

## 🔐 Role-Based Access Control (RBAC)

The system supports four distinct operational roles with tailored interface views:
* 👑 **Admin:** Unrestricted access across Customer CRM, Product Catalog, Inventory Stock Movements, and Delivery Challans.
* 💼 **Sales:** Focused on Customer CRM management (adding/searching leads) and browsing products.
* 📦 **Warehouse:** Access to Inventory Management and logging Stock `IN` / `OUT` movements.
* 🧾 **Accounts:** Dedicated access to generate, view, and process Delivery Challans.

---

## 🚀 Key Business Logic & Transaction Handling

1. **Transactional Delivery Challans:** When a delivery challan is issued, the backend runs a database `$transaction` to:
   * Create the Challan record.
   * Decrement stock directly on the corresponding products.
   * Auto-generate a `StockMovement` log linked to the product marked with type `OUT` and reason `Dispatched via CH-XXXXXX`.
2. **Preventing Negative Stock:** Stock decrements validate current quantities to ensure inventory levels remain accurate.
3. **Low Stock Indicators:** Products with stock equal to or lower than `minStockAlert` automatically display a visual warning badge (`⚠️ LOW STOCK`) on the dashboard.

---

## 🛠️ Local Setup & Running Guide

### Prerequisites
* **Node.js:** v18+
* **Database:** PostgreSQL database instance (Local or Cloud like Neon/Supabase)

### 1. Backend Configuration
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   npm install