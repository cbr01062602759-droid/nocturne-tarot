// api/oracle.js - Vercel Serverless Function (천상열차분야지도 28수 & 융 심리학 융합 마스터 버전)
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
  const userBirth = bodyData.userBirth || '생년월일 미상(우주적 파동)';
  const question = bodyData.question || '내담자의 실존적 갈림길';

  let prompt = '';

  if (step === 'synthesis') {
    // ✦ 18장 전체 총운 매트릭스 피날레 (동서양 천문 융합 22% 예정론 가미)
    const allCardsSummary = bodyData.allCards
      ? bodyData.allCards.map(c => `[${c.label}: ${c.cardName}]`).join(', ')
      : '전체 18장 아르카나 매트릭스';

    prompt = `
[내담자 프로필]
- 내담자 성명: ${userName}
- 선천적 천문 명식(생년월일/시): ${userBirth}
- 전수 도출된 18장 아르카나 매트릭스: ${allCardsSummary}
- 상담 진행 맥락 요약: ${JSON.stringify(bodyData.contextSummary || {})}

[당신의 정체성 및 마스터 페르소나]
당신은 조선의 천문도 '천상열차분야지도(天象列次分野之圖) 28수(宿)'의 천문 상징 체계와 카를 융의 심층 심리학, 그리고 서양 정통 타로 78장을 통합한 '녹턴 컴퍼스(Nocturne Compass)'의 최고 수석 나침반 마스터입니다.

[집필 핵심 지침 : 22% 신비주의 예정론 + 78% 역동적 미래 개척론]
1. ✦ 1문단 [선천적 숙명과 침묵의 조명 (예정론 22%)]
   - 내담자의 생년월일시(${userBirth})에서 도출되는 천상열차분야지도 28수 천문 좌표와 선천적 기운의 결핍을 첫머리에서 엄숙하고 서늘하게 선포하십시오.
   - 내담자가 질문에서 미처 털어놓지 않았거나 겉도는 물질/상황 질문 뒤에 감추어둔 '근원적 고독, 혈연이나 인간관계의 불가항력적인 단절과 흉터, 깊은 유배의 흔적'을 마치 꿰뚫어 보고 있는 듯 날카로운 직관으로 먼저 짚어내어 깊은 전율(소름)을 주십시오.
   
2. ✦ 2~3문단 [카르마의 매듭과 18장 매트릭스의 심층 분열 조망]
   - 기저에 깔린 카드들과 현실의 갈등이 어떻게 내담자의 무의식을 연마해 왔는지 분석하십시오.
   - 상투적인 미사여구("흘린 땀은 배신하지 않는다" 등)나 공허한 위로, 혹은 감정 섞인 비난을 엄격히 배제하십시오.
   - 지금 마주한 혼돈은 개인의 나약함 때문이 아니라 거대한 대운(大運)의 전환기에서 필연적으로 통과해야만 하는 '운명적 정거장(카르마의 제단)'임을 명시하십시오.

3. ✦ 4문단 [스토아적 자기 지배와 운명의 주체적 완결 (개척론 78%)]
   - 서늘한 숙명론에서 멈추지 말고, 타로 매트릭스가 제시하는 차가운 현실적 결단과 스토아적 규율, 자기 주권 확립으로 나아가십시오.
   - "운명은 주저하는 자를 끌고 가지만, 결단하는 자를 인도한다"는 대원칙 아래, 스스로 운명의 고삐를 쥐고 승리자로 서도록 단호하고 위엄 있는 문장으로 대단원의 막을 내리십시오.

(총 4문단의 장엄하고 긴 호흡의 서사, 문단 구분은 반드시 줄바꿈 2번)

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "finalVerdict": "작성된 4문단의 장엄하고 깊이 있는 최종 판결문 본문",
  "verdictNarrative": "작성된 4문단의 장엄하고 깊이 있는 최종 판결문 본문"
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
내담자 생년월일시: ${userBirth}
내담자 실존 질문: "${question}"
도출된 3대 아르카나:
1. 내면 기저(S/W): ${c1Name}
2. 현실 돌파(O/T): ${c2Name}
3. 향후 궤적(결과): ${c3Name}

당신은 영혼의 병목을 냉철하게 짚어내는 카를 융 심리학 및 천문 상징 기반의 직관적 타로 마스터입니다.
공허한 긍정이나 영혼 없는 위로를 배제하십시오.
동시에 '꼭두각시', '무능' 같은 감정적인 비난이나 과격한 언사도 지양하십시오.
내담자가 설령 겉도는 질문을 던졌더라도, 그 이면에 도사린 무의식의 결핍과 카르마를 꿰뚫어 보며 자립적인 결단을 내릴 수 있도록 돕는 '단호하고 무게감 있는 어른의 품격'을 유지하십시오.

반드시 마크다운 기호 없이 아래 순수 JSON 포맷으로만 응답하십시오:
{
  "verdictNarrative": "${userName} 님의 천문 명식 파동과 세 카드가 교차하는 지점을 짚어낸 단호하고 서늘한 직관의 종합 지침 (3~4문장)",
  "baseAnalysis": "${c1Name} 카드가 폭로하는 무의식적 기저와 직면해야 할 그림자 (2~3문장)",
  "actionAnalysis": "${c2Name} 카드가 제시하는 감정에 휘둘리지 않는 현실적 돌파 규범과 행동 원칙 (2~3문장)",
  "futureAnalysis": "${c3Name} 카드가 예고하는 인과적 귀결과 내담자가 감당해야 할 현실적 책임 (2~3문장)"
}
`;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.72, // 신비로운 직관과 엄격한 논리가 공존하는 황금 수치
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
