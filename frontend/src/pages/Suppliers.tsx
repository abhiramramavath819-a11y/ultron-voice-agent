import React, { useState } from 'react';
import { Plus, Search, Trash2, Phone, Mail } from 'lucide-react';
import { getSuppliers, addSupplier, deleteSupplier, Supplier, CATEGORIES } from '@/store/mockStore';

const EMPTY_FORM = { name: '', contact: '', email: '', phone: '', category: 'Produce', status: 'Active' as Supplier['status'], products: 0 };

export const Suppliers: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(getSuppliers);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const refresh = () => setSuppliers(getSuppliers());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addSupplier(form);
    refresh(); setIsFormOpen(false); setForm({ ...EMPTY_FORM });
  };

  const handleDelete = (id: number) => { deleteSupplier(id); setDeleteConfirm(null); refresh(); };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground text-sm mt-1">{suppliers.length} suppliers &bull; {suppliers.filter(s => s.status === 'Active').length} active</p>
        </div>
        <button onClick={() => setIsFormOpen(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full h-9 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(s => (
          <div key={s.id} className="border rounded-2xl bg-card shadow-sm p-6 flex flex-col gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-base">{s.name}</h3>
                <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{s.category}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{s.status}</span>
                <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="font-medium">{s.contact}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" />{s.email}</div>
              <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{s.phone}</div>
            </div>
            <div className="pt-2 border-t flex items-center justify-between text-xs text-muted-foreground">
              <span>{s.products} products</span>
              <button className="text-primary font-medium hover:underline">View Products</button>
            </div>
          </div>
        ))}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden">
            <div className="p-6 border-b bg-muted/20"><h2 className="text-lg font-bold">Add Supplier</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Company Name *</label>
                <input required className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Person *</label>
                <input required className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} />
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
                <div className="space-y-1">
                  <label className="text-sm font-medium">Category</label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Supplier['status'] })}>
                    <option>Active</option><option>Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">Add Supplier</button>
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
              <div><h3 className="font-semibold">Remove Supplier?</h3><p className="text-sm text-muted-foreground">This cannot be undone.</p></div>
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
