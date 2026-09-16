import PDFDocument from "pdfkit";

type PdfField = { label: string; value: unknown };

export async function createSimplePdf(title: string, fields: PdfField[]) {
  const document = new PDFDocument({ margin: 48, size: "LETTER" });
  const chunks: Buffer[] = [];
  document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });

  document.fontSize(20).fillColor("#0f766e").text("TherapyDocs");
  document.moveDown(0.3).fontSize(16).fillColor("#0f172a").text(title);
  document.moveDown();
  for (const field of fields) {
    document.fontSize(9).fillColor("#64748b").text(field.label.toUpperCase());
    document.fontSize(11).fillColor("#0f172a").text(String(field.value ?? "—"));
    document.moveDown(0.7);
  }
  document.end();
  return completed;
}
