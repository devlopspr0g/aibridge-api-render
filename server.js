import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ROOT
app.get('/', (req,res) => {
  res.send('AI-Bridge Render LIVE - Persistent - FREE - Clean');
});

// AUTH middleware
async function auth(req,res,next){
  const key = req.headers['x-api-key'];
  if(!key) return res.status(401).json({error:'Missing API key'});
  const { data } = await supabase.from('api_keys').select('user_id').eq('key', key).single();
  if(!data) return res.status(401).json({error:'Invalid API key'});
  req.user_id = data.user_id;
  next();
}

// GET memories - supports all 6 tables
app.get('/api/memories', auth, async (req,res) => {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('user_id', req.user_id)
    .order('created_at', {ascending:false})
    .limit(100);
  if(error) return res.status(500).json({error:error.message});
  res.json(data || []);
});

// POST memory
app.post('/api/memories', auth, async (req,res) => {
  const { content, type, title } = req.body;
  const table = type || 'memories';
  const allowed = ['memories','businesses','contacts','tasks','goals','facts'];
  const targetTable = allowed.includes(table) ? table : 'memories';
  
  const { data, error } = await supabase
    .from(targetTable)
    .insert([{ user_id: req.user_id, content, title: title || content?.slice(0,50) }])
    .select();
  if(error) return res.status(500).json({error:error.message});
  res.json(data);
});

// Search across 6 tables
app.get('/api/search', auth, async (req,res) => {
  const q = req.query.q || '';
  if(!q) return res.json([]);
  const tables = ['memories','businesses','contacts','tasks','goals','facts'];
  let results = [];
  for(const t of tables){
    const { data } = await supabase.from(t).select('*').eq('user_id', req.user_id).ilike('content', `%${q}%`).limit(10);
    if(data) results = results.concat(data.map(d=>({...d, _table:t})));
  }
  res.json(results);
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, ()=>console.log('LIVE on '+PORT));
