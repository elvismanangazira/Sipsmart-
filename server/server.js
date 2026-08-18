require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const upload = multer({ dest: 'uploads/' });
const uploadMem = multer({ storage: multer.memoryStorage() });

app.post('/api/upload-id', uploadMem.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });

    const fileName = `${Date.now()}_${req.file.originalname}`;
    const { error } = await supabase.storage
      .from('id-documents')
      .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });

    if (error) throw error;

    const { data } = supabase.storage.from('id-documents').getPublicUrl(fileName);
    res.json({ success: true, url: data.publicUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// ─── Products ────────────────────────────────────────────────────────────────

app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = supabase.from('products').select('*').order('created_at', { ascending: true });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, image_url, description, stock } = req.body;
    if (!name || !category || !price) {
      return res.status(400).json({ success: false, error: 'name, category and price are required' });
    }
    const { data, error } = await supabase
      .from('products')
      .insert([{ name, category, price, image_url: image_url || '', description: description || '', stock: stock || 0 }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Orders ──────────────────────────────────────────────────────────────────

app.get('/api/orders', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Order not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { user_id, user_email, items, subtotal, delivery_fee, total, delivery_address, payment_method, payment_phone } = req.body;

    if (!user_id || !items || !items.length) {
      return res.status(400).json({ success: false, error: 'user_id and items are required' });
    }

    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id,
        user_email: user_email || '',
        items,
        subtotal: subtotal || 0,
        delivery_fee: delivery_fee || 2.00,
        total: total || 0,
        status: 'placed',
        delivery_address: delivery_address || {},
        payment_method: payment_method || 'ecocash',
        payment_phone: payment_phone || ''
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed', 'payment_confirmed', 'preparing', 'out_for_delivery', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`SipSmart API running on http://localhost:${PORT}`);
});
// ─── Users / Verification ───────────────────────────────────────────

app.post('/api/users', async (req, res) => {
  try {
    const { uid, full_name, phone, email, dob, id_doc_url } = req.body;
    if (!uid) return res.status(400).json({ success: false, error: 'uid required' });
    const { data, error } = await supabase
      .from('users')
      .upsert([{ uid, full_name, phone, email, dob, id_doc_url, verification_status: 'pending' }])
      .select()
      .single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users/:uid', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users').select('*').eq('uid', req.params.uid).maybeSingle();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const { status } = req.query;
    let query = supabase.from('users').select('*').order('created_at', { ascending: false });
    if (status) query = query.eq('verification_status', status);
    const { data, error } = await query;
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.patch('/api/users/:uid/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    const { data, error } = await supabase
      .from('users').update({ verification_status: status }).eq('uid', req.params.uid)
      .select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});