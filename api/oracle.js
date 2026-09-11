module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on Vercel' });
  }

  try {
    const { prompt } = req.body;
    
    // Gemini 1.5 Flash 최신 REST API 직결 (버전/의존성 에러 없음)
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: typeof prompt === 'string' ? prompt : JSON.stringify(prompt) }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ 
        error: 'Gemini API Error', 
        details: data.error?.message || 'Unknown API Error' 
      });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return res.status(200).json({ 
      text: replyText,
      candidates: data.candidates 
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
};
