import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { eventType, data } = body;

    console.log("포트원 웹훅 수신 성공:", eventType);

    if (eventType === "Transaction.Paid" || data?.status === "PAID") {
      const paymentId = data.paymentId;
      const orderId = data.orderId;
      console.log(`[결제 완료 보고] 주문번호: ${orderId}, 결제번호: ${paymentId}`);
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("웹훅 처리 중 오류 발생:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
