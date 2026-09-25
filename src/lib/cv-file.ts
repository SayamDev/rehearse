/**
 * Reads a CV file on the device: PDF, Word (.docx) or plain text. The file itself is never
 * uploaded; only the text, with contact details removed, goes to the CV helper.
 */

export const MAX_CV_FILE_BYTES = 10_000_000;
export const CV_FILE_TYPES = ".pdf,.docx,.txt,.md,.rtf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain";

/** An error with a message fit to show the user. */
export class CvFileError extends Error {}

export type CvFileKind = "pdf" | "docx" | "text" | "doc" | "other";

export function cvFileKind(name: string, type = ""): CvFileKind {
  const ext = name.toLowerCase().split(".").pop() ?? "";
  if (ext === "pdf" || type === "application/pdf") return "pdf";
  if (ext === "docx" || type.includes("wordprocessingml")) return "docx";
  if (ext === "doc" || type === "application/msword") return "doc";
  if (["txt", "md", "text"].includes(ext) || type.startsWith("text/")) return "text";
  return "other";
}

/* ---------------- Word ---------------- */

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(text: string): string {
  return text.replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (m, e: string) => {
    if (e[0] === "#") {
      const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

/** The text of a Word document.xml: one line per paragraph, tabs and breaks kept. */
export function docxXmlText(xml: string): string {
  const paragraphs = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>|<w:p\/>/g) ?? [];
  return paragraphs
    .map((p) =>
      (p.match(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>|<w:tab\/>|<w:br\/>|<w:br\s[^>]*\/>/g) ?? [])
        .map((run) => (run.startsWith("<w:tab") ? " " : run.startsWith("<w:br") ? "\n" : decode(run.replace(/<[^>]+>/g, ""))))
        .join("")
        .trim(),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Pulls one file out of a zip (a .docx is a zip), using the browser's own decompression. */
export async function unzipEntry(zip: Uint8Array, wanted: string): Promise<Uint8Array | null> {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  // The end-of-central-directory record sits in the last 64 KB.
  let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65_557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) return null;
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  const names = new TextDecoder();
  for (let n = 0; n < count && at + 46 <= zip.length; n++) {
    if (view.getUint32(at, true) !== 0x02014b50) return null;
    const method = view.getUint16(at + 10, true);
    const size = view.getUint32(at + 20, true);
    const nameLength = view.getUint16(at + 28, true);
    const extra = view.getUint16(at + 30, true);
    const comment = view.getUint16(at + 32, true);
    const local = view.getUint32(at + 42, true);
    const name = names.decode(zip.subarray(at + 46, at + 46 + nameLength));
    if (name === wanted) {
      const start = local + 30 + view.getUint16(local + 26, true) + view.getUint16(local + 28, true);
      const body = zip.subarray(start, start + size);
      if (method === 0) return body;
      if (method === 8) return inflateRaw(body);
      return null;
    }
    at += 46 + nameLength + extra + comment;
  }
  return null;
}

async function docxText(bytes: Uint8Array): Promise<string> {
  const xml = await unzipEntry(bytes, "word/document.xml").catch(() => null);
  if (!xml) throw new CvFileError("That Word file couldn't be opened. Try saving it as a PDF, or paste the text instead.");
  return docxXmlText(new TextDecoder().decode(xml));
}

/* ---------------- PDF ---------------- */

type TextItem = { str?: string; hasEOL?: boolean };

/** The PDF reader is big, so it only loads when someone picks a PDF. */
async function pdfText(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: bytes }).promise;
  } catch (err) {
    if (err instanceof Error && err.name === "PasswordException") throw new CvFileError("That PDF has a password. Open it, save a copy without one, or paste the text instead.");
    throw new CvFileError("That PDF couldn't be opened. Try another copy, or paste the text instead.");
  }
  const pages: string[] = [];
  for (let p = 1; p <= Math.min(doc.numPages, 10); p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    pages.push((content.items as TextItem[]).map((i) => (i.str ?? "") + (i.hasEOL ? "\n" : "")).join(""));
  }
  void doc.destroy();
  return pages.join("\n");
}

/* ---------------- Any file ---------------- */

/** Tidies extracted text: no runs of spaces, no piles of blank lines. */
export function tidyCvText(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t ]+/g, " ")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Reads a CV file into text, or throws a CvFileError with a friendly message. */
export async function readCvFile(file: File): Promise<string> {
  if (file.size > MAX_CV_FILE_BYTES) throw new CvFileError("That file is too big. CVs are usually under 1 MB. Try a PDF or Word copy.");
  const kind = cvFileKind(file.name, file.type);
  if (kind === "doc") throw new CvFileError("Old Word files (.doc) can't be read here. Save it as .docx or PDF, or paste the text instead.");
  if (kind === "other") throw new CvFileError("Pick a PDF, a Word file (.docx) or a text file.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const raw = kind === "pdf" ? await pdfText(bytes) : kind === "docx" ? await docxText(bytes) : new TextDecoder().decode(bytes);
  const text = tidyCvText(raw);
  if (text.replace(/\s/g, "").length < 40) {
    throw new CvFileError(
      kind === "pdf"
        ? "This PDF looks like a picture of a CV, so there's no text to read. Paste the text instead, or upload the Word version."
        : "That file doesn't have enough text in it. Paste your CV instead.",
    );
  }
  return text;
}
