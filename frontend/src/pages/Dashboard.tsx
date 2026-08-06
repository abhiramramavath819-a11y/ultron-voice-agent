import React from 'react';
import { Package, DollarSign, TrendingUp, AlertCircle, ShoppingCart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Storefront } from './Storefront';

const revenueData = [
  { name: 'Mon', total: 1200 },
  { name: 'Tue', total: 1500 },
  { name: 'Wed', total: 1800 },
  { name: 'Thu', total: 2200 },
  { name: 'Fri', total: 4700 },
  { name: 'Sat', total: 5200 },
  { name: 'Sun', total: 4800 },
];

const categoryData = [
  { name: 'Produce', value: 850 },
  { name: 'Dairy', value: 420 },
  { name: 'Meat', value: 650 },
  { name: 'Bakery', value: 310 },
  { name: 'Pantry', value: 500 },
];

const lowStockItems = [
  { name: 'Organic Whole Milk', stock: 12, min: 20 },
  { name: 'Fresh Avocados', stock: 5, min: 50 },
  { name: 'Sourdough Bread', stock: 2, min: 15 },
  { name: 'Ground Beef 80/20', stock: 8, min: 30 },
];

const topSellingItems = [
  { name: 'Organic Bananas', sold: 450, revenue: 895.50 },
  { name: 'Cage-Free Eggs', sold: 320, revenue: 1756.80 },
  { name: 'Fresh Salmon', sold: 180, revenue: 2338.20 },
  { name: 'Whole Wheat Bread', sold: 290, revenue: 1157.10 },
];

export const Dashboard: React.FC = () => {
  const { userRole } = useAuth();
  const { currencySymbol } = useSettings();

  if (userRole === 'customer') {
    return <Storefront />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border rounded-2xl p-8 shadow-sm">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Supermarket AI Manager</h2>
        <p className="text-muted-foreground text-lg mt-2 max-w-2xl">
          Overview of your store's inventory, daily revenue, and AI-driven restock alerts.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard 
          title="Active Products" 
          value="4,248" 
          change="+120 new this week" 
          icon={Package} 
        />
        <DashboardCard 
          title="Total Inventory Value" 
          value={`${currencySymbol}224,500`} 
          change="+2.5% from yesterday" 
          icon={DollarSign} 
        />
        <DashboardCard 
          title="Weekly Revenue" 
          value={`${currencySymbol}21,400`} 
          change="+18% from last week" 
          icon={TrendingUp} 
        />
        <DashboardCard 
          title="Low Stock Alerts" 
          value="24" 
          change="AI predicted stockouts" 
          icon={AlertCircle} 
          danger
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="border rounded-2xl bg-card p-6 col-span-4 shadow-sm">
          <h3 className="font-semibold mb-6 text-sm tracking-tight text-muted-foreground flex items-center">
            <TrendingUp className="mr-2 h-4 w-4" /> Revenue Trend (This Week)
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${currencySymbol}${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border rounded-2xl bg-card p-6 col-span-3 shadow-sm">
          <h3 className="font-semibold mb-6 text-sm tracking-tight text-muted-foreground flex items-center">
            <ShoppingCart className="mr-2 h-4 w-4" /> Sales by Department
          </h3>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/20">
            <h3 className="font-semibold text-sm tracking-tight text-muted-foreground flex items-center">
              <AlertCircle className="mr-2 h-4 w-4 text-destructive" /> Critical Restock Alerts
            </h3>
          </div>
          <div className="p-0">
            {lowStockItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Min required: {item.min}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-destructive font-bold text-sm bg-destructive/10 px-2 py-1 rounded-md">{item.stock} left</span>
                  <button className="text-xs font-medium bg-primary/10 text-primary px-3 py-1.5 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors">Order</button>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border rounded-2xl bg-card shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-muted/20">
            <h3 className="font-semibold text-sm tracking-tight text-muted-foreground flex items-center">
              <TrendingUp className="mr-2 h-4 w-4 text-primary" /> Top Performing Items
            </h3>
          </div>
          <div className="p-0">
            {topSellingItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">{i + 1}</div>
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.sold} units sold</p>
                  </div>
                </div>
                <div className="font-semibold text-sm text-right">
                  {currencySymbol}{item.revenue.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, change, icon: Icon, danger = false }: any) => (
  <div className="border rounded-2xl bg-card p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-${danger ? 'destructive' : 'primary'}/5 rounded-bl-full -z-10`}></div>
    <div className="flex items-center justify-between space-y-0 pb-2 z-10">
      <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
      <div className={`p-2.5 rounded-xl ${danger ? 'bg-destructive/10' : 'bg-primary/10'}`}>
        <Icon className={`h-5 w-5 ${danger ? 'text-destructive' : 'text-primary'}`} />
      </div>
    </div>
    <div className="z-10 mt-4">
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <p className={`text-xs mt-2 font-medium ${danger ? 'text-destructive' : 'text-emerald-500'}`}>
        {change}
      </p>
    </div>
  </div>
);
