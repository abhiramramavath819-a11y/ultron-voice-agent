import { MongoClient } from 'mongodb';

const mongoUri = process.env.MONGODB_URI;
const groqApiKey = process.env.GROQ_API_KEY;

let cachedClient = null;

async function connectDB() {
  if (cachedClient) {
    return cachedClient.db('ultron');
  }

  const client = new MongoClient(mongoUri);
  await client.connect();
  cachedClient = client;
  return client.db('ultron');
}

async function callGroqAPI(query) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI inventory assistant. Answer questions about products, inventory, and orders. Be concise and clear. Keep responses brief for voice output (max 150 words). Format responses in Markdown.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, userId } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    if (!groqApiKey) {
      return res.status(500).json({ error: 'GROQ_API_KEY not configured' });
    }

    // Get AI response from Groq
    const reply = await callGroqAPI(query);

    // Store in MongoDB (optional)
    try {
      const db = await connectDB();
      const conversations = db.collection('conversations');
      await conversations.insertOne({
        userId: userId || 'anonymous',
        userMessage: query,
        assistantReply: reply,
        timestamp: new Date(),
      });
    } catch (dbError) {
      console.error('MongoDB insert error:', dbError);
      // Don't fail the request if DB insert fails
    }

    return res.status(200).json({
      reply,
      success: true
    });

  } catch (error) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process chat',
      success: false
    });
  }
}
