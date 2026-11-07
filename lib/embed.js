// lib/embed.js - 384-dim embedding (all-MiniLM-L6-v2) - FREE & OFFLINE
let embedder = null;

async function getEmbedder() {
  if (embedder) return embedder;
  // Dynamic import to keep Render free tier light
  const { pipeline } = await import('@xenova/transformers');
  embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return embedder;
}

// Convert text -> 384 numbers
export async function createEmbedding(text) {
  const pipe = await getEmbedder();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data); // 384 floats
}

// Cosine similarity for search
export function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Search memories.json with query
export async function searchMemories(query, memories, topK = 5) {
  const queryVec = await createEmbedding(query);
  return memories
    .map(m => ({
      ...m,
      score: m.embedding ? cosineSimilarity(queryVec, m.embedding) : 0
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
