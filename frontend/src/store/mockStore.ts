// In-memory mock store — acts like a local database when Supabase is not connected

export interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  supplier?: string;
  current_stock: number;
  min_stock: number;
  selling_price: number;
  purchase_price: number;
  status: 'Active' | 'Low Stock' | 'Critical' | 'Discontinued';
  image?: string;
}

export interface Order {
  id: number;
  order_number: string;
  customer: string;
  date: string;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  total: number;
  items: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  status: 'Active' | 'Inactive';
  products: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  orders: number;
  total_spent: number;
  joined: string;
  status: 'Active' | 'Inactive';
}

let _products: Product[] = [
  { id: 1, name: 'Organic Bananas', sku: 'PR-BAN-01', category: 'Produce', supplier: 'Fresh Farms', current_stock: 450, min_stock: 100, selling_price: 1.99, purchase_price: 0.80, status: 'Active', image: '🍌' },
  { id: 2, name: 'Organic Whole Milk', sku: 'DA-MLK-02', category: 'Dairy', supplier: 'Green Valley Dairy', current_stock: 12, min_stock: 20, selling_price: 3.49, purchase_price: 1.50, status: 'Low Stock', image: '🥛' },
  { id: 3, name: 'Sourdough Bread', sku: 'BA-SOU-01', category: 'Bakery', supplier: 'Artisan Bakers', current_stock: 2, min_stock: 15, selling_price: 4.99, purchase_price: 2.00, status: 'Critical', image: '🍞' },
  { id: 4, name: 'Fresh Salmon Fillet', sku: 'ME-SAL-01', category: 'Meat & Seafood', supplier: 'Ocean Fresh', current_stock: 15, min_stock: 10, selling_price: 12.99, purchase_price: 7.00, status: 'Active', image: '🐟' },
  { id: 5, name: 'Cage-Free Eggs (Dozen)', sku: 'DA-EGG-01', category: 'Dairy', supplier: 'Green Valley Dairy', current_stock: 80, min_stock: 50, selling_price: 5.49, purchase_price: 2.50, status: 'Active', image: '🥚' },
  { id: 6, name: 'Avocados (Bag of 4)', sku: 'PR-AVO-01', category: 'Produce', supplier: 'Fresh Farms', current_stock: 55, min_stock: 30, selling_price: 4.99, purchase_price: 2.20, status: 'Active', image: '🥑' },
  { id: 7, name: 'Ground Beef 80/20 (1lb)', sku: 'ME-GBF-01', category: 'Meat & Seafood', supplier: 'Prime Meats', current_stock: 8, min_stock: 30, selling_price: 6.99, purchase_price: 3.50, status: 'Low Stock', image: '🥩' },
  { id: 8, name: 'Croissants (4 pack)', sku: 'BA-CRO-01', category: 'Bakery', supplier: 'Artisan Bakers', current_stock: 40, min_stock: 20, selling_price: 5.99, purchase_price: 2.80, status: 'Active', image: '🥐' },
  { id: 9, name: 'Olive Oil (500ml)', sku: 'PA-OLV-01', category: 'Pantry', supplier: 'Mediterranean Imports', current_stock: 120, min_stock: 40, selling_price: 9.99, purchase_price: 5.00, status: 'Active', image: '🫒' },
  { id: 10, name: 'Greek Yogurt (32oz)', sku: 'DA-GYG-01', category: 'Dairy', supplier: 'Green Valley Dairy', current_stock: 35, min_stock: 25, selling_price: 6.99, purchase_price: 3.20, status: 'Active', image: '🥣' },
];

let _orders: Order[] = [
  { id: 1, order_number: 'ORD-2024-001', customer: 'Sarah Johnson', date: '2024-08-05', status: 'Delivered', total: 87.43, items: 8 },
  { id: 2, order_number: 'ORD-2024-002', customer: 'Mike Chen', date: '2024-08-05', status: 'Processing', total: 42.17, items: 5 },
  { id: 3, order_number: 'ORD-2024-003', customer: 'Emily Davis', date: '2024-08-04', status: 'Shipped', total: 123.99, items: 12 },
  { id: 4, order_number: 'ORD-2024-004', customer: 'Robert Wilson', date: '2024-08-04', status: 'Pending', total: 34.50, items: 3 },
  { id: 5, order_number: 'ORD-2024-005', customer: 'Aisha Patel', date: '2024-08-03', status: 'Delivered', total: 215.80, items: 18 },
  { id: 6, order_number: 'ORD-2024-006', customer: 'Tom Baker', date: '2024-08-03', status: 'Cancelled', total: 56.20, items: 4 },
];

