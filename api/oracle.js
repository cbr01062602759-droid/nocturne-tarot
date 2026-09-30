// api/oracle.js - Vercel Serverless Function
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

  const { step, question, cards, previousContext, userName } = bodyData || {};

  const getCardName = (idx) => {
    if (!cards) return '미지의 아르카나';
    if (Array.isArray(cards)) {
      const item = cards[idx];
      if (!item) return '미지의 아르카나';
      return typeof item === 'string' ? item : (item.name || item.title || JSON.stringify(item));
    }
    return typeof cards === 'string' ? cards : '미지의 아르카나';
  };

  const card1 = getCardName(0);
  const card2 = getCardName(1);
  const card3 = getCardName(2);

  let prompt = '';
  if (step === 'synthesis') {
    prompt = `
내담자 이름: ${userName || '내담자'}
상담 맥락: ${JSON.stringify(previousContext || {})}

당신은 엄격한 심리 마스터입니다. 내담자의 질문에 나태함, 현실 도피, 의지박약이 엿보인다면 '땀방울', '잘하고 있다' 식의 공허한 위로를 일절 금지합니다.
내담자의 자기기만을 냉철히 꾸짖고, 카를 융의 그림자 직면과 스토아적 행동 규율을 담아 4~5문단의 장엄하고 날카로운 최종 신성 판결문(Grand Synthesis)을 작성하십시오. 표준어만 사용하십시오.

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "finalVerdict": "작성된 최종 판결문 내용"
}
`;
  } else {
    prompt = `
내담자 이름: ${userName || '내담자'}
문항: ${step}
내담자 질문: "${question || ''}"
도출 카드:
1. S/W: ${card1}
2. O/T: ${card2}
3. 결과: ${card3}

공허한 위로를 배제하고 카드가 제시하는 냉엄한 현실과 실천 전략을 분석하십시오. 표준어만 사용하십시오.

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "verdictTitle": "한 줄 통찰",
  "swAnalysis": "${card1} 카드로 본 내면 기저 및 병목 분석 (2~3문장)",
  "otStrategy": "${card2} 카드로 본 현실 돌파 전략 규범 (2~3문장)",
  "resultTrajectory": "${card3} 카드가 예고하는 인과적 미래와 책임 (2~3문장)"
}
`;
  }

  // 404를 뚫기 위해 유효 모델 후보군을 순차 시도
  const modelCandidates = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-2.0-flash',
    'gemini-pro'
  ];

  let lastError = null;

  for (const model of modelCandidates) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const apiRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(rawText);
        return res.status(200).json(parsed);
      } else {
        lastError = await apiRes.text();
      }
    } catch (e) {
      lastError = e.message;
    }
  }

  console.error('All model attempts failed:', lastError);
  return res.status(500).json({ error: 'Gemini Models Exhausted', details: lastError });
}
