/** Removes contact details from a CV before it leaves the device. Names can't be found reliably, so the page asks people to remove theirs. */
export function scrubCv(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/https?:\/\/\S+|www\.\S+|linkedin\.com\/\S+/gi, "[link]")
    // Phone numbers have 10 or more digits; date ranges like "2019 - 2021" have 8 and are kept.
    .replace(/\+?\d[\d\s().-]{8,}\d/g, (m) => (m.replace(/\D/g, "").length >= 10 ? "[phone]" : m))
    .replace(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi, "[postcode]")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export const MAX_CV = 8000;
export const MAX_ADVERT = 6000;
