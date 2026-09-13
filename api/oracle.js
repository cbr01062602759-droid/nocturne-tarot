export default async function handler(req, res) {
  // CORS 및 호출 권한 허용 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 브라우저 사전 통신(OPTIONS) 즉시 통과
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST 요청만 처리
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 프론트엔드에서 보낸 prompt 또는 body 데이터 수신
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const promptText = body?.prompt || body?.text || JSON.stringify(body);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 설정되지 않았습니다.' });
    }

    // Google Gemini 1.5 Flash 호출
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: promptText }]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error?.message || 'Gemini API 호출 중 오류가 발생했습니다.'
      });
    }

    // 신탁 응답 추출
    const oracleResult =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      '신탁의 기운을 해석하는 중 응답을 얻지 못했습니다.';

    return res.status(200).json({ text: oracleResult });
  } catch (error) {
    return res.status(500).json({ error: error.message || '서버 내부 오류가 발생했습니다.' });
  }
}
