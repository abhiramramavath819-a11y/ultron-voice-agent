-- Function for pgvector cosine similarity search on products
create or replace function match_products (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name text,
  sku text,
  current_stock integer,
  selling_price numeric,
  similarity float
)
language sql stable
as $$
  select
    products.id,
    products.name,
    products.sku,
    products.current_stock,
    products.selling_price,
    1 - (products.embedding <=> query_embedding) as similarity
  from products
  where 1 - (products.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
$$;
