import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';

const API_BASE = 'http://localhost:5000/api';

interface Customer {
  id: string;
  name: string;
  businessName: string;
  mobile: string;
  email: string;
  address: string;
  status: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  unitPrice: number;
  currentStock: number;
  minStockAlert: number;
}

interface ChallanItem {
  id: string;
  quantity: number;
  price: number;
  product?: { name: string };
}

interface Challan {
  id: string;
  challanNumber: string;
  status: string;
  customer?: { name: string };
  items?: ChallanItem[];
}

export default function App() {
  const [activeRole, setActiveRole] = useState<'Admin' | 'Sales' | 'Warehouse' | 'Accounts'>('Admin');
  const [activeTab, setActiveTab] = useState<'crm' | 'inventory' | 'challan'>('crm');

  // Data States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [challans, setChallans] = useState<Challan[]>([]);

  // Search filter state
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [custForm, setCustForm] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    type: 'Wholesale',
    address: '',
    status: 'Lead',
    followUpDate: '',
    notes: '',
  });

  const [prodForm, setProdForm] = useState({
    name: '',
    sku: '',
    category: 'General',
    unitPrice: '',
    currentStock: '0',
    minStockAlert: '5',
    location: '',
  });

  const [stockForm, setStockForm] = useState({
    productId: '',
    type: 'IN',
    quantity: '1',
    reason: '',
  });

  // Challan Form State
  const [challanCustId, setChallanCustId] = useState('');
  const [challanItems, setChallanItems] = useState<Array<{ productId: string; quantity: number; price: number }>>([]);

  // Data Loading Helpers
  const loadCustomers = async () => {
    try {
      const res = await fetch(`${API_BASE}/customers`);
      if (res.ok) setCustomers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (res.ok) setProducts(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const loadChallans = async () => {
    try {
      const res = await fetch(`${API_BASE}/challans`);
      if (res.ok) setChallans(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchAll = async () => {
      try {
        const [custRes, prodRes, chalRes] = await Promise.all([
          fetch(`${API_BASE}/customers`),
          fetch(`${API_BASE}/products`),
          fetch(`${API_BASE}/challans`),
        ]);
        if (isMounted && custRes.ok) setCustomers(await custRes.json());
        if (isMounted && prodRes.ok) setProducts(await prodRes.json());
        if (isMounted && chalRes.ok) setChallans(await chalRes.json());
      } catch (e) {
        console.error(e);
      }
    };
    fetchAll();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handlers
  const handleCustSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...custForm, type: custForm.type.toUpperCase(), status: custForm.status.toUpperCase() }),
    });
    if (res.ok) {
      setCustForm({
        name: '',
        mobile: '',
        email: '',
        businessName: '',
        gstNumber: '',
        type: 'Wholesale',
        address: '',
        status: 'Lead',
        followUpDate: '',
        notes: '',
      });
      loadCustomers();
    }
  };

  const handleProdSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prodForm, category: prodForm.category.toUpperCase() }),
    });
    if (res.ok) {
      setProdForm({ name: '', sku: '', category: 'General', unitPrice: '', currentStock: '0', minStockAlert: '5', location: '' });
      loadProducts();
    }
  };

  const handleStockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_BASE}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stockForm),
    });
    if (res.ok) {
      setStockForm({ productId: '', type: 'IN', quantity: '1', reason: '' });
      loadProducts();
    }
  };

  const addChallanItem = (pId: string) => {
    const prod = products.find((p) => p.id === pId);
    if (!prod) return;
    setChallanItems([...challanItems, { productId: prod.id, quantity: 1, price: prod.unitPrice }]);
  };

  const handleChallanSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!challanCustId || challanItems.length === 0) return alert('Select customer and at least one product.');
    const res = await fetch(`${API_BASE}/challans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: challanCustId, items: challanItems }),
    });
    if (res.ok) {
      setChallanCustId('');
      setChallanItems([]);
      loadChallans();
      loadProducts();
      alert('Delivery Challan generated successfully!');
    }
  };

  // Search Filter
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.mobile.includes(searchQuery)
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#121212', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '10px' }}>Mini ERP + CRM Portal</h1>

      {/* RBAC Role Selection Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px',
          background: '#1e1e1e',
          padding: '12px',
          borderRadius: '8px',
        }}
      >
        <strong>Current Active Role:</strong>
        <select
          value={activeRole}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
            setActiveRole(e.target.value as 'Admin' | 'Sales' | 'Warehouse' | 'Accounts')
          }
          style={{ padding: '6px 12px', background: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px' }}
        >
          <option value="Admin">Admin (Full Access)</option>
          <option value="Sales">Sales (CRM & Products)</option>
          <option value="Warehouse">Warehouse (Inventory & Stock)</option>
          <option value="Accounts">Accounts (Challans)</option>
        </select>
      </div>

      {/* Module Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '30px' }}>
        {(activeRole === 'Admin' || activeRole === 'Sales') && (
          <button
            onClick={() => setActiveTab('crm')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'crm' ? '#4f46e5' : '#222',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Customer CRM
          </button>
        )}
        {(activeRole === 'Admin' || activeRole === 'Sales' || activeRole === 'Warehouse') && (
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'inventory' ? '#4f46e5' : '#222',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Inventory Management
          </button>
        )}
        {(activeRole === 'Admin' || activeRole === 'Accounts') && (
          <button
            onClick={() => setActiveTab('challan')}
            style={{
              padding: '10px 20px',
              background: activeTab === 'challan' ? '#4f46e5' : '#222',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Delivery Challans
          </button>
        )}
      </div>

      {/* MODULE 1: CUSTOMER CRM */}
      {activeTab === 'crm' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2>Customer CRM Module</h2>
          <form
            onSubmit={handleCustSubmit}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#1e1e1e', padding: '20px', borderRadius: '8px' }}
          >
            <input placeholder="Customer Name *" required value={custForm.name} onChange={(e) => setCustForm({ ...custForm, name: e.target.value })} style={{ padding: '8px' }} />
            <input placeholder="Business Name *" required value={custForm.businessName} onChange={(e) => setCustForm({ ...custForm, businessName: e.target.value })} style={{ padding: '8px' }} />
            <input placeholder="Mobile *" required value={custForm.mobile} onChange={(e) => setCustForm({ ...custForm, mobile: e.target.value })} style={{ padding: '8px' }} />
            <input placeholder="Email *" required value={custForm.email} onChange={(e) => setCustForm({ ...custForm, email: e.target.value })} style={{ padding: '8px' }} />
            <input placeholder="Address *" required value={custForm.address} onChange={(e) => setCustForm({ ...custForm, address: e.target.value })} style={{ gridColumn: 'span 2', padding: '8px' }} />
            <button type="submit" style={{ gridColumn: 'span 2', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              Save Customer
            </button>
          </form>

          <input
            placeholder="🔍 Search customer by name, business, or mobile..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px', marginTop: '20px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '6px' }}
          />

          <h3 style={{ marginTop: '20px' }}>Customers Directory ({filteredCustomers.length})</h3>
          {filteredCustomers.map((c) => (
            <div key={c.id} style={{ background: '#2a2a2a', padding: '12px', marginBottom: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{c.name}</strong> ({c.businessName})<br />
                <span style={{ fontSize: '13px', color: '#aaa' }}>
                  📞 {c.mobile} | ✉️ {c.email} | 📍 {c.address}
                </span>
              </div>
              <span style={{ padding: '4px 8px', background: '#3b82f6', borderRadius: '4px', fontSize: '12px' }}>{c.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* MODULE 2: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2>Inventory & Stock Management</h2>
          <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Add New Product</h3>
            <form onSubmit={handleProdSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input placeholder="Product Name *" required value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} style={{ padding: '8px' }} />
              <input placeholder="SKU Code *" required value={prodForm.sku} onChange={(e) => setProdForm({ ...prodForm, sku: e.target.value })} style={{ padding: '8px' }} />
              <input placeholder="Unit Price ($) *" type="number" required value={prodForm.unitPrice} onChange={(e) => setProdForm({ ...prodForm, unitPrice: e.target.value })} style={{ padding: '8px' }} />
              <input placeholder="Initial Stock" type="number" value={prodForm.currentStock} onChange={(e) => setProdForm({ ...prodForm, currentStock: e.target.value })} style={{ padding: '8px' }} />
              <button type="submit" style={{ gridColumn: 'span 2', padding: '10px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px' }}>
                Add Product
              </button>
            </form>
          </div>

          <div style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Log Stock Movement (IN / OUT)</h3>
            <form onSubmit={handleStockSubmit} style={{ display: 'flex', gap: '10px' }}>
              <select value={stockForm.productId} onChange={(e) => setStockForm({ ...stockForm, productId: e.target.value })} required style={{ padding: '8px' }}>
                <option value="">Select Product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stock: {p.currentStock})
                  </option>
                ))}
              </select>
              <select value={stockForm.type} onChange={(e) => setStockForm({ ...stockForm, type: e.target.value })} style={{ padding: '8px' }}>
                <option value="IN">Stock IN (+)</option>
                <option value="OUT">Stock OUT (-)</option>
              </select>
              <input type="number" min="1" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} style={{ width: '80px', padding: '8px' }} />
              <button type="submit" style={{ padding: '8px 16px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px' }}>
                Update Stock
              </button>
            </form>
          </div>

          <h3>Product Directory</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1e1e1e' }}>
            <thead>
              <tr style={{ background: '#2a2a2a', borderBottom: '1px solid #444' }}>
                <th style={{ padding: '10px' }}>SKU</th>
                <th style={{ padding: '10px' }}>Name</th>
                <th style={{ padding: '10px' }}>Unit Price</th>
                <th style={{ padding: '10px' }}>Stock</th>
                <th style={{ padding: '10px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #333', textAlign: 'center' }}>
                  <td style={{ padding: '10px' }}>{p.sku}</td>
                  <td style={{ padding: '10px' }}>{p.name}</td>
                  <td style={{ padding: '10px' }}>${p.unitPrice}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{p.currentStock}</td>
                  <td style={{ padding: '10px' }}>
                    {p.currentStock <= p.minStockAlert ? <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ LOW STOCK</span> : <span style={{ color: '#10b981' }}>OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODULE 3: DELIVERY CHALLAN */}
      {activeTab === 'challan' && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2>Delivery Challan Module</h2>
          <form onSubmit={handleChallanSubmit} style={{ background: '#1e1e1e', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3>Create Delivery Challan</h3>
            <label style={{ display: 'block', marginBottom: '10px' }}>
              Select Customer:
              <select value={challanCustId} onChange={(e) => setChallanCustId(e.target.value)} required style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                <option value="">Choose Customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.businessName})
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'block', marginBottom: '10px' }}>
              Add Items to Dispatched List:
              <select onChange={(e) => { if (e.target.value) addChallanItem(e.target.value); }} style={{ width: '100%', padding: '8px', marginTop: '5px' }}>
                <option value="">Select Product to Dispatch...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} - ${p.unitPrice} (Available: {p.currentStock})
                  </option>
                ))}
              </select>
            </label>

            {challanItems.length > 0 && (
              <div style={{ margin: '15px 0', background: '#2a2a2a', padding: '10px', borderRadius: '6px' }}>
                <h4>Line Items:</h4>
                {challanItems.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '5px' }}>
                      <span style={{ flex: 1 }}>{prod?.name}</span>
                      <span>
                        Qty:{' '}
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...challanItems];
                            updated[idx].quantity = parseInt(e.target.value || '1', 10);
                            setChallanItems(updated);
                          }}
                          style={{ width: '60px' }}
                        />
                      </span>
                      <span>${item.price * item.quantity}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <button type="submit" style={{ width: '100%', padding: '10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}>
              Issue Delivery Challan & Update Stock
            </button>
          </form>

          <h3>Issued Delivery Challans ({challans.length})</h3>
          {challans.map((ch) => (
            <div key={ch.id} style={{ background: '#2a2a2a', padding: '12px', marginBottom: '10px', borderRadius: '6px' }}>
              <strong>{ch.challanNumber}</strong> | Customer: <strong>{ch.customer?.name}</strong> | Status: <span style={{ color: '#10b981' }}>{ch.status}</span>
              <ul style={{ margin: '5px 0 0 20px', fontSize: '13px', color: '#ccc' }}>
                {ch.items?.map((it) => (
                  <li key={it.id}>
                    {it.product?.name} x {it.quantity} @ ${it.price}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}