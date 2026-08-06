import React, { useState } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { getOrders, addOrder, updateOrderStatus, Order } from '@/store/mockStore';
import { useSettings } from '@/contexts/SettingsContext';

const statusColor = (s: string) => {
  if (s === 'Delivered') return 'bg-emerald-100 text-emerald-700';
  if (s === 'Processing') return 'bg-blue-100 text-blue-700';
  if (s === 'Shipped') return 'bg-purple-100 text-purple-700';
  if (s === 'Pending') return 'bg-yellow-100 text-yellow-700';
  if (s === 'Cancelled') return 'bg-red-100 text-red-700';
  return 'bg-gray-100 text-gray-600';
};

const EMPTY_ORDER = { order_number: '', customer: '', date: new Date().toISOString().split('T')[0], status: 'Pending' as Order['status'], total: '', items: '' };

export const Orders: React.FC = () => {
  const { currencySymbol } = useSettings();
  const [orders, setOrders] = useState<Order[]>(getOrders);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_ORDER });

  const refresh = () => setOrders(getOrders());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addOrder({ ...form, total: parseFloat(form.total as any) || 0, items: parseInt(form.items as any) || 1 });
    refresh(); setIsFormOpen(false); setForm({ ...EMPTY_ORDER });
  };

  const handleStatusChange = (id: number, status: Order['status']) => {
    updateOrderStatus(id, status); refresh();
  };

  const filtered = orders.filter(o =>
    o.order_number.toLowerCase().includes(search.toLowerCase()) ||
    o.customer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders</h2>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} total orders &bull; {currencySymbol}{orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0).toFixed(2)} revenue</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> New Order
        </button>
      </div>

      <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3 bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search by order number or customer..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Order #</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Customer</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Date</th>
                <th className="h-10 px-4 text-center font-medium text-muted-foreground">Items</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Total</th>
                <th className="h-10 px-4 text-center font-medium text-muted-foreground">Status</th>
                <th className="h-10 px-4 text-center font-medium text-muted-foreground">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (<tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No orders found.</td></tr>)}
              {filtered.map(o => (
                <tr key={o.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-xs font-semibold text-primary">{o.order_number}</td>
                  <td className="p-4 font-medium">{o.customer}</td>
                  <td className="p-4 text-muted-foreground">{o.date}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-1"><Package className="h-3 w-3 text-muted-foreground" />{o.items}</div>
                  </td>
                  <td className="p-4 text-right font-semibold">{currencySymbol}{o.total.toFixed(2)}</td>
                  <td className="p-4 text-center"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(o.status)}`}>{o.status}</span></td>
                  <td className="p-4 text-center">
                    <select value={o.status} onChange={e => handleStatusChange(o.id, e.target.value as Order['status'])}
                      className="h-8 rounded-lg border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20">
                      <option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden">
            <div className="p-6 border-b bg-muted/20">
              <h2 className="text-lg font-bold">New Order</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Order Number *</label>
                <input required placeholder="ORD-2024-007" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.order_number} onChange={e => setForm({ ...form, order_number: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Customer Name *</label>
                <input required placeholder="Customer name" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Date</label>
                  <input type="date" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">No. of Items</label>
                  <input type="number" placeholder="1" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.items} onChange={e => setForm({ ...form, items: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Total ({currencySymbol}) *</label>
                  <input required type="number" step="0.01" placeholder="0.00" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.total} onChange={e => setForm({ ...form, total: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Order['status'] })}>
                    <option>Pending</option><option>Processing</option><option>Shipped</option><option>Delivered</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
