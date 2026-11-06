const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());
let memories = [];

app.get('/', (req,res) => res.json({ name:"AI-Bridge API Render", status:"live", endpoints:"GET /api, POST /api" }));
app.get('/api', (req,res) => res.json({ name:"AI-Bridge API", status:"live - Render", count: memories.length, memories, time: new Date().toISOString() }));
app.post('/api', (req,res) => {
  const { text, embedding } = req.body;
  if(!text) return res.status(400).json({error:"text required"});
  const m = { id: Date.now(), text, embedding: embedding||null, created: new Date().toISOString() };
  memories.push(m);
  res.json({ ok:true, saved:m, count: memories.length });
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Live on ${PORT}`));
