export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    const body = req.body || {};
    const question = body.question || '내담자의 실존적 질문';
    const userName = body.userName || '내담자';

    // 프론트엔드가 어떤 형식으로 카드를 보내든 100% 안전하게 추출하는 방어 로직
    let card1Name = '알 수 없음', card2Name = '알 수 없음', card3Name = '알 수 없음';

    if (body.c1) card1Name = body.c1.name || body.c1.title || String(body.c1);
    if (body.c2) card2Name = body.c2.name || body.c2.title || String(body.c2);
    if (body.c3) card3Name = body.c3.name || body.c3.title || String(body.c3);

    if (Array.isArray(body.cards) && body.cards.length >= 3) {
      card1Name = body.cards[0]?.name || body.cards[0]?.title || String(body.cards[0]);
      card2Name = body.cards[1]?.name || body.cards[1]?.title || String(body.cards[1]);
      card3Name = body.cards[2]?.name || body.cards[2]?.title || String(body.cards[2]);
    }

    const systemInstruction = `당신은 칼 융의 분석심리학과 정통 카발라 타로의 비의를 융합한 심층 신탁 나침반 'NOCTURNE COMPASS'의 마스터 지능체입니다.
[지침]
1. 사연자의 닉네임(${userName})과 사연의 전후 맥락(상실감, 비대칭 권력관계, 승진 누락, 질투, 심리적 기저)을 소름 돋을 정도로 냉철하고 정확하게 파악하십시오. 절대 사연의 사실관계를 왜곡하거나 부적절한 축하 등 엉뚱한 소리를 하지 마십시오.
2. 미사여구와 흔한 인사말(안녕하세요, 안타깝습니다 등)은 일체 배제하고, 품격 있고 날카로운 문체로 본질을 꿰뚫으십시오.
3. 반드시 아래 JSON 형식으로만 순수하게 출력하십시오:
{
  "verdictNarrative": "질문 전체를 관통하는 칼 융 심층 심리학 기반의 종합 실전 결단 지침 (3~4문장의 밀도 높은 통찰)",
  "baseAnalysis": "첫 번째 카드가 짚어내는 내면 기저 및 무의식 병목 해독 (2~3문장)",
  "actionAnalysis": "두 번째 카드가 제시하는 현실 돌파 및 행동 규범 (2~3문장)",
  "futureAnalysis": "세 번째 카드가 예고하는 인과적 미래 결실 궤적 (2~3문장)"
}`;

    const promptText = `[내담자 사연/질문]: ${question}
[선택된 원형 카드 3장]:
1. 기저/원인: ${card1Name}
2. 대안/행동: ${card2Name}
3. 결실/미래: ${card3Name}

위 사연과 카드를 해독하여 지정된 JSON으로만 회신하십시오.`;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: systemInstruction }] },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Gemini API Error' });
    }

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());

    return res.status(200).json(parsed);

  } catch (error) {
    console.error("Oracle API Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
