import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const getEmbedding = async (text) => {
  const response = await axios.post(
    'https://api.openai.com/v1/embeddings',
    {
      input: text,
      model: 'text-embedding-3-small'
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'OpenAI-Project': process.env.OPENAI_PROJECT_ID,
        'Content-Type': 'application/json'
      }
    }
  );

  return response.data.data[0].embedding;
};
