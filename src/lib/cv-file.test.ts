import { deflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { cvFileKind, docxXmlText, tidyCvText, unzipEntry } from "./cv-file";

/** A minimal zip with one entry per file, deflated or stored. */
function zip(files: Record<string, string>, deflate = true): Uint8Array {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const nameBytes = enc.encode(name);
    const raw = enc.encode(text);
    const body = deflate ? new Uint8Array(deflateRawSync(raw)) : raw;
    const local = new Uint8Array(30 + nameBytes.length + body.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(8, deflate ? 8 : 0, true);
    lv.setUint32(18, body.length, true);
    lv.setUint32(22, raw.length, true);
    lv.setUint16(26, nameBytes.length, true);
    local.set(nameBytes, 30);
    local.set(body, 30 + nameBytes.length);
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(10, deflate ? 8 : 0, true);
    cv.setUint32(20, body.length, true);
    cv.setUint32(24, raw.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    locals.push(local);
    centrals.push(central);
    offset += local.length;
  }
  const dirSize = centrals.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(8, centrals.length, true);
  ev.setUint16(10, centrals.length, true);
  ev.setUint32(12, dirSize, true);
  ev.setUint32(16, offset, true);
  const out = new Uint8Array(offset + dirSize + 22);
  let at = 0;
  for (const part of [...locals, ...centrals, end]) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

const DOC = `<?xml version="1.0"?><w:document><w:body>
<w:p><w:r><w:t>Jo Bloggs</w:t></w:r></w:p>
<w:p><w:pPr/><w:r><w:t xml:space="preserve">Sales Assistant, </w:t></w:r><w:r><w:t>Tesco</w:t></w:r><w:r><w:tab/><w:t>2022 &amp; 2023</w:t></w:r></w:p>
<w:p/>
<w:p><w:r><w:t>Trained 4 new starters</w:t><w:br/><w:t>Ran the tills on Saturdays</w:t></w:r></w:p>
</w:body></w:document>`;

describe("cvFileKind", () => {
  it("tells file types apart by name and type", () => {
    expect(cvFileKind("CV.PDF")).toBe("pdf");
    expect(cvFileKind("cv", "application/pdf")).toBe("pdf");
    expect(cvFileKind("my cv.docx")).toBe("docx");
    expect(cvFileKind("old.doc")).toBe("doc");
    expect(cvFileKind("cv.txt")).toBe("text");
    expect(cvFileKind("photo.jpg", "image/jpeg")).toBe("other");
  });
});

describe("docxXmlText", () => {
  it("keeps paragraphs, tabs, breaks and entities", () => {
    expect(docxXmlText(DOC)).toBe("Jo Bloggs\nSales Assistant, Tesco 2022 & 2023\n\nTrained 4 new starters\nRan the tills on Saturdays");
  });
});

describe("unzipEntry", () => {
  it("finds a deflated entry", async () => {
    const file = zip({ "[Content_Types].xml": "<x/>", "word/document.xml": DOC });
    const out = await unzipEntry(file, "word/document.xml");
    expect(new TextDecoder().decode(out!)).toBe(DOC);
  });

  it("finds a stored entry", async () => {
    const out = await unzipEntry(zip({ "word/document.xml": "hello" }, false), "word/document.xml");
    expect(new TextDecoder().decode(out!)).toBe("hello");
  });

  it("returns null for a missing entry or a file that isn't a zip", async () => {
    expect(await unzipEntry(zip({ "a.txt": "x" }), "word/document.xml")).toBeNull();
    expect(await unzipEntry(new TextEncoder().encode("not a zip at all, just text"), "word/document.xml")).toBeNull();
  });
});

describe("tidyCvText", () => {
  it("squashes spaces and blank lines", () => {
    expect(tidyCvText("Jo  Bloggs \r\n\r\n\r\n\r\n  Skills\t:  tills ")).toBe("Jo Bloggs\n\nSkills : tills");
  });
});
