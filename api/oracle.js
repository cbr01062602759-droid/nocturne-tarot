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

  const { step, question, cards, previousContext, userName } = req.body;

  let prompt = '';
  if (step === 'synthesis') {
    prompt = `
내담자 이름: ${userName || '내담자'}
상담 전체 맥락:
${JSON.stringify(previousContext || {})}

당신은 엄격한 심리 마스터입니다. 내담자의 질문에 나태함, 현실 도피, 의지박약이 보인다면 절대 '땀방울', '잘하고 있다' 식의 공허한 칭찬이나 감언이설을 하지 마십시오.
내담자의 자기기만을 냉철히 꾸짖고, 카를 융의 그림자 직면과 스토아적 행동 규율을 담아 4~5문단의 장엄하고 날카로운 최종 신성 판결문(Grand Synthesis)을 작성하십시오.
반드시 국립국어원 표준어만 사용하십시오.

반드시 아래 JSON 포맷으로만 응답하십시오:
{
  "finalVerdict": "작성된 최종 판결문 내용"
}
`;
  } else {
    prompt = `
내담자 이름: ${userName || '내담자'}
문항: ${step}
질문: "${question || ''}"
도출 카드:
1. S/W: ${cards?.[0]?.name || ''}
2. O/T: ${cards?.[1]?.name || ''}
3. 결과: ${cards?.[2]?.name || ''}

공허한 위로를 배제하고 카드가 제시하는 냉엄한 현실과 돌파 전략을 분석하십시오. 표준어만 사용하십시오.

반드시 아래 JSON 포맷으로만 응답하십시오:
{
  "verdictTitle": "한 줄 통찰",
  "swAnalysis": "내면 기저 및 병목 분석 (2~3문장)",
  "otStrategy": "현실적 돌파 전략 (2~3문장)",
  "resultTrajectory": "향후 현실 궤적 및 책임 (2~3문장)"
}
`;
  }

  // 404를 원천 방지하는 구글 공식 v1beta latest 엔드포인트
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      responseMimeType: 'application/json',
    },
  };

  try {
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('Gemini API Rejection:', errText);
      return res.status(500).json({ error: 'Gemini 거절', details: errText });
    }

    const data = await apiResponse.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Server Catch Error:', err.message);
    return res.status(500).json({ error: '내부 에러', message: err.message });
  }
}
