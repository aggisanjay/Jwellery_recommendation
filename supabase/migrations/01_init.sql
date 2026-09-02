# ==============================================================================
# 01_init.sql - Supabase Schema & Vector Extension Setup
# Jewelry Visual-Matching Prototype: Necklace -> Matching Earrings Recommender
# ==============================================================================

-- 1. Enable the pgvector extension to work with image embeddings
create extension if not exists vector;

-- 2. Drop existing table if restarting clean
drop table if exists products cascade;

-- 3. Create products table
create table if not exists products (
    id text primary key,                                  -- e.g. 'N01', 'E01'
    product_type text not null check (product_type in ('Necklace', 'Earrings')),
    image_file text not null,                             -- e.g. 'Nck_1.jpg'
    image_url text not null,                              -- Public Supabase Storage URL
    color_palette jsonb not null default '[]'::jsonb,     -- Array of { "lab": [L, a, b], "rgb": [r, g, b], "weight": float }
    embedding vector(512),                                -- CLIP ViT-B/32 normalized embedding
    created_at timestamp with time zone default now()
);

-- 4. Enable Row Level Security (RLS) and grant read access to anon/authenticated
alter table products enable row level security;

create policy "Allow public read access to products"
    on products for select
    to anon, authenticated
    using (true);

create policy "Allow service_role full access to products"
    on products for all
    to service_role
    using (true)
    with check (true);

-- 5. Create index for fast vector cosine similarity search
-- Note: With small catalogs, exact sequential scan is fast; HNSW provides scalable sub-millisecond approximate nearest neighbor search
create index if not exists products_embedding_hnsw_idx 
    on products 
    using hnsw (embedding vector_cosine_ops)
    with (m = 16, ef_construction = 64);

-- 6. Create RPC function for finding candidate earrings via CLIP cosine distance
-- Cosine similarity is computed as: 1 - (embedding <=> query_embedding)
create or replace function match_earrings (
    query_embedding vector(512),
    match_threshold float default 0.0,
    match_count int default 15
)
returns table (
    id text,
    product_type text,
    image_file text,
    image_url text,
    color_palette jsonb,
    clip_score float
)
language plpgsql
security definer
as $$
begin
    return query
    select
        p.id,
        p.product_type,
        p.image_file,
        p.image_url,
        p.color_palette,
        1 - (p.embedding <=> query_embedding) as clip_score
    from products p
    where p.product_type = 'Earrings'
      and (1 - (p.embedding <=> query_embedding)) >= match_threshold
    order by p.embedding <=> query_embedding asc
    limit match_count;
end;
$$;

-- 7. Configure Supabase Storage bucket policy (run in Supabase SQL editor)
-- insert into storage.buckets (id, name, public) 
-- values ('jewelry-images', 'jewelry-images', true)
-- on conflict (id) do update set public = true;

-- create policy "Public Access to jewelry-images"
-- on storage.objects for select
-- to anon, authenticated
-- using (bucket_id = 'jewelry-images');

-- create policy "Service role upload to jewelry-images"
-- on storage.objects for insert
-- to service_role
-- with check (bucket_id = 'jewelry-images');
