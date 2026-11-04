export default async function handler(req, res) {
  // 브라우저 주소창에 직접 쳤을 때 정상 작동 여부를 확인하기 위한 GET 응답
  if (req.method === 'GET') {
    return res.status(200).json({ status: "Webhook endpoint is active" });
  }

  // 포트원 서버에서 쏘아 올리는 POST 요청 처리
  if (req.method === 'POST') {
    try {
      const { imp_uid, merchant_uid, status } = req.body;
      
      console.log(`[포트원 V1 웹훅 수신 성공] 주문번호: ${merchant_uid}, 결제번호: ${imp_uid}, 상태: ${status}`);

      // 결제 완료 상태 확인 (V1 기준 "paid")
      if (status === "paid") {
        console.log(`[결제 완료 승인] 주문번호 ${merchant_uid} 후속 처리 로직 실행`);
        // TODO: DB 업데이트 등 비즈니스 로직 작성
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("웹훅 처리 중 오류 발생:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).end(); // 허용되지 않은 메서드 차단
}
