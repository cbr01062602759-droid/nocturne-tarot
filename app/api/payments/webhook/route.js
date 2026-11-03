import { NextResponse } from 'next/server';

// 브라우저나 포트원이 GET으로 찔러볼 때 404를 막기 위한 응답
export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint is active" }, { status: 200 });
}

export async function POST(request) {
  try {
    const body = await request.json();
    // 💡 포트원 V1 웹훅 표준 파라미터 추출
    const { imp_uid, merchant_uid, status } = body;
    
    console.log(`[포트원 V1 웹훅 수신] 주문번호: ${merchant_uid}, 결제번호: ${imp_uid}, 상태: ${status}`);

    // 결제 완료 상태 확인 (V1 기준 "paid")
    if (status === "paid") {
      console.log(`[결제 완료 승인] 주문번호 ${merchant_uid}에 대한 처리 로직 실행`);
      // TODO: 여기에 DB 업데이트 등 비즈니스 로직 작성
    }

    // 포트원 서버로 정상 수신(200 OK) 응답 반환
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("V1 웹훅 처리 중 오류 발생:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
