export default async function handler(req, res) {
  // 1. 브라우저 주소창이나 헬스체크용 GET 요청 처리
  if (req.method === 'GET') {
    return res.status(200).json({ 
      status: "Webhook endpoint is active", 
      platform: "Nocturne Compass V1" 
    });
  }

  // 2. 포트원 서버에서 쏘아 올리는 POST 웹훅 신호 처리
  if (req.method === 'POST') {
    try {
      const { imp_uid, merchant_uid, status } = req.body;
      
      console.log(`[포트원 V1 웹훅 수신] 주문번호(merchant_uid): ${merchant_uid}, 결제번호(imp_uid): ${imp_uid}, 상태(status): ${status}`);

      // 결제 상태가 정상 완료("paid")된 경우
      if (status === "paid") {
        console.log(`[결제 승인 완료] 주문번호 ${merchant_uid}의 결제가 성공적으로 확인되었습니다.`);
        
        // -----------------------------------------------------------------
        // [TODO] 실제 비즈니스 로직 연동 영역
        // 1. DB에서 merchant_uid(주문번호)를 찾아 결제 상태를 'paid'로 변경
        // 2. 타로 쿼터 충전 또는 이용 권한 부여
        // -----------------------------------------------------------------
      } 
      // 결제가 취소되었거나 실패한 경우
      else if (status === "cancelled") {
        console.log(`[결제 취소 감지] 주문번호 ${merchant_uid}의 결제가 취소되었습니다.`);
      }

      // 포트원 서버로 정상 수신(200 OK) 응답 반환
      return res.status(200).json({ success: true, message: "Webhook processed successfully" });

    } catch (error) {
      console.error("웹훅 처리 중 치명적 오류 발생:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // POST나 GET 외의 잘못된 접근 차단
  return res.status(405).setHeader('Allow', ['GET', 'POST']).end('Method Not Allowed');
}
