// api/oracle.js - Vercel Serverless Function
export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API 키가 환경변수에 등록되지 않았습니다.' });
  }

  const { step, question, cards, previousContext, userName } = req.body;

  let userPrompt = '';

  if (step === 'synthesis') {
    // 06번 최종 마스터 종합 판결문 (날카로운 현실 직면 및 훈계)
    userPrompt = `
당신은 '녹턴 컴퍼스'의 엄격한 심리 마스터입니다. 카를 융 심리학과 스토아 규율을 기반으로 내담자의 질문과 18장의 카드를 냉철히 관통하십시오.
[절대 규칙]
1. 내담자의 질문에 나태함, 현실 도피, 의지박약이 엿보인다면 절대 '땀방울', '잘하고 있다' 식의 공허한 칭찬이나 감언이설을 하지 마십시오.
2. 내담자의 자기기만과 나태한 그림자(Shadow)를 차갑게 직시시키고 엄중히 꾸짖으십시오.
3. 국립국어원 표준어만 사용하고, '생교적' 같은 조어는 절대 쓰지 마십시오.

내담자: ${userName || '내담자'}
상담 맥락: ${JSON.stringify(previousContext || {})}

반드시 아래 JSON 형식으로만 응답하십시오:
{
  "finalVerdict": "준엄한 현실 직시, 인과의 법칙, 당장 실천해야 할 냉혹한 행동 규율을 담은 4~5문단의 최종 판결문"
}
`;
  } else {
    // 00~05번 각 문항별 카드 3장 해석
    userPrompt = `
당신은 냉철한 심리 분석가입니다. 내담자의 질문에 영합하거나 달콤한 위로를 건네지 말고, 카드가 가리키는 뼈아픈 현실과 실천 전략을 표준어로 명확히 제시하십시오.

내담자: ${userName || '내담자'}
문항: ${step}
질문: "${question || ''}"
카드:
1. S/W: ${cards?.[0]?.name || ''}
2. O/T: ${cards?.[1]?.name || ''}
3. 결과: ${cards?.[2]?.name || ''}

반드시 아래 JSON 형식으로만 응답하십시오:
{
  "verdictTitle": "핵심을 찌르는 단호한 한 줄 통찰",
  "swAnalysis": "${cards?.[0]?.name || ''} 카드로 본 내면의 회피와 현실적 병목 (2~3문장)",
  "otStrategy": "${cards?.[1]?.name || ''} 카드로 본 현실 돌파 전략 규범 (2~3문장)",
  "resultTrajectory": "${cards?.[2]?.name || ''} 카드가 예고하는 인과적 미래와 책임 (2~3문장)"
}
`;
  }

  // Gemini API v1beta 엔드포인트
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }]
      }
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json'
    }
  };

  try {
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!apiRes.ok) {
      const errBody = await apiRes.text();
      console.error('Gemini Raw Error:', errBody);
      return res.status(500).json({ error: 'Gemini 통신 거절', details: errBody });
    }

    const data = await apiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // JSON 문자열 파싱 후 반환
    const parsed = JSON.parse(text);
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('서버 에러 발생:', error.message);
    return res.status(500).json({ error: '서버 내부 처리 오류', message: error.message });
  }
}
