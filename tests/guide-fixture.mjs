// Existing gameplay regressions represent an experienced player. Fresh teaching is
// exercised separately in field-guide.mjs, including persistence and blocked input.
export const learnedLessons = ['b-load','b-dock','b-combine','b-release','b-relay','b-plan','b-order','b-stock','b-recovery','a-travel','a-dial','a-linked','a-return'];
export async function experiencedPlayer(page) {
  await page.addInitScript(ids=>localStorage.setItem('wayward-field-guide-v1',JSON.stringify(ids)),learnedLessons);
}
export async function dismissTeaching(page) {
  while(await page.locator('.field-guide[open] [data-guide="skip"]').count())await page.locator('.field-guide[open] [data-guide="skip"]').click();
}
