import React, { useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import {
  getProducts, addProduct, updateProduct, deleteProduct,
  Product, CATEGORIES
} from '@/store/mockStore';
import { useSettings } from '@/contexts/SettingsContext';

const statusColor = (s: string) => {
  if (s === 'Critical') return 'bg-red-100 text-red-700';
  if (s === 'Low Stock') return 'bg-orange-100 text-orange-700';
  if (s === 'Active') return 'bg-emerald-100 text-emerald-700';
  return 'bg-gray-100 text-gray-600';
};

const EMPTY_FORM = {
  name: '', sku: '', category: 'Produce', supplier: '', image: '📦',
  current_stock: '', min_stock: '10', selling_price: '', purchase_price: '', status: 'Active' as Product['status'],
};

export const Inventory: React.FC = () => {
  const { currencySymbol } = useSettings();
  const [products, setProducts] = useState<Product[]>(getProducts);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const refresh = () => setProducts(getProducts());

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditing(null); setIsFormOpen(true); };
  const openEdit = (p: Product) => {
    setForm({
      name: p.name, sku: p.sku, category: p.category, supplier: p.supplier || '',
      image: p.image || '📦', status: p.status,
      current_stock: String(p.current_stock), min_stock: String(p.min_stock),
      selling_price: String(p.selling_price), purchase_price: String(p.purchase_price),
    });
    setEditing(p); setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<Product, 'id'> = {
      ...form,
      current_stock: parseInt(form.current_stock) || 0,
      min_stock: parseInt(form.min_stock) || 10,
      selling_price: parseFloat(form.selling_price) || 0,
      purchase_price: parseFloat(form.purchase_price) || 0,
    };
    if (editing) {
      updateProduct(editing.id, payload);
    } else {
      addProduct(payload);
    }
    refresh(); setIsFormOpen(false);
  };

  const handleDelete = (id: number) => {
    deleteProduct(id); setDeleteConfirm(null); refresh();
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Inventory</h2>
          <p className="text-muted-foreground text-sm mt-1">{products.length} products &bull; {products.filter(p => p.status === 'Critical' || p.status === 'Low Stock').length} alerts</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3 bg-muted/20">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search by name, SKU or category..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Product</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">SKU</th>
                <th className="h-10 px-4 text-left font-medium text-muted-foreground">Category</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Stock</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Buy Price</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Sell Price</th>
                <th className="h-10 px-4 text-center font-medium text-muted-foreground">Status</th>
                <th className="h-10 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="p-10 text-center text-muted-foreground">No products found.</td></tr>
              )}
              {filtered.map(p => (
                <tr key={p.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.image || '📦'}</span>
                      {p.name}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">{p.sku}</td>
                  <td className="p-4 text-muted-foreground">{p.category}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${p.current_stock <= p.min_stock ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.current_stock}
                    </span>
                  </td>
                  <td className="p-4 text-right text-muted-foreground">{currencySymbol}{p.purchase_price.toFixed(2)}</td>
                  <td className="p-4 text-right font-semibold">{currencySymbol}{p.selling_price.toFixed(2)}</td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(p.status)}`}>{p.status}</span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Dialog */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden">
            <div className="p-6 border-b bg-muted/20">
              <h2 className="text-lg font-bold">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Fill in the product details for your supermarket inventory.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-sm font-medium">Product Name *</label>
                  <input required placeholder="e.g. Organic Strawberries" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">SKU *</label>
                  <input required placeholder="PR-STR-01" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Category *</label>
                  <select required className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Purchase Price ({currencySymbol}) *</label>
                  <input required type="number" step="0.01" placeholder="0.00" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.purchase_price} onChange={e => setForm({ ...form, purchase_price: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Selling Price ({currencySymbol}) *</label>
                  <input required type="number" step="0.01" placeholder="0.00" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.selling_price} onChange={e => setForm({ ...form, selling_price: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Current Stock *</label>
                  <input required type="number" placeholder="0" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.current_stock} onChange={e => setForm({ ...form, current_stock: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Min Stock Alert</label>
                  <input type="number" placeholder="10" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Emoji / Icon</label>
                  <input placeholder="🍓" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Product['status'] })}>
                    <option>Active</option><option>Low Stock</option><option>Critical</option><option>Discontinued</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">{editing ? 'Save Changes' : 'Add Product'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center"><Trash2 className="h-5 w-5 text-red-600" /></div>
              <div>
                <h3 className="font-semibold">Delete Product</h3>
                <p className="text-sm text-muted-foreground">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
