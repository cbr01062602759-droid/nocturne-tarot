export default async function handler(req, res) {
  // CORS 및 메서드 제어
  res.setHeader('Access-Control-Allow-Credentials', true);
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
    return res.status(500).json({ error: 'GEMINI_API_KEY is not defined in Vercel environment' });
  }

  try {
    const bodyData = req.body || {};
    const { 
      step, 
      userName = '내담자', 
      userBirth = '', 
      question = '', 
      card1 = '', 
      card2 = '', 
      card3 = '', 
      allCards = [],
      starData
    } = bodyData;

    let prompt = '';

    if (step === 'synthesis') {
      const star = starData || { name: '익수(翼宿)', beast: '주작의 날개', realm: '남방 주작 (火)', desc: '비상을 향한 갈망과 고독한 자기 연마' };
      const cardsText = Array.isArray(allCards) 
        ? allCards.map(c => typeof c === 'object' ? `[${c.label || ''}: ${c.cardName || c.title || ''}]` : c).join(', ')
        : '18장 타로 전수 매트릭스';

      prompt = `
당신은 조선 천상열차분야지도 28수 천문과 카를 융의 분석심리학을 융합한 '녹턴 컴퍼스'의 나침반 마스터입니다.
내담자 성명: ${userName}
선천 명식(생년월일): ${userBirth}
천상열차분야지도 선천 본명수: ${star.name} [${star.realm}] (상징: ${star.beast}) - ${star.desc}
18장 도출 카드 매트릭스: ${cardsText}

[지침]
1. 첫 문단은 상단 인장에 새겨진 내담자의 고유 본명수인 [${star.name} (${star.beast})]의 선천적 기질과 숙명을 직접 선언하며 서늘하고 깊이 있게 시작하십시오.
2. 18장 카드 매트릭스의 흐름을 융 심리학의 그림자(Shadow), 아니마/아니무스, 개별화 과정(Individuation)과 결합하여 운명의 결단을 내리십시오.
3. 막연한 위로가 아닌, 냉철하고 실질적인 삶의 행동 지침을 구체적인 문장으로 제시하십시오.
      `;
    } else {
      // 00~05번 개별 문항 분석
      prompt = `
당신은 '녹턴 컴퍼스'의 심층 타로 분석 마스터입니다.
내담자 성명: ${userName}
생년월일: ${userBirth}
내담자 당면 질문: ${question}
도출된 3장의 아르카나 카드:
- 내면 기저: ${card1}
- 현실적 돌파 열쇠: ${card2}
- 향후 현실 궤적: ${card3}

[지침]
위 3장의 카드 흐름과 상징을 융합하여, 질문에 대한 심층적이고 통찰력 있는 해석과 현실적 행동 결단 지침을 단호하고 품격 있는 어조로 작성하십시오.
      `;
    }

    // 구글 공식 표준 엔드포인트
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;

    const apiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048
        }
      })
    });

    if (!apiRes.ok) {
      const errDetail = await apiRes.text();
      console.error('Google API Responded with Error:', errDetail);
      return res.status(500).json({ error: 'Google API 호출 실패', details: errDetail });
    }

    const data = await apiRes.json();
    const resultText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // 프론트엔드가 요구하는 키 규격에 맞춰 응답 반환
    if (step === 'synthesis') {
      return res.status(200).json({
        finalVerdict: resultText,
        verdictNarrative: resultText
      });
    } else {
      return res.status(200).json({
        narrative: resultText,
        verdictNarrative: resultText,
        analysis: resultText,
        text: resultText
      });
    }

  } catch (err) {
    console.error('Server Internal Exception:', err);
    return res.status(500).json({ error: '서버 내부 예외 발생', message: err.message });
  }
}
