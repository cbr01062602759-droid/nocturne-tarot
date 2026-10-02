// api/oracle.js - Vercel Serverless Function (격조 높은 융 심리학 마스터 버전)
export const config = {
  maxDuration: 60,
};

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
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API 키가 환경변수에 없습니다.' });
  }

  let bodyData = req.body;
  if (typeof bodyData === 'string') {
    try {
      bodyData = JSON.parse(bodyData);
    } catch (e) {
      bodyData = {};
    }
  }

  const step = bodyData.step || 'round';
  const userName = bodyData.userName || '내담자';
  const question = bodyData.question || '내담자의 실존적 갈림길';

  let prompt = '';

  if (step === 'synthesis') {
    // ✦ 18장 전체 총운 매트릭스 피날레
    const allCardsSummary = bodyData.allCards
      ? bodyData.allCards.map(c => `[${c.label}: ${c.cardName}]`).join(', ')
      : '전체 18장 아르카나 매트릭스';

    prompt = `
내담자 이름: ${userName}
도출된 18장 매트릭스: ${allCardsSummary}
상담 종합 맥락: ${JSON.stringify(bodyData.contextSummary || {})}

당신은 심층 심리학(카를 융)과 원형적 지혜를 집대성한 격조 높은 운명 나침반의 대마스터입니다.
상투적인 미사여구("흘린 땀방울은 배신하지 않는다" 등)나 천편일률적인 위로를 엄격히 금지합니다.
또한 인신공격적 비난이나 거친 언사도 배제하십시오.

대신, 내담자가 지금까지 무의식 속에서 겪어온 내적 투쟁과 그림자를 깊이 있게 조명하고, 
18장의 카드가 가리키는 거대한 운명의 분기점에서 내담자가 취해야 할 실천적 결단과 스토아적 자기 통제 규율을 장엄하고 서늘한 품격으로 서술하십시오.
(총 4~5문단의 완성도 높은 긴 호흡의 서사, 문단 구분은 줄바꿈 2번)

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "finalVerdict": "작성된 4~5문단의 장엄하고 깊이 있는 최종 판결문 본문",
  "verdictNarrative": "작성된 4~5문단의 장엄하고 깊이 있는 최종 판결문 본문"
}
`;
  } else {
    // ✦ 개별 1~5문항 3카드 분석
    const card1 = bodyData.card1 || (Array.isArray(bodyData.cards) ? bodyData.cards[0] : '미지의 아르카나');
    const card2 = bodyData.card2 || (Array.isArray(bodyData.cards) ? bodyData.cards[1] : '미지의 아르카나');
    const card3 = bodyData.card3 || (Array.isArray(bodyData.cards) ? bodyData.cards[2] : '미지의 아르카나');

    const c1Name = typeof card1 === 'object' ? (card1.name || JSON.stringify(card1)) : card1;
    const c2Name = typeof card2 === 'object' ? (card2.name || JSON.stringify(card2)) : card2;
    const c3Name = typeof card3 === 'object' ? (card3.name || JSON.stringify(card3)) : card3;

    prompt = `
내담자 이름: ${userName}
내담자 실존 질문: "${question}"
도출된 3대 아르카나:
1. 내면 기저(S/W): ${c1Name}
2. 현실 돌파(O/T): ${c2Name}
3. 향후 궤적(결과): ${c3Name}

당신은 영혼의 병목을 냉철하게 짚어내는 카를 융 심리학 기반의 직관적 타로 마스터입니다.
공허한 긍정이나 영혼 없는 위로를 배제하십시오.
동시에 '꼭두각시', '무능' 같은 감정적인 비난이나 과격한 폭언도 지양하십시오.
현상을 냉철하게 꿰뚫어 보되, 내담자가 주체적으로 자신의 현실을 직면하고 자립적인 결단을 내릴 수 있도록 돕는 '단호하고 무게감 있는 어른의 품격'을 유지하십시오.

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "verdictNarrative": "${userName} 님의 질문과 카드가 교차하는 지점을 짚어낸 명료하고 단호한 종합 신탁 지침 (3~4문장)",
  "baseAnalysis": "${c1Name} 카드가 보여주는 현재 내면의 무의식적 기저와 직면해야 할 그림자 (2~3문장)",
  "actionAnalysis": "${c2Name} 카드가 제시하는 감정에 휘둘리지 않는 현실적 돌파 규범과 행동 원칙 (2~3문장)",
  "futureAnalysis": "${c3Name} 카드가 예고하는 인과적 귀결과 내담자가 감당해야 할 현실적 책임 (2~3문장)"
}
`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

  try {
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.65, // 서술의 깊이와 격조를 살리는 최적 균형점
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      return res.status(500).json({ error: 'Gemini Reject', details: errText });
    }

    const data = await apiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);

    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: 'Server Error', message: err.message });
  }
}
