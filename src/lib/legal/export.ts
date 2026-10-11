import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportDocx(title: string, body: string, disclaimer: string | null, filename: string) {
  const doc = new Document({
    sections: [{
      children: [
        ...(disclaimer ? [new Paragraph({ children: [new TextRun({ text: disclaimer, italics: true, size: 18, color: "993333" })] })] : []),
        new Paragraph({ text: title, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
        ...body.split("\n").map((line) => new Paragraph({ children: [new TextRun(line)], spacing: { after: 120 } })),
      ],
    }],
  });
  download(await Packer.toBlob(doc), `${filename}.docx`);
}
