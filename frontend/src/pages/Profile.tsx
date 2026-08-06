import React, { useState } from 'react';
import { UserCircle, Camera, KeyRound, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Demo profiles to switch between
const DEMO_PROFILES = [
  { id: 'manager', name: 'Alex Johnson', email: 'alex.johnson@supermart.com', role: 'manager' as const, title: 'Store Manager', avatar: '👨‍💼' },
  { id: 'customer', name: 'Sarah Chen', email: 'sarah.chen@email.com', role: 'customer' as const, title: 'Loyal Customer', avatar: '👩‍🛒' },
  { id: 'admin', name: 'Chris Rivera', email: 'chris.rivera@supermart.com', role: 'manager' as const, title: 'Admin', avatar: '👨‍💻' },
];

export const Profile: React.FC = () => {
  const { user, userRole, switchRole } = useAuth();
  const [saved, setSaved] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState('manager');

  const email = user?.email || 'alex.johnson@supermart.com';
  const displayName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const [form, setForm] = useState({
    name: displayName,
    email: email,
    phone: '+1 555-0199',
    title: 'Store Manager',
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleProfileSwitch = (profile: typeof DEMO_PROFILES[0]) => {
    setActiveProfileId(profile.id);
    setForm({ name: profile.name, email: profile.email, phone: '+1 555-0199', title: profile.title });
    switchRole(profile.role);
  };

  const initials = form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 p-6 pb-10 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">Manage your account information and switch between demo profiles.</p>
      </div>

      {/* Demo Profile Switcher */}
      <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
        <div className="p-5 border-b bg-muted/20">
          <h3 className="font-semibold text-sm">Switch Profile</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Click a profile to switch accounts and roles.</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {DEMO_PROFILES.map(profile => (
            <button
              key={profile.id}
              onClick={() => handleProfileSwitch(profile)}
              className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all text-center gap-2 ${
                activeProfileId === profile.id
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30'
              }`}
            >
              {activeProfileId === profile.id && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="text-3xl">{profile.avatar}</div>
              <div>
                <p className="font-semibold text-sm">{profile.name}</p>
                <p className="text-xs text-muted-foreground">{profile.email}</p>
                <span className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  profile.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>{profile.title}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Profile Edit Form */}
      <form onSubmit={handleSave}>
        <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="p-5 border-b bg-muted/20 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <UserCircle className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Account Information</h3>
          </div>
          <div className="p-5 space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                  {initials}
                </div>
                <button type="button" className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-card border-2 border-border flex items-center justify-center hover:bg-accent transition-colors">
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              <div>
                <p className="font-semibold">{form.name}</p>
                <p className="text-sm text-muted-foreground">{form.title}</p>
                <span className={`mt-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  userRole === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                }`}>{userRole === 'manager' ? 'Manager View' : 'Customer View'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Full Name</label>
                <input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Job Title</label>
                <input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <input type="email" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Phone</label>
                <input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="border rounded-2xl bg-card shadow-sm overflow-hidden mt-5">
          <div className="p-5 border-b bg-muted/20 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <KeyRound className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold">Change Password</h3>
          </div>
          <div className="p-5 grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2">
              <label className="text-sm font-medium">Current Password</label>
              <input type="password" placeholder="••••••••" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">New Password</label>
              <input type="password" placeholder="••••••••" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Confirm Password</label>
              <input type="password" placeholder="••••••••" className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-5">
          <button type="submit" className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
            Save Changes
          </button>
          {saved && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle className="h-4 w-4" /> Profile saved!
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
