import express from 'express';
import initIndex from './utils/pinecone.js';     // ✅ uses our fixed helper
import { getEmbedding } from './utils/openai.js';      // your existing embedding helper

const app = express();
app.use(express.json());

let pineconeIndex;

(async () => {
  pineconeIndex = initIndex();                  // returns the live index

  app.post('/remember', async (req, res) => {
    const { id, text } = req.body;
    const vector = await getEmbedding(text);
    await pineconeIndex.upsert([{ id, values: vector, metadata: { text } }]);
    res.json({ message: 'Memory stored' });
  });

  app.post('/recall', async (req, res) => {
    const { query } = req.body;
    const vector = await getEmbedding(query);
    const results = await pineconeIndex.query({
      topK: 3,
      vector,
      includeMetadata: true,
    });
    res.json(results.matches.map(m => m.metadata.text));
  });

 const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🧠 Memory agent running on ${PORT}`)
);
})();
