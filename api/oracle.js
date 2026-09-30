// api/oracle.js - Vercel Serverless Function
export const config = {
  maxDuration: 60, // 타임아웃 60초 확보
};

export default async function handler(req, res) {
  // CORS 헤더 설정
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
    return res.status(500).json({ error: 'Gemini API Key가 서버 환경변수에 설정되지 않았습니다.' });
  }

  const { step, question, cards, previousContext, userName } = req.body;

  // 준엄한 심리 분석 및 그림자 직면 프롬프트 시스템 지침
  const systemInstruction = `
당신은 '녹턴 컴퍼스(NOCTURNE COMPASS)'의 수석 신탁관이자 카를 융 심층심리학과 스토아 철학에 정통한 엄격한 마스터입니다.

[절대 규범 - 공허한 칭찬 및 감언이설 금지]
1. 내담자의 질문에 현실 도피, 나태, 무책임, 의지박약, 방관자적 태도가 담겨 있다면 절대 "잘하고 있다", "당신의 땀방울" 같은 상투적이고 공허한 칭찬을 하지 마십시오.
2. 내담자는 이미 자신의 게으름과 비겁함을 알고 있습니다. 근거 없는 낙관론은 상담의 신뢰를 무너뜨립니다.
3. 내담자의 무의식적 그림자(Shadow)와 나태한 자기기만을 차갑고 명확한 어조로 직면시키고 준엄하게 꾸짖으십시오.
4. 국립국어원 표준어에 부합하는 명확한 철학·심리학 어휘만을 사용하십시오. '생교적'과 같은 비표준 조어나 왜곡된 단어 생성을 엄격히 금지합니다.
5. 오직 융의 심리학(무의식, 그림자, 페르소나, 개성화)과 스토아적 규율, 그리고 타로 카드의 상징 체계만을 바탕으로 냉철하게 분석하십시오.

[출력 형식 규칙]
반드시 순수 JSON 형식으로만 응답해야 합니다. 마크다운(\`\`\`json) 기호를 절대 포함하지 마십시오.
`;

  let prompt = '';

  if (step === 'synthesis') {
    // 06번 최종 종합 판결문 프롬프트 (죽비 서사)
    prompt = `
내담자 이름: ${userName || '내담자'}
내담자가 던진 5개 질문과 제단에 펼쳐진 18장의 아르카나 전체 맥락:
${JSON.stringify(previousContext, null, 2)}

위 전체 맥락을 관통하여 [나침반 마스터 최종 신성 판결문 (Grand Synthesis)]을 작성하십시오.
반드시 아래 3단계 구조를 갖추어 준엄하게 작성하십시오:

1. [준엄한 현실 직시 (Cold Reality Check)]:
내담자가 회피해온 자기기만, 안일함, 요행을 바라는 나태한 태도를 칼로 베어내듯 지적하십시오. 대가를 치르지 않고 방구석에서 안락함만 좇는 것은 영혼의 퇴행임을 단호히 경고하십시오.

2. [아르카나 매트릭스의 심판 (Arcana's Indictment)]:
도출된 카드들이 가리키는 냉혹한 인과의 법칙을 선언하십시오. 행동하지 않는 자에게 돌아올 파국과 고립을 가감 없이 보여주십시오.

3. [실질적 행동 규율 (Actionable Discipline)]:
달콤한 위로 대신, 당장 침대를 박차고 일어나 현실에서 자신의 가치를 증명해야 할 냉혹하고 구체적인 행동 원칙을 명령하십시오.

출력 JSON 형식:
{
  "finalVerdict": "위 3단계가 유기적으로 연결된 4~5문단의 장엄하고 서슬 퍼런 최종 판결문 텍스트"
}
`;
  } else {
    // 00~05번 각 문항별 카드 해석 프롬프트
    prompt = `
내담자 이름: ${userName || '내담자'}
문항 번호: ${step}
내담자의 질문: "${question}"
도출된 3장의 아르카나:
1. 내면 기저/병목 (S/W): ${cards[0].name}
2. 현실적 돌파 전략 (O/T): ${cards[1].name}
3. 향후 현실 궤적 (결과): ${cards[2].name}

내담자의 질문 의도를 정확히 파악하여, 겉치레 위로가 아닌 냉철한 현실 분석을 제공하십시오.
경제적·실질적 자립과 책임감을 강조하고, 모호한 신조어 대신 '경제적·생계적 자립' 등 정확한 표준어를 사용하십시오.

출력 JSON 형식:
{
  "verdictTitle": "문항의 본질을 꿰뚫는 한 줄 직관적 통찰",
  "swAnalysis": "${cards[0].name} 카드를 통해 내면의 무의식적 기저와 현실 도피적 병목을 직시시키는 분석 (2~3문장)",
  "otStrategy": "${cards[1].name} 카드를 통해 현실의 벽을 깨부수기 위해 당장 실천해야 할 냉혹한 전략 규범 (2~3문장)",
  "resultTrajectory": "${cards[2].name} 카드가 예고하는 인과적 미래와 스스로 책임져야 할 결과 (2~3문장)"
}
`;
  }

  // Gemini API 통신 (지연 방지 및 내부 1회 재시도 로직)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {
      temperature: 0.3, // 일관되고 엄격한 톤앤매너
      responseMimeType: 'application/json',
    },
  };

  let attempt = 0;
  while (attempt < 2) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText);

      return res.status(200).json(parsed);
    } catch (err) {
      attempt++;
      console.error(`Gemini 통신 시도 ${attempt} 실패:`, err.message);
      if (attempt >= 2) {
        return res.status(500).json({ error: 'Gemini API 통신 실패', details: err.message });
      }
      // 1초 대기 후 1회 재시도 (500 에러 방지)
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}
