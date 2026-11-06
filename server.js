const express = require("express");
const cors = require("cors");
const fs = require("fs");
let pipe = null;
const app = express();
app.use(cors());
app.use(express.json());

const FILE = "./memories.json";
let memories = [];
try { 
  if (fs.existsSync(FILE)) {
    memories = JSON.parse(fs.readFileSync(FILE, "utf8"));
  }
} catch(e){ memories=[] }

function saveFile(){ 
  try { fs.writeFileSync(FILE, JSON.stringify(memories)); } catch(e){ console.log("save error", e.message) }
}

async function getEmbedding(text) {
  if (!pipe) {
    const { pipeline } = await import("@xenova/transformers");
    pipe = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

app.get("/", (req, res) => res.send("AI-Bridge Render LIVE - Persistent - FREE - Clean"));

app.get("/api/", (req, res) => {
  const clean = memories.map(({id,text,created})=>({id,text,created}));
  res.json({ name:"AI-Bridge", status:"persistent - free embeddings", count: memories.length, memories: clean, time: new Date().toISOString() });
});

app.post("/api/", async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  try {
    const embedding = await getEmbedding(text);
    const item = { id: Date.now(), text, embedding, created: new Date().toISOString() };
    memories.push(item); 
    saveFile();
    res.json({ ok: true, saved: { id: item.id, text: item.text, created: item.created }, count: memories.length });
  } catch(e){ res.status(500).json({ error: e.message }) }
});

app.post("/api/search", async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "query required" });
  if (memories.length===0) return res.json({ query, results:[] });
  try {
    const qEmb = await getEmbedding(query);
    const scored = memories.map(m => {
      let dot=0; for(let i=0;i<qEmb.length;i++) dot+= qEmb[i]*m.embedding[i];
      return { id:m.id, text:m.text, created:m.created, score:Number(dot.toFixed(4)) };
    }).sort((a,b)=>b.score-a.score).slice(0,5);
    res.json({ query, results: scored });
  } catch(e){ res.status(500).json({ error: e.message }) }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Persistent Live on "+PORT));
