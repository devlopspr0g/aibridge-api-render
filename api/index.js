// FINAL API - matches supabase.sql 6 tables - no vector
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Middleware: check api key nova_sk_xxx
async function auth(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.api_key;
  if (!key) return res.status(401).json({ error: 'Missing api key' });
  
  const { data } = await supabase.from('api_keys').select('user_id').eq('key', key).single();
  if (!data) return res.status(401).json({ error: 'Invalid key' });
  
  req.user_id = data.user_id;
  
  // update last_used
  await supabase.from('api_keys').update({ last_used: new Date().toISOString() }).eq('key', key);
  
  // log usage
  await supabase.from('usage_logs').insert({ user_id: data.user_id, action: req.path });
  
  next();
}

// Health
app.get('/', (req, res) => res.json({ status: 'aibridge-api-render-1 live', tables: 6 }));

// POST /api/memories - save
app.post('/api/memories', auth, async (req, res) => {
  const { content, source, type, tags, metadata } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });
  
  const { data, error } = await supabase.from('memories').insert({
    user_id: req.user_id,
    content,
    source: source || 'dashboard',
    type: type || 'memory',
    tags: tags || [],
    metadata: metadata || {}
  }).select().single();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET /api/memories - list + search ?q=
app.get('/api/memories', auth, async (req, res) => {
  const q = req.query.q;
  let query = supabase.from('memories').select('*').eq('user_id', req.user_id).order('created_at', { ascending: false }).limit(100);
  
  if (q) {
    query = query.ilike('content', `%${q}%`);
  }
  
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// DELETE
app.delete('/api/memories/:id', auth, async (req, res) => {
  const { error } = await supabase.from('memories').delete().eq('id', req.params.id).eq('user_id', req.user_id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});

// Teams endpoints
app.get('/api/teams', auth, async (req, res) => {
  const { data } = await supabase.from('teams').select('*, team_members(*)').eq('owner_id', req.user_id);
  res.json(data);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('Running on', PORT));
