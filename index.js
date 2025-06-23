import express from 'express';
import initIndex from './utils/pinecone.js'; // ✅ Pinecone initializer
import { getEmbedding } from './utils/openai.js'; // ✅ OpenAI embedding helper

const app = express();
app.use(express.json()); // Critical: enables JSON body parsing

// Health check endpoints
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

    // Store memory with metadata and unique ID
    app.post('/remember', async (req, res) => {
      try {
        const { id, text, metadata = {} } = req.body;
        if (!id || !text) {
          return res.status(400).json({ error: 'Missing id or text in request body' });
        }

        const vector = await getEmbedding(text);
        await pineconeIndex.upsert([
          {
            id: `${id}-${Date.now()}`,
            values: vector,
            metadata: {
              text,
              user_id: id,
              ...metadata
            }
          }
        ]);

        res.json({ message: 'Memory stored successfully.' });
      } catch (err) {
        console.error('Error in /remember:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Recall memory with user filter
    app.post('/recall', async (req, res) => {
      try {
        const { id, query } = req.body;
        if (!id || !query) {
          return res.status(400).json({ error: 'Missing id or query in request body' });
        }

        const vector = await getEmbedding(query);
        const results = await pineconeIndex.query({
          topK: 5,
          vector,
          includeMetadata: true,
          filter: {
            user_id: { $eq: id }
          }
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
