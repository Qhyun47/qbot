import { chromium } from "@playwright/test";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
});
const page = await context.newPage();

try {
  // Login
  await page.goto("http://localhost:3000/auth/login");
  await page.waitForLoadState("networkidle");
  await page.fill('input[type="email"]', "kh047@naver.com");
  await page.fill('input[type="password"]', "wjdrbgus123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  console.log("✅ 로그인 성공");

  // Navigate to new case
  const freshId = Date.now();
  await page.goto(`http://localhost:3000/cases/new?fresh=${freshId}`);
  await page.waitForTimeout(3000);
  console.log("✅ 새 케이스 페이지 진입");

  // Find and use input bar
  const textarea = page.locator("textarea").first();
  await textarea.waitFor({ timeout: 5000 });

  const cards = ["첫번째카드", "두번째카드", "세번째카드"];
  for (const text of cards) {
    await textarea.fill(text);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);
    console.log(`  카드 추가: ${text}`);
  }

  await page.waitForTimeout(1000);

  // Screenshot
  await page.screenshot({
    path: "scripts/card-order-test.png",
    fullPage: false,
  });
  console.log("✅ 스크린샷 저장: scripts/card-order-test.png");

  // Get card texts
  const cardSpans = await page.locator("span.flex-1").allTextContents();
  const cardTexts = cardSpans.filter((t) => t.includes("카드"));
  console.log("\n현재 카드 순서 (위 → 아래):");
  cardTexts.forEach((text, i) => console.log(`  ${i + 1}. ${text}`));

  if (cardTexts.length >= 3) {
    const firstIdx = cardTexts.findIndex((t) => t.includes("첫번째"));
    const lastIdx = cardTexts.findIndex((t) => t.includes("세번째"));
    if (firstIdx < lastIdx) {
      console.log(
        "\n✅ 정렬 정상: 첫번째 카드(위) → 세번째 카드(아래) [채팅 스타일]"
      );
    } else {
      console.log("\n❌ 정렬 오류: 첫번째 카드가 아래에 있음 (역순)");
    }
  }
} catch (e) {
  console.error("오류:", e.message);
  await page.screenshot({ path: "scripts/error-screenshot.png" });
} finally {
  await browser.close();
}
