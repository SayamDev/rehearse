import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/** Automated accessibility checks (WCAG 2.2 AA) on the main pages, in light and dark mode. */
const PAGES = [
  "/",
  "/practice/new",
  "/practice/warmup",
  "/prepare",
  "/prepare/cv",
  "/prepare/advert",
  "/prepare/answer",
  "/prepare/tricky",
  "/prepare/tricky/gap",
  "/prepare/offer",
  "/prepare/today",
  "/prepare/packs",
  "/prepare/packs/care",
  "/prepare/intro",
  "/prepare/questions",
  "/prepare/body",
  "/calm",
  "/coach",
  "/remember",
  "/remember/stories",
  "/remember/company",
  "/remember/numbers",
  "/remember/cards",
  "/remember/listen",
  "/remember/quiz",
  "/archive",
  "/me",
  "/privacy",
  "/offline",
];

for (const scheme of ["light", "dark"] as const) {
  for (const path of PAGES) {
    test(`${path} has no accessibility violations (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} (${v.nodes[0]?.target.join(" ")}) ${v.nodes[0]?.failureSummary?.split("\n")[1] ?? ""}`);
      expect(summary).toEqual([]);
    });
  }
}
