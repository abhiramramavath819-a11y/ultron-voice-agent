import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, ShoppingCart, Settings,
  Warehouse, Truck, ChevronUp, LogOut, UserCircle, ShoppingBasket
} from 'lucide-react';
import { cn } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';

const managerNavItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Suppliers', href: '/suppliers', icon: Truck },
  { name: 'Warehouses', href: '/warehouses', icon: Warehouse },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const customerNavItems = [
  { name: 'Shop', href: '/', icon: ShoppingBasket },
  { name: 'My Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Profile', href: '/profile', icon: UserCircle },
];

export const Sidebar: React.FC = () => {
  const { user, signOut, userRole } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const email = user?.email || 'demo@supermart.com';
  const displayName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const roleLabel = userRole === 'manager' ? 'Store Manager' : 'Customer';

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <aside className="w-64 border-r bg-card hidden md:flex flex-col">
      <div className="h-16 flex items-center px-6 border-b gap-2.5">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <ShoppingBasket className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-bold tracking-tight">SuperMart AI</span>
      </div>
      
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {(userRole === 'customer' ? customerNavItems : managerNavItems).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )
              }
            >
              <Icon className="mr-3 h-4 w-4 flex-shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      
      {/* Profile Widget */}
      <div className="p-3 border-t relative">
        {profileOpen && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-popover border rounded-xl shadow-xl overflow-hidden z-50">
            <div className="p-3 border-b bg-muted/30">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-xs text-muted-foreground truncate">{email}</p>
              <span className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">{roleLabel}</span>
            </div>
            <div className="p-1">
              <button
                onClick={() => { setProfileOpen(false); navigate('/profile'); }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors text-left"
              >
                <UserCircle className="h-4 w-4 text-muted-foreground" />
                Edit Profile
              </button>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors text-left"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setProfileOpen(prev => !prev)}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors group"
        >
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-semibold truncate leading-tight">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{roleLabel}</p>
          </div>
          <ChevronUp className={cn('h-4 w-4 text-muted-foreground transition-transform flex-shrink-0', profileOpen ? '' : 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
};

