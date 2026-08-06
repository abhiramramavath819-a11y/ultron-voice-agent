import React, { useState } from 'react';
import { Plus, Search, Trash2, Mail, Phone, ShoppingBag } from 'lucide-react';
import { getCustomers, addCustomer, deleteCustomer, Customer } from '@/store/mockStore';
import { useSettings } from '@/contexts/SettingsContext';

const EMPTY_FORM = { name: '', email: '', phone: '', orders: 0, total_spent: 0, joined: new Date().toISOString().split('T')[0], status: 'Active' as Customer['status'] };

export const Customers: React.FC = () => {
  const { currencySymbol } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>(getCustomers);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const refresh = () => setCustomers(getCustomers());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCustomer(form);
    refresh(); setIsFormOpen(false); setForm({ ...EMPTY_FORM });
  };

  const handleDelete = (id: number) => { deleteCustomer(id); setDeleteConfirm(null); refresh(); };

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Customers</h2>
          <p className="text-muted-foreground text-sm mt-1">{customers.length} customers &bull; {currencySymbol}{customers.reduce((s, c) => s + c.total_spent, 0).toFixed(2)} total revenue</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Customer</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Contact</th>
              <th className="h-10 px-4 text-center font-medium text-muted-foreground">Orders</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Total Spent</th>
              <th className="h-10 px-4 text-left font-medium text-muted-foreground">Joined</th>
              <th className="h-10 px-4 text-center font-medium text-muted-foreground">Status</th>
              <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (<tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No customers found.</td></tr>)}
            {filtered.map(c => (
              <tr key={c.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {c.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium">{c.name}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Mail className="h-3 w-3" />{c.email}</div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs"><Phone className="h-3 w-3" />{c.phone}</div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <div className="flex justify-center items-center gap-1"><ShoppingBag className="h-3 w-3 text-muted-foreground" />{c.orders}</div>
                </td>
                <td className="p-4 text-right font-semibold">{currencySymbol}{c.total_spent.toFixed(2)}</td>
                <td className="p-4 text-muted-foreground">{c.joined}</td>
                <td className="p-4 text-center">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{c.status}</span>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => setDeleteConfirm(c.id)} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden">
            <div className="p-6 border-b bg-muted/20"><h2 className="text-lg font-bold">Add Customer</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Full Name *</label>
                <input required className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Email *</label>
                  <input required type="email" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone</label>
                  <input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Add Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-600" /></div>
              <div><h3 className="font-semibold">Remove Customer?</h3><p className="text-sm text-muted-foreground">This cannot be undone.</p></div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
