// aibridge-api-render / server.js - COMPLETE
import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

const FILE = "./memories.json";
if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, "[]");

function getMemories() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}
function saveMemories(m) {
  fs.writeFileSync(FILE, JSON.stringify(m, null, 2));
}

app.get("/", (req, res) => {
  res.send("AI-Bridge Render LIVE - Persistent - FREE - Clean");
});

// Get all
app.get("/api/", (req, res) => {
  const mems = getMemories();
  res.json({ count: mems.length, memories: mems });
});

// Save
app.post("/api/", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });
  const mems = getMemories();
  const item = { id: Date.now().toString(), text, created: new Date().toISOString() };
  mems.push(item);
  saveMemories(mems);
  res.json({ ok: true, saved: item });
});

// Search - THIS WAS MISSING
app.post("/api/search", (req, res) => {
  const { query } = req.body;
  const mems = getMemories();
  if (!query) return res.json({ results: mems });
  const q = query.toLowerCase();
  const results = mems.filter(m => m.text.toLowerCase().includes(q));
  res.json({ results });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("LIVE on", PORT));
