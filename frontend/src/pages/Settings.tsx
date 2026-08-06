import React, { useState } from 'react';
import { Store, Bell, Database } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

export const Settings: React.FC = () => {
  const { currency, setCurrency } = useSettings();
  const [storeName, setStoreName] = useState('SuperMart');
  const [storeEmail, setStoreEmail] = useState('manager@supermart.com');
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 p-6 pb-10 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your supermarket store configuration and preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Info */}
        <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-muted/20 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Store className="h-4 w-4 text-primary" /></div>
            <h3 className="font-semibold">Store Information</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Store Name</label>
                <input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={storeName} onChange={e => setStoreName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Store Email</label>
                <input type="email" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={storeEmail} onChange={e => setStoreEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1 max-w-xs">
              <label className="text-sm font-medium">Currency</label>
              <select className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'EUR' | 'GBP' | 'INR')}>
                <option value="USD">USD – US Dollar ($)</option>
                <option value="EUR">EUR – Euro (€)</option>
                <option value="GBP">GBP – British Pound (£)</option>
                <option value="INR">INR – Indian Rupee (₹)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-muted/20 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Bell className="h-4 w-4 text-primary" /></div>
            <h3 className="font-semibold">Notifications</h3>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Low Stock Alerts', desc: 'Get notified when products fall below minimum stock', value: lowStockAlert, set: setLowStockAlert },
              { label: 'Email Notifications', desc: 'Receive daily summary emails for orders and alerts', value: emailNotifications, set: setEmailNotifications },
            ].map(({ label, desc, value, set }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <button type="button" onClick={() => set(!value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-primary' : 'bg-muted-foreground/30'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* AI Integration */}
        <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-muted/20 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Database className="h-4 w-4 text-primary" /></div>
            <h3 className="font-semibold">AI Integration</h3>
          </div>
          <div className="p-5 space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">OpenAI API Key</label>
              <input type="password" placeholder="sk-..." className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              <p className="text-xs text-muted-foreground">Required to enable the AI Inventory Assistant.</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Supabase URL</label>
              <input type="url" placeholder="https://xxx.supabase.co" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Supabase Anon Key</label>
              <input type="password" placeholder="eyJ..." className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
            Save Settings
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">✓ Settings saved!</span>}
        </div>
      </form>
    </div>
  );
};
