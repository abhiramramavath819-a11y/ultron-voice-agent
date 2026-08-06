import React from 'react';
import { ShoppingCart, Star, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';

const products = [
  { id: 1, name: 'Organic Bananas', category: 'Produce', price: 1.99, selling_price: 1.99, image: '🍌' },
  { id: 2, name: 'Whole Milk (1 Gallon)', category: 'Dairy', price: 3.49, selling_price: 3.49, image: '🥛' },
  { id: 3, name: 'Sourdough Bread', category: 'Bakery', price: 4.99, selling_price: 4.99, image: '🍞' },
  { id: 4, name: 'Fresh Salmon Fillet', category: 'Meat & Seafood', price: 12.99, selling_price: 12.99, image: '🐟' },
  { id: 5, name: 'Free-Range Eggs (Dozen)', category: 'Dairy', price: 5.49, selling_price: 5.49, image: '🥚' },
  { id: 6, name: 'Avocados (Bag of 4)', category: 'Produce', price: 4.99, selling_price: 4.99, image: '🥑' },
  { id: 7, name: 'Ground Beef (1 lb)', category: 'Meat & Seafood', price: 6.99, selling_price: 6.99, image: '🥩' },
  { id: 8, name: 'Croissants (4 pack)', category: 'Bakery', price: 5.99, selling_price: 5.99, image: '🥐' },
];

export const Storefront: React.FC = () => {
  const { user } = useAuth();
  const { currencySymbol } = useSettings();

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-primary/5 p-8 rounded-2xl border">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary">Welcome to SuperMart</h1>
          <p className="text-muted-foreground mt-2 text-lg">Fresh groceries delivered right to your door, {user?.email?.split('@')[0] || 'Customer'}.</p>
        </div>
        <div className="hidden md:flex h-16 w-16 bg-primary text-primary-foreground rounded-full items-center justify-center shadow-lg">
          <ShoppingCart className="h-8 w-8" />
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-500 fill-yellow-500" />
          Featured Products
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => (
            <div key={product.id} className="group relative bg-card border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
              <div className="aspect-square bg-muted/30 rounded-xl mb-4 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
                {product.image}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-primary">{product.category}</p>
                <h3 className="font-semibold leading-tight line-clamp-1">{product.name}</h3>
                <div className="flex items-center justify-between pt-2">
                  <p className="font-bold">{currencySymbol}{product.selling_price.toFixed(2)}</p>
                  <button className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors shadow-sm">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
