// api/oracle.js - Vercel Serverless Function (프론트엔드 완벽 호환 버전)
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

  // 프론트엔드가 보내는 규격 완벽 대응 (card1, card2, card3 및 cards 배열 모두 수용)
  const question = bodyData.question || '내담자가 마주한 실존적 갈림길';
  const userName = bodyData.userName || '내담자';
  const step = bodyData.step || 'round';

  const card1 = bodyData.card1 || (Array.isArray(bodyData.cards) ? bodyData.cards[0] : '미지의 아르카나');
  const card2 = bodyData.card2 || (Array.isArray(bodyData.cards) ? bodyData.cards[1] : '미지의 아르카나');
  const card3 = bodyData.card3 || (Array.isArray(bodyData.cards) ? bodyData.cards[2] : '미지의 아르카나');

  let prompt = '';
  if (step === 'synthesis') {
    prompt = `
내담자 이름: ${userName}
내담자 질문: "${question}"
상담 전체 맥락: ${JSON.stringify(bodyData.previousContext || {})}

당신은 영혼의 병목을 꿰뚫어 보는 최고의 직관적 타로 마스터입니다.
상투적인 위로, 뻔한 칭찬, 천편일률적인 격려를 일절 배제하십시오.
내담자의 숨은 무의식적 회피와 자기기만을 날카롭게 직면시키고, 카를 융의 심리학적 통찰과 실천적 결단을 담은 4~5문단의 장엄하고 서슬 퍼런 최종 신성 판결문(Grand Synthesis)을 작성하십시오. 표준어만 사용하십시오.

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "verdictNarrative": "작성된 심층 최종 판결문 본문 (4~5문단)",
  "verdictTitle": "카드가 가리키는 서늘한 최종 본질 통찰"
}
`;
  } else {
    prompt = `
내담자 이름: ${userName}
내담자 실존 질문: "${question}"
도출된 3대 아르카나:
1. 내면 기저: ${typeof card1 === 'object' ? JSON.stringify(card1) : card1}
2. 현실 돌파: ${typeof card2 === 'object' ? JSON.stringify(card2) : card2}
3. 미래 귀결: ${typeof card3 === 'object' ? JSON.stringify(card3) : card3}

공허한 긍정과 앵무새 같은 교과서식 해설을 일절 배제하십시오.
내담자의 구체적인 질문 상황("${question}")과 세 장의 카드가 맺는 독특한 역학 관계를 꿰뚫어 독창적이고 날카로운 통찰을 제시하십시오.

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "verdictNarrative": "${userName} 님의 질문에 대한 날카롭고 직관적인 종합 신탁 문장 (3~4문장으로 서술)",
  "verdictTitle": "카드가 가리키는 서늘한 한 줄 본질 통찰",
  "swAnalysis": "1번 카드로 폭로하는 내면의 무의식적 병목과 그림자 직면 (2~3문장)",
  "otStrategy": "2번 카드가 명령하는 비타협적이고 현실적인 돌파 규율과 결단 (2~3문장)",
  "resultTrajectory": "3번 카드가 경고하는 인과적 귀결과 내담자가 져야 할 책임 (2~3문장)"
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
          temperature: 0.75, // 창의적이고 풍부한 심층 분석 유도
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
