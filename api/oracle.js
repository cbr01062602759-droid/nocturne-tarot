export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing in Vercel settings' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = { prompt: body };
      }
    }

    let userPrompt = '';
    if (body?.prompt) {
      userPrompt = typeof body.prompt === 'string' ? body.prompt : JSON.stringify(body.prompt);
    } else if (body?.contents?.[0]?.parts?.[0]?.text) {
      userPrompt = body.contents[0].parts[0].text;
    } else if (body?.message) {
      userPrompt = body.message;
    } else {
      userPrompt = JSON.stringify(body || {});
    }

    if (!userPrompt || userPrompt.trim() === '' || userPrompt === '{}') {
      userPrompt = '타로 카드를 바탕으로 내담자에게 맞춘 깊이 있는 운세 해석을 작성해 주세요.';
    }

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
              { text: userPrompt }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Gemini API Error',
        details: data.error?.message || JSON.stringify(data)
      });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      text: replyText,
      oracle: replyText,
      candidates: data.candidates
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
