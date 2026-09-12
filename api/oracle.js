const { GoogleGenerativeAI } = require("@google/generative-ai");

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

    const genAI = new GoogleGenerativeAI(apiKey);
    // 공식 라이브러리가 최신 유효 엔드포인트를 자동 관리합니다.
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const replyText = response.text();

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
      error: 'Gemini API Error',
      details: error.message
    });
  }
};
