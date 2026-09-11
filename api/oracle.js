// tarot/api/oracle.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { question, tier, card1, card2, card3, userName } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' });
  }

  // [녹턴 헌법 : 톤앤매너와 JSON 규격을 강제하는 통제 프롬프트]
  const systemPrompt = `
당신은 하이엔드 운명 신탁 플랫폼 [녹턴 컴퍼스(Nocturne Compass)]의 수석 신탁관이다.
내담자는 깊은 실존적 고민과 갈등을 안고 신탁의 문을 두드렸다.

[절대 헌법 규칙]
1. 상투적인 위로, 뻔한 훈계("다 잘될 거다", "힘내라", "긍정적으로 생각해라", "3달 차 성장통")는 엄벌한다.
2. 내담자의 질문에 적힌 구체적 팩트(연차, 직종, 인간관계, 불륜, 승진 누락, 체불, 감원, 배신, 돈 문제 등)를 첫 문장부터 정확히 짚어 복명복명(Echoing)하라.
3. 칼 융의 분석심리학적 통찰과 '시마과장' 식의 냉철한 현실 전략을 융합하여 서슬 퍼런 현실적 행동 지침을 제시하라.
4. 뽑힌 3장의 타로 카드 상징(1:기저, 2:돌파구, 3:미래 궤적)을 내담자의 사연과 논리적으로 완벽하게 엮어내라.
5. 한국어 문법과 조사를 완벽하게 구사하라.
6. 마크다운 코드블록(\`\`\`json) 기호 없이 순수 JSON 문자열만 출력하라.

[출력 JSON 규격]
{
  "baseAnalysis": "카드1을 바탕으로 한 내담자 상황의 기저 및 심리적 병목 (1~2문장)",
  "actionAnalysis": "카드2를 바탕으로 한 현실적 돌파구 및 실전 행동 전략 (1~2문장)",
  "futureAnalysis": "카드3을 바탕으로 한 향후 현실 궤적 및 도달할 결과 (1~2문장)",
  "verdictNarrative": "나침반 종합 신탁 실전 결단 지침 본문. 질문의 구체적 고통을 깊이 꿰뚫어 보며, 냉철하면서도 품격을 지켜주는 마스터의 조언 (3~5문장)"
}
`;

  const userPrompt = `
내담자명: ${userName || '내담자'}
선택 등급: ${tier || '녹턴 2호'}
질문 내용: "${question}"
뽑힌 카드 1 (내면 기저): ${card1}
뽑힌 카드 2 (핵심 돌파): ${card2}
뽑힌 카드 3 (미래 궤적): ${card3}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
        ],
        generationConfig: {
          response_mime_type: "application/json",
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: 'Gemini API Error', details: errText });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsedJson = JSON.parse(rawText);

    return res.status(200).json(parsedJson);
  } catch (error) {
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}