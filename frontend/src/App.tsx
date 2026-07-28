import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

export default function App() {
  const [role, setRole] = useState<'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS'>('ADMIN');
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_BASE}/customers`).then(res => res.json()).then(setCustomers).catch(() => {});
    fetch(`${API_BASE}/products`).then(res => res.json()).then(setProducts).catch(() => {});
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Mini ERP + CRM Portal</h1>
      <div style={{ marginBottom: '20px' }}>
        <label><b>Current Role View: </b></label>
        <select value={role} onChange={(e: any) => setRole(e.target.value)}>
          <option value="ADMIN">Admin</option>
          <option value="SALES">Sales</option>
          <option value="WAREHOUSE">Warehouse</option>
          <option value="ACCOUNTS">Accounts</option>
        </select>
      </div>

      <hr />

      <section>
        <h2>Customers ({customers.length})</h2>
        <ul>
          {customers.map((c) => (
            <li key={c.id}>{c.name} - {c.businessName} ({c.type})</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Products & Stock ({products.length})</h2>
        <ul>
          {products.map((p) => (
            <li key={p.id}>{p.name} | SKU: {p.sku} | Stock: {p.currentStock} | Price: ₹{p.unitPrice}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}