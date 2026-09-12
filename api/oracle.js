module.exports = async function handler(req, res) {
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
        body = { question: body };
      }
    }

    const q = body.question || '내담자의 전반적인 운세';
    const c1 = body.card1 || '기저 카드';
    const c2 = body.card2 || '행동 카드';
    const c3 = body.card3 || '결과 카드';
    const user = body.userName || '내담자';

    const promptText = `당신은 깊은 통찰력을 지닌 신비로운 마스터 타로 리더입니다.
내담자 이름: ${user}
내담자의 고민: "${q}"
뽑힌 3장의 타로 카드:
1. 기저: ${c1}
2. 행동: ${c2}
3. 미래: ${c3}

위 3장의 카드 상징과 내담자의 상황을 융합하여 마음을 울리는 깊이 있는 최종 신탁 판결문(The Sacred Verdict)을 완성해 주세요.`;

    // 최신 v1beta 표준 모델 엔드포인트
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const apiRes = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({
        error: 'Gemini API Error',
        details: data.error?.message || JSON.stringify(data)
      });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      verdictNarrative: reply,
      synthesis: reply,
      oracle: reply,
      text: reply,
      verdict: reply
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Server Error',
      message: err.message
    });
  }
};
