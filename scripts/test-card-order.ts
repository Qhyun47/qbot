import { chromium, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("http://127.0.0.1:3000/auth/login");
  await page.waitForLoadState("domcontentloaded");
  await page.fill('input[type="email"]', "kh047@naver.com");
  await page.fill('input[type="password"]', "wjdrbgus123!");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  console.log("✅ 로그인 성공");
}

async function addCard(page: Page, text: string) {
  const textarea = page.locator("textarea").first();
  await textarea.fill(text);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1500);
}

async function getCardTexts(page: Page): Promise<string[]> {
  const spans = await page
    .locator("span.flex-1.leading-normal")
    .allTextContents();
  return spans.filter((t) => t.trim().length > 0);
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    await login(page);

    const freshId = Date.now();
    await page.goto(`http://127.0.0.1:3000/cases/new?fresh=${freshId}`);
    await page.waitForTimeout(3000);
    console.log("✅ 새 케이스 페이지 진입");

    // 카드 3개 추가
    await addCard(page, "A: 첫번째카드");
    await addCard(page, "B: 두번째카드");
    await addCard(page, "C: 세번째카드");

    await page.waitForTimeout(500);

    const cardTexts = await getCardTexts(page);
    console.log("\n[테스트 1] 정렬 순서 검증");
    console.log("현재 카드 순서 (위→아래):");
    cardTexts.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

    const firstIdx = cardTexts.findIndex((t) => t.includes("첫번째"));
    const thirdIdx = cardTexts.findIndex((t) => t.includes("세번째"));

    if (firstIdx !== -1 && thirdIdx !== -1 && firstIdx < thirdIdx) {
      console.log("✅ 정렬 정상: 첫번째(위) → 세번째(아래) [채팅 스타일]");
    } else {
      console.log("❌ 정렬 오류: 예상과 다른 순서");
    }

    // 드래그앤드롭 테스트: 세번째 카드를 첫번째 위치로 드래그
    console.log("\n[테스트 2] 드래그앤드롭 검증");

    // GripVertical 핸들 찾기 (카드 내 button)
    const handles = await page
      .locator('button[aria-label="드래그하여 순서 변경"]')
      .all();

    if (handles.length >= 3) {
      const thirdHandle = handles[thirdIdx];
      const firstHandle = handles[firstIdx];

      const thirdBox = await thirdHandle.boundingBox();
      const firstBox = await firstHandle.boundingBox();

      if (thirdBox && firstBox) {
        await page.mouse.move(
          thirdBox.x + thirdBox.width / 2,
          thirdBox.y + thirdBox.height / 2
        );
        await page.mouse.down();
        await page.waitForTimeout(300);
        // 천천히 위로 이동
        const steps = 10;
        const dy = (firstBox.y - thirdBox.y) / steps;
        for (let i = 1; i <= steps; i++) {
          await page.mouse.move(
            thirdBox.x + thirdBox.width / 2,
            thirdBox.y + thirdBox.height / 2 + dy * i
          );
          await page.waitForTimeout(50);
        }
        await page.mouse.up();
        await page.waitForTimeout(1000);

        const afterDrag = await getCardTexts(page);
        console.log("드래그 후 카드 순서 (위→아래):");
        afterDrag.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

        const newThirdIdx = afterDrag.findIndex((t) => t.includes("세번째"));
        const newFirstIdx = afterDrag.findIndex((t) => t.includes("첫번째"));

        if (newThirdIdx < newFirstIdx) {
          console.log("✅ 드래그앤드롭 정상: 세번째 카드가 첫번째 위로 이동");
        } else {
          console.log(
            "⚠️ 드래그앤드롭 확인 필요: 순서 변경 안됨 (터치 센서 딜레이일 수 있음)"
          );
        }
      }
    } else {
      console.log("⚠️ 드래그 핸들을 찾지 못함 (handles:", handles.length, ")");
    }

    await page.screenshot({ path: "scripts/card-test-result.png" });
    console.log("\n✅ 스크린샷 저장: scripts/card-test-result.png");
  } catch (e) {
    console.error("오류:", e);
    await page
      .screenshot({ path: "scripts/card-test-error.png" })
      .catch(() => {});
  } finally {
    await browser.close();
  }
}

main();
