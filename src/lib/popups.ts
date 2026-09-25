"use client";

/**
 * Pop-ups for returning visitors take turns: at most one per visit, so people
 * read it instead of closing everything.
 */
const KEY = "rehearse:popup";

export function popupShownThisVisit(): boolean {
  try {
    return sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markPopupShown() {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    // Storage blocked: another pop-up may show on the next page, which is harmless.
  }
}

/** True when another dialog is already open, or a pop-up already had its turn. */
export function popupBlocked(): boolean {
  return popupShownThisVisit() || !!document.querySelector("dialog[open]");
}

/**
 * Asks the browser not to clear this site's data on its own (Safari clears it after
 * about a week away otherwise). Firefox asks the user first, so there it only runs
 * after they tap a button.
 */
export async function askToKeepData(fromTap = false) {
  try {
    const storage = navigator.storage;
    if (!storage?.persist || (await storage.persisted())) return;
    if (!fromTap && /firefox/i.test(navigator.userAgent)) return;
    await storage.persist();
  } catch {
    // Not supported: nothing to do.
  }
}
