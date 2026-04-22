const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "tadybear047@gmail.com";
const APP_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function sendAiRequestNotification(
  name: string,
  requestedAt: Date
): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn(
      "[sendAiRequestNotification] RESEND_API_KEY 미설정 — 이메일 알림 건너뜀"
    );
    return;
  }

  const formattedDate = requestedAt.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const adminUsersUrl = `${APP_URL}/admin/users`;

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">새로운 AI 사용 신청이 접수되었습니다</h2>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600; width: 100px;">신청자</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">신청 시각</td>
          <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${formattedDate}</td>
        </tr>
      </table>
      <a href="${adminUsersUrl}"
        style="display: inline-block; padding: 10px 20px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-size: 14px;">
        사용자 관리 페이지에서 처리하기
      </a>
    </div>
  `;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "규봇 <noreply@qbot.app>",
        to: [ADMIN_EMAIL],
        subject: `[규봇] AI 사용 신청: ${name}`,
        html,
      }),
    });
  } catch (e) {
    console.error("[sendAiRequestNotification] 이메일 발송 실패:", e);
  }
}