let _suppliers: Supplier[] = [
  { id: 1, name: 'Fresh Farms', contact: 'John Hargreaves', email: 'john@freshfarms.com', phone: '+1 555-0101', category: 'Produce', status: 'Active', products: 24 },
  { id: 2, name: 'Green Valley Dairy', contact: 'Maria Santos', email: 'maria@gvdairy.com', phone: '+1 555-0102', category: 'Dairy', status: 'Active', products: 15 },
  { id: 3, name: 'Artisan Bakers', contact: 'Pierre Dubois', email: 'pierre@artisanbakers.com', phone: '+1 555-0103', category: 'Bakery', status: 'Active', products: 12 },
  { id: 4, name: 'Prime Meats', contact: 'Carlos Rivera', email: 'carlos@primemeats.com', phone: '+1 555-0104', category: 'Meat & Seafood', status: 'Active', products: 18 },
  { id: 5, name: 'Ocean Fresh', contact: 'Lisa Wong', email: 'lisa@oceanfresh.com', phone: '+1 555-0105', category: 'Meat & Seafood', status: 'Active', products: 9 },
  { id: 6, name: 'Mediterranean Imports', contact: 'Sofia Russo', email: 'sofia@medimports.com', phone: '+1 555-0106', category: 'Pantry', status: 'Inactive', products: 30 },
];

let _customers: Customer[] = [
  { id: 1, name: 'Sarah Johnson', email: 'sarah.j@email.com', phone: '+1 555-1001', orders: 12, total_spent: 854.30, joined: '2023-04-12', status: 'Active' },
  { id: 2, name: 'Mike Chen', email: 'mike.c@email.com', phone: '+1 555-1002', orders: 8, total_spent: 420.80, joined: '2023-06-22', status: 'Active' },
  { id: 3, name: 'Emily Davis', email: 'emily.d@email.com', phone: '+1 555-1003', orders: 25, total_spent: 2100.55, joined: '2022-11-05', status: 'Active' },
  { id: 4, name: 'Robert Wilson', email: 'rob.w@email.com', phone: '+1 555-1004', orders: 3, total_spent: 134.20, joined: '2024-01-18', status: 'Active' },
  { id: 5, name: 'Aisha Patel', email: 'aisha.p@email.com', phone: '+1 555-1005', orders: 18, total_spent: 1750.90, joined: '2023-02-28', status: 'Active' },
  { id: 6, name: 'Tom Baker', email: 'tom.b@email.com', phone: '+1 555-1006', orders: 4, total_spent: 213.50, joined: '2023-09-14', status: 'Inactive' },
];

let _nextId = 100;
const nextId = () => ++_nextId;

// Products CRUD
export const getProducts = () => [..._products];
export const addProduct = (p: Omit<Product, 'id'>) => {
  const product = { ...p, id: nextId() };
  _products = [..._products, product];
  return product;
};
export const updateProduct = (id: number, updates: Partial<Product>) => {
  _products = _products.map(p => p.id === id ? { ...p, ...updates } : p);
};
export const deleteProduct = (id: number) => {
  _products = _products.filter(p => p.id !== id);
};

// Orders CRUD
export const getOrders = () => [..._orders];
export const addOrder = (o: Omit<Order, 'id'>) => {
  const order = { ...o, id: nextId() };
  _orders = [order, ..._orders];
  return order;
};
export const updateOrderStatus = (id: number, status: Order['status']) => {
  _orders = _orders.map(o => o.id === id ? { ...o, status } : o);
};

// Suppliers CRUD
export const getSuppliers = () => [..._suppliers];
export const addSupplier = (s: Omit<Supplier, 'id'>) => {
  const supplier = { ...s, id: nextId() };
  _suppliers = [..._suppliers, supplier];
  return supplier;
};
export const deleteSupplier = (id: number) => {
  _suppliers = _suppliers.filter(s => s.id !== id);
};

// Customers CRUD
export const getCustomers = () => [..._customers];
export const addCustomer = (c: Omit<Customer, 'id'>) => {
  const customer = { ...c, id: nextId() };
  _customers = [..._customers, customer];
  return customer;
};
export const deleteCustomer = (id: number) => {
  _customers = _customers.filter(c => c.id !== id);
};

export const CATEGORIES = ['Produce', 'Dairy', 'Meat & Seafood', 'Bakery', 'Pantry', 'Frozen', 'Beverages'];
export const SUPPLIER_NAMES = _suppliers.map(s => s.name);
