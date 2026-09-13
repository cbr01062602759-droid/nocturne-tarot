const https = require('https');

module.exports = async function handler(req, res) {
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
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is missing' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = { question: body };
      }
    }

    const q = body?.question || '내담자의 고민';
    const c1 = body?.card1 || '기저 카드';
    const c2 = body?.card2 || '행동 카드';
    const c3 = body?.card3 || '결과 카드';
    const user = body?.userName || '내담자';

    const promptText = `당신은 깊은 통찰력을 지닌 신비로운 마스터 타로 리더입니다.
내담자 이름: ${user}
내담자의 고민: "${q}"
뽑힌 3장의 타로 카드:
1. 기저: ${c1}
2. 행동: ${c2}
3. 미래: ${c3}

위 3장의 카드 상징과 내담자의 상황을 융합하여 마음을 울리는 깊이 있는 최종 신탁 판결문을 작성해 주세요.`;

    const payload = JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const apiResult = await new Promise((resolve, reject) => {
      const apiReq = https.request(options, (apiRes) => {
        let resData = '';
        apiRes.on('data', (chunk) => { resData += chunk; });
        apiRes.on('end', () => {
          try {
            resolve({ statusCode: apiRes.statusCode, data: JSON.parse(resData) });
          } catch (err) {
            reject(new Error('JSON parse error: ' + resData));
          }
        });
      });

      apiReq.on('error', (e) => reject(e));
      apiReq.write(payload);
      apiReq.end();
    });

    if (apiResult.statusCode !== 200) {
      return res.status(apiResult.statusCode).json({
        error: 'Gemini API Error',
        details: apiResult.data.error?.message || JSON.stringify(apiResult.data)
      });
    }

    const reply = apiResult.data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return res.status(200).json({
      verdictNarrative: reply,
      synthesis: reply,
      oracle: reply,
      text: reply,
      verdict: reply
    });

  } catch (err) {
    return res.status(500).json({
      error: 'Execution Error',
      message: err.message
    });
  }
};
