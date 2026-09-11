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
    // req.body 파싱 (문자열로 들어오든 객체로 들어오든 처리)
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = { prompt: body };
      }
    }

    // index.html에서 어떤 키값(prompt, message, contents 등)으로 넘겨도 텍스트 추출
    let userPrompt = '';
    if (body.prompt) {
      userPrompt = typeof body.prompt === 'string' ? body.prompt : JSON.stringify(body.prompt);
    } else if (body.contents && body.contents[0]?.parts?.[0]?.text) {
      userPrompt = body.contents[0].parts[0].text;
    } else if (body.message) {
      userPrompt = body.message;
    } else {
      userPrompt = JSON.stringify(body);
    }

    // 빈 텍스트 방어 기본값
    if (!userPrompt || userPrompt.trim() === '' || userPrompt === '{}') {
      userPrompt = '타로 카드를 기반으로 운세를 정성스럽게 해석해 주세요.';
    }

    // Gemini 최신 REST 엔드포인트
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

    // 프런트엔드가 어떤 포맷을 기대하든 호환되도록 일괄 응답 구성
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
};
