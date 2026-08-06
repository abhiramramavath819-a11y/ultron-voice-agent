import React from 'react';
import { Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const revenueData = [
  { name: 'Jan', total: 12000 },
  { name: 'Feb', total: 15000 },
  { name: 'Mar', total: 18000 },
  { name: 'Apr', total: 22000 },
  { name: 'May', total: 27000 },
  { name: 'Jun', total: 32000 },
  { name: 'Jul', total: 38000 },
];

const categoryData = [
  { name: 'Electronics', value: 400 },
  { name: 'Furniture', value: 300 },
  { name: 'Office', value: 300 },
  { name: 'Hardware', value: 200 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of your inventory and warehouse operations.
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard 
          title="Total Products" 
          value="1,248" 
          change="+12% from last month" 
          icon={Package} 
        />
        <DashboardCard 
          title="Inventory Value" 
          value="$124,500.00" 
          change="+2.5% from last month" 
          icon={DollarSign} 
        />
        <DashboardCard 
          title="Revenue (MTD)" 
          value="$45,231.89" 
          change="+18% from last month" 
          icon={TrendingUp} 
        />
        <DashboardCard 
          title="Low Stock Items" 
          value="24" 
          change="Requires immediate attention" 
          icon={AlertCircle} 
          danger
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="border rounded-xl bg-card p-6 col-span-4 shadow-sm">
          <h3 className="font-semibold mb-4 text-sm tracking-tight text-muted-foreground">Revenue Trend</h3>
          <div className="h-[300px]">
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
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="border rounded-xl bg-card p-6 col-span-3 shadow-sm">
          <h3 className="font-semibold mb-4 text-sm tracking-tight text-muted-foreground">Category Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardCard = ({ title, value, change, icon: Icon, danger = false }: any) => (
  <div className="border rounded-xl bg-card p-6 shadow-sm flex flex-col justify-between">
    <div className="flex items-center justify-between space-y-0 pb-2">
      <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
      <div className={`p-2 rounded-lg ${danger ? 'bg-destructive/10' : 'bg-primary/10'}`}>
        <Icon className={`h-4 w-4 ${danger ? 'text-destructive' : 'text-primary'}`} />
      </div>
    </div>
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <p className={`text-xs mt-1 ${danger ? 'text-destructive' : 'text-muted-foreground'}`}>
        {change}
      </p>
    </div>
  </div>
);
