import express from 'express';
import initIndex from './utils/pinecone.js'; // ✅ Pinecone initializer
import { getEmbedding } from './utils/openai.js'; // ✅ OpenAI embedding helper

const app = express();
app.use(express.json()); // Critical: enables JSON body parsing

// Uptime / health endpoints
app.get('/health', (_req, res) => res.status(200).send('OK'));
app.get('/recall', (_req, res) => res.status(200).send('Memory agent is awake.'));

let pineconeIndex;

(async () => {
  try {
    // Initialize Pinecone index (await is crucial on Render)
    pineconeIndex = await initIndex();

    if (!pineconeIndex) {
      throw new Error('Pinecone index failed to initialize');
    }

    // Store memory
    app.post('/remember', async (req, res) => {
      try {
        const { id, text } = req.body;
        if (!id || !text) {
          return res.status(400).json({ error: 'Missing id or text in request body' });
        }

        const vector = await getEmbedding(text);
        await pineconeIndex.upsert([
          {
            id,
            values: vector,
            metadata: { text }
          }
        ]);

        res.json({ message: 'Memory stored successfully.' });
      } catch (err) {
        console.error('Error in /remember:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Recall memory
    app.post('/recall', async (req, res) => {
      try {
        const { query } = req.body;
        if (!query) {
          return res.status(400).json({ error: 'Missing query in request body' });
        }

        const vector = await getEmbedding(query);
        const results = await pineconeIndex.query({
          topK: 3,
          vector,
          includeMetadata: true
        });

        const matches = results.matches?.map(m => m.metadata.text) ?? [];
        res.json({ results: matches });
      } catch (err) {
        console.error('Error in /recall:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🧠 Memory agent running on port ${PORT}`);
    });
  } catch (bootErr) {
    console.error('Fatal boot error:', bootErr);
    process.exit(1);
  }
})();
