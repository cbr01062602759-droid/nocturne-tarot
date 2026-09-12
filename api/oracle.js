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
    const c1 = body.card1 || '과거/기저 카드';
    const c2 = body.card2 || '현재/행동 카드';
    const c3 = body.card3 || '미래/결과 카드';
    const user = body.userName || '내담자';

    const fullPrompt = `당신은 깊은 통찰력을 지닌 신비로운 마스터 타로 리더입니다.
내담자 이름: ${user}
내담자의 고민/질문: "${q}"
뽑힌 3장의 타로 카드:
1. 기저(원인): ${c1}
2. 행동(전개): ${c2}
3. 미래(결론): ${c3}

위의 3장의 카드 상징과 내담자의 상황을 결합하여 가슴을 울리는 통찰력 있고 정성스러운 최종 신탁 판결문(Grand Synthesis)을 작성해 주세요. 문단별로 깔끔하고 격조 높은 어조로 서술하세요.`;

    const requestPayload = {
      contents: [
        {
          parts: [{ text: fullPrompt }]
        }
      ]
    };

    // 1순위: gemini-1.5-flash-latest (v1beta)
    // 2순위: gemini-1.5-flash (v1)
    // 3순위: gemini-pro (v1)
    const candidateUrls = [
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`
    ];

    let replyText = '';
    let lastError = null;

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        const data = await response.json();

        if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
          replyText = data.candidates[0].content.parts[0].text;
          break; // 성공 시 루프 탈출
        } else {
          lastError = data.error?.message || JSON.stringify(data);
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!replyText) {
      return res.status(500).json({
        error: 'Gemini API Error',
        details: lastError || 'All Gemini model endpoints failed'
      });
    }

    // index.html에서 어떤 키값으로 읽든 즉시 화면에 꽂히도록 모든 주요 키 매핑
    return res.status(200).json({
      verdictNarrative: replyText,
      synthesis: replyText,
      oracle: replyText,
      text: replyText,
      verdict: replyText,
      result: replyText
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
};
