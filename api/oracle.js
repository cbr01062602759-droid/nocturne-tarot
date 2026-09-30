// api/oracle.js
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key missing' });
  }

  // 1. 요청 본문 파싱 (문자열/객체 무관 안전 처리)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) { body = {}; }
  }
  body = body || {};

  const step = body.step || '0';
  const userName = body.userName || '내담자';
  const question = body.question || '현재 삶의 방향과 실존적 고뇌';

  // 2. 카드 이름 추출 (어떤 형식으로 들어와도 에러 없이 텍스트 추출)
  let cardListText = '';
  if (Array.isArray(body.cards)) {
    cardListText = body.cards.map((c, i) => {
      const name = (c && typeof c === 'object') ? (c.name || c.title || JSON.stringify(c)) : String(c || '');
      return `${i + 1}. ${name}`;
    }).join('\n');
  } else if (body.cards) {
    cardListText = JSON.stringify(body.cards);
  } else {
    cardListText = '1. 현재 기저 카드\n2. 돌파 열쇠 카드\n3. 미래 결과 카드';
  }

  // 3. 단계별 프롬프트 구성
  let prompt = '';
  if (step === 'synthesis') {
    prompt = `
내담자 이름: ${userName}
전체 상담 데이터: ${JSON.stringify(body.previousContext || body)}

당신은 엄격한 심리 마스터입니다. 내담자의 질문에 나태함, 현실 도피, 의지박약이 보인다면 '땀방울', '잘하고 있다' 같은 공허한 칭찬을 절대 하지 마십시오.
내담자의 자기기만을 냉철히 꾸짖고, 카를 융의 그림자 직면과 스토아적 행동 규율을 담아 4~5문단의 장엄하고 날카로운 최종 신성 판결문(Grand Synthesis)을 작성하십시오. 표준어만 사용하십시오.

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "finalVerdict": "작성된 최종 판결문 내용"
}
`;
  } else {
    prompt = `
내담자 이름: ${userName}
문항 단계: ${step}
내담자 질문: "${question}"
도출된 3장의 아르카나:
${cardListText}

공허한 위로를 배제하고 카드가 제시하는 냉엄한 현실과 돌파 전략을 분석하십시오. 표준어만 사용하십시오.

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "verdictTitle": "핵심을 찌르는 단호한 한 줄 통찰",
  "swAnalysis": "1번 카드로 본 내면 기저 및 병목 분석 (2~3문장)",
  "otStrategy": "2번 카드로 본 현실 돌파 전략 규범 (2~3문장)",
  "resultTrajectory": "3번 카드가 예고하는 인과적 미래와 책임 (2~3문장)"
}
`;
  }

  // 4. Gemini 1.5 Flash 호출
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!apiRes.ok) {
      const errText = await apiRes.text();
      console.error('Gemini 거절 로그:', errText);
      return res.status(500).json({ error: 'Gemini rejection', details: errText });
    }

    const data = await apiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('처리 예외 로그:', err.message);
    return res.status(500).json({ error: 'Server handler error', message: err.message });
  }
}
