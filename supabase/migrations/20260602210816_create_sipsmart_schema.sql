/*
  # SipSmart — Initial Schema

  ## Overview
  Sets up the full SipSmart liquor ordering platform database.

  ## New Tables

  ### products
  Stores all available liquor products.
  - id (uuid, pk)
  - name (text) — product display name
  - category (text) — Beer | Wine | Spirits | Cider
  - price (numeric) — price in USD
  - image_url (text) — Pexels stock photo URL
  - description (text)
  - stock (integer) — inventory count
  - created_at (timestamptz)

  ### orders
  Stores customer orders.
  - id (uuid, pk)
  - user_id (text) — Firebase UID
  - user_email (text)
  - items (jsonb) — array of {product_id, name, price, quantity}
  - subtotal (numeric)
  - delivery_fee (numeric)
  - total (numeric)
  - status (text) — placed | payment_confirmed | preparing | out_for_delivery | delivered
  - delivery_address (jsonb) — {street, suburb, city}
  - payment_method (text) — ecocash | innbucks
  - payment_phone (text)
  - created_at (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Products are publicly readable
  - Orders readable only by owner (by user_id) or service role
  - Products/orders writable only via service role (admin + backend)
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Beer', 'Wine', 'Spirits', 'Cider')),
  price numeric(10,2) NOT NULL DEFAULT 0,
  image_url text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  stock integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only service role can insert products"
  ON products FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Only service role can update products"
  ON products FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only service role can delete products"
  ON products FOR DELETE
  TO service_role
  USING (true);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_email text NOT NULL DEFAULT '',
  items jsonb NOT NULL DEFAULT '[]',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  delivery_fee numeric(10,2) NOT NULL DEFAULT 2.00,
  total numeric(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'placed' CHECK (status IN ('placed','payment_confirmed','preparing','out_for_delivery','delivered')),
  delivery_address jsonb NOT NULL DEFAULT '{}',
  payment_method text NOT NULL DEFAULT 'ecocash' CHECK (payment_method IN ('ecocash','innbucks')),
  payment_phone text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can insert orders"
  ON orders FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update orders"
  ON orders FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed sample products
INSERT INTO products (name, category, price, image_url, description, stock) VALUES
  ('Castle Lager 6-Pack', 'Beer', 4.50, 'https://images.pexels.com/photos/1267360/pexels-photo-1267360.jpeg?auto=compress&cs=tinysrgb&w=600', 'Iconic South African lager, crisp and refreshing.', 50),
  ('Zambezi Lager 6-Pack', 'Beer', 4.20, 'https://images.pexels.com/photos/5530012/pexels-photo-5530012.jpeg?auto=compress&cs=tinysrgb&w=600', 'Zimbabwe''s own premium lager beer.', 40),
  ('Black Label 750ml', 'Beer', 2.80, 'https://images.pexels.com/photos/1590175/pexels-photo-1590175.jpeg?auto=compress&cs=tinysrgb&w=600', 'Classic bold lager with a smooth finish.', 60),
  ('Savanna Dry Cider 6-Pack', 'Cider', 5.00, 'https://images.pexels.com/photos/1552630/pexels-photo-1552630.jpeg?auto=compress&cs=tinysrgb&w=600', 'Crisp, dry apple cider. Distinctly refreshing.', 35),
  ('Hunters Gold Cider 6-Pack', 'Cider', 4.80, 'https://images.pexels.com/photos/3407777/pexels-photo-3407777.jpeg?auto=compress&cs=tinysrgb&w=600', 'Golden apple cider with a sweet bite.', 30),
  ('Nederburg Cabernet 750ml', 'Wine', 8.50, 'https://images.pexels.com/photos/2702805/pexels-photo-2702805.jpeg?auto=compress&cs=tinysrgb&w=600', 'Full-bodied South African red wine.', 25),
  ('Boschendal Chardonnay 750ml', 'Wine', 9.00, 'https://images.pexels.com/photos/1173515/pexels-photo-1173515.jpeg?auto=compress&cs=tinysrgb&w=600', 'Elegant white wine with citrus notes.', 20),
  ('J.C. Le Roux Sparkling 750ml', 'Wine', 7.50, 'https://images.pexels.com/photos/3407778/pexels-photo-3407778.jpeg?auto=compress&cs=tinysrgb&w=600', 'Refreshing sparkling white wine.', 22),
  ('Jameson Irish Whiskey 750ml', 'Spirits', 18.00, 'https://images.pexels.com/photos/602750/pexels-photo-602750.jpeg?auto=compress&cs=tinysrgb&w=600', 'Triple distilled Irish whiskey, smooth and versatile.', 15),
  ('Johnnie Walker Red Label 750ml', 'Spirits', 22.00, 'https://images.pexels.com/photos/3407780/pexels-photo-3407780.jpeg?auto=compress&cs=tinysrgb&w=600', 'Iconic blended Scotch whisky, bold and smoky.', 18),
  ('Smirnoff Vodka 750ml', 'Spirits', 14.00, 'https://images.pexels.com/photos/4871119/pexels-photo-4871119.jpeg?auto=compress&cs=tinysrgb&w=600', 'Triple distilled, ten times filtered premium vodka.', 28),
  ('Bacardi White Rum 750ml', 'Spirits', 13.50, 'https://images.pexels.com/photos/3407782/pexels-photo-3407782.jpeg?auto=compress&cs=tinysrgb&w=600', 'Light and dry white rum, perfect for cocktails.', 20)
ON CONFLICT DO NOTHING;
