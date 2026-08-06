-- Enable pgvector for AI embeddings
create extension if not exists vector;

-- Enums
create type user_role as enum ('Super Admin', 'Admin', 'Manager', 'Employee', 'Viewer');
create type order_status as enum ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled');
create type purchase_order_status as enum ('Draft', 'Sent', 'Received', 'Cancelled');
create type transaction_type as enum ('Stock In', 'Stock Out', 'Adjustment', 'Transfer', 'Return');
create type notification_type as enum ('Low Stock', 'Out of Stock', 'Expiry Alert', 'PO Alert', 'System');

-- Function to automatically update updated_at timestamp
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Profiles (extends auth.users)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text,
  role user_role default 'Viewer',
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger profiles_updated_at before update on profiles for each row execute procedure handle_updated_at();

-- Suppliers
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  gst_number text,
  address text,
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);
create trigger suppliers_updated_at before update on suppliers for each row execute procedure handle_updated_at();

-- Warehouses
create table warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  manager_id uuid references profiles(id),
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);
create trigger warehouses_updated_at before update on warehouses for each row execute procedure handle_updated_at();

-- Warehouse Shelves
create table warehouse_shelves (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid references warehouses(id) on delete cascade not null,
  name text not null,
  section text,
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);
create trigger warehouse_shelves_updated_at before update on warehouse_shelves for each row execute procedure handle_updated_at();

-- Categories
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  parent_id uuid references categories(id),
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);
create trigger categories_updated_at before update on categories for each row execute procedure handle_updated_at();

-- Products
create table products (
  id uuid primary key default gen_random_uuid(),
  sku text unique not null,
  barcode text unique,
  qr_code text unique,
  name text not null,
  description text,
  category_id uuid references categories(id),
  supplier_id uuid references suppliers(id),
  purchase_price numeric(10, 2) not null,
  selling_price numeric(10, 2) not null,
  current_stock integer default 0,
  min_stock integer default 10,
  max_stock integer,
  warehouse_id uuid references warehouses(id),
  shelf_id uuid references warehouse_shelves(id),
  unit text default 'pcs',
  batch_number text,
  manufacturing_date date,
  expiry_date date,
  tags text[],
  image_urls text[],
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id),
  embedding vector(1536) -- For AI RAG
);
create trigger products_updated_at before update on products for each row execute procedure handle_updated_at();

-- Customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  address text,
  status text default 'Active',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);
create trigger customers_updated_at before update on customers for each row execute procedure handle_updated_at();

-- Orders (Sales Orders)
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id),
  order_number text unique not null,
  status order_status default 'Pending',
  total_amount numeric(10, 2) not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);
create trigger orders_updated_at before update on orders for each row execute procedure handle_updated_at();

-- Order Items
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) not null,
  quantity integer not null,
  unit_price numeric(10, 2) not null,
  total_price numeric(10, 2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Purchase Orders
create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) not null,
  po_number text unique not null,
  status purchase_order_status default 'Draft',
  total_amount numeric(10, 2) not null,
  expected_delivery date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references profiles(id)
);
create trigger purchase_orders_updated_at before update on purchase_orders for each row execute procedure handle_updated_at();

-- Inventory Transactions
create table inventory_transactions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) not null,
  transaction_type transaction_type not null,
  quantity integer not null,
  reference_id uuid, -- could be order_id, po_id, etc.
  notes text,
  created_at timestamptz default now(),
  created_by uuid references profiles(id)
);

-- Notifications
create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  title text not null,
  message text not null,
  type notification_type not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- AI Chats
create table ai_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) not null,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create trigger ai_chats_updated_at before update on ai_chats for each row execute procedure handle_updated_at();

-- AI Chat Messages
create table ai_chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references ai_chats(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz default now()
);

-- AI Recommendations
create table ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  confidence_score numeric(3, 2) not null,
  supporting_data jsonb,
  status text default 'Pending',
  created_at timestamptz default now()
);

-- Audit Logs
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz default now(),
  user_id uuid references profiles(id)
);

-- Settings
create table settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamptz default now(),
  updated_by uuid references profiles(id)
);
create trigger settings_updated_at before update on settings for each row execute procedure handle_updated_at();

-- Create RLS Policies
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table suppliers enable row level security;
alter table warehouses enable row level security;
alter table warehouse_shelves enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table customers enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table purchase_orders enable row level security;
alter table inventory_transactions enable row level security;
alter table notifications enable row level security;
alter table ai_chats enable row level security;
alter table ai_chat_messages enable row level security;
alter table ai_recommendations enable row level security;
alter table audit_logs enable row level security;
alter table settings enable row level security;

-- Basic Policies (In a real scenario, this would be highly granular based on user_role in profiles)
-- For demonstration, allowing authenticated users to read and insert if they are logged in.
create policy "Allow read access to authenticated users" on profiles for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on suppliers for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on warehouses for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on warehouse_shelves for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on categories for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on products for select using (auth.role() = 'authenticated');
create policy "Allow all access to authenticated users" on products for all using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on customers for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on orders for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on order_items for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on purchase_orders for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on inventory_transactions for select using (auth.role() = 'authenticated');
create policy "Allow read access to authenticated users" on notifications for select using (auth.uid() = user_id);
create policy "Allow all access to authenticated users" on ai_chats for all using (auth.uid() = user_id);
create policy "Allow all access to authenticated users" on ai_chat_messages for all using (auth.role() = 'authenticated');

-- Create trigger to automatically insert into profiles on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'Manager');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger to update inventory count on transaction
create or replace function handle_inventory_transaction()
returns trigger as $$
begin
  if new.transaction_type = 'Stock In' or new.transaction_type = 'Return' then
    update products set current_stock = current_stock + new.quantity where id = new.product_id;
  elsif new.transaction_type = 'Stock Out' then
    update products set current_stock = current_stock - new.quantity where id = new.product_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger inventory_transaction_created
  after insert on inventory_transactions
  for each row execute procedure handle_inventory_transaction();
