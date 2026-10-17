import PDFDocument from "pdfkit";

export type PdfField = {
  label: string;
  value?: unknown;
  section?: boolean;
  subheading?: boolean;
  imageDataUrl?: string | null;
};

type VisitPdfOptions = {
  companyName?: string | null;
  subtitle?: string | null;
  patientName: string;
  generatedDate?: string;
  logoPath?: string | null;
};

const visitSectionColors: Record<string, string> = {
  intake: "#3498db",
  "patient information": "#3498db",
  "visit information": "#3498db",
  vitals: "#16a085",
  subjective: "#2980b9",
  objective: "#8e44ad",
  "activities of daily living": "#d68910",
  mobility: "#2471a3",
  assessment: "#ca6f1e",
  "goals and plan": "#17a589",
  "discharge plan and education": "#27ae60",
  discharge: "#2ecc71",
  signatures: "#8d9695",
  "additional documentation": "#607d8b",
};

export async function createVisitNotePdf(title: string, fields: PdfField[], options: VisitPdfOptions) {
  const document = new PDFDocument({ margin: 42, size: "A4", bufferPages: true });
  const chunks: Buffer[] = [];
  document.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });

  const sectionLeft = 42;
  const sectionWidth = document.page.width - 84;
  const contentLeft = 56;
  const contentWidth = document.page.width - 112;

  if (options.logoPath) {
    try {
      document.image(options.logoPath, sectionLeft, 5, { fit: [52, 52] });
    } catch {
      // A missing/invalid optional logo must not block the clinical PDF.
    }
  }
  const companyX = options.logoPath ? 102 : contentLeft;
  document.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(options.companyName || "TherapyDocs", companyX, 25);
  document.font("Helvetica").fontSize(14).fillColor("#111827").text(options.subtitle || title, companyX, 60);
  document.moveTo(0, 85).lineTo(document.page.width, 85).lineWidth(0.5).strokeColor("#b8b8b8").stroke();
  document.font("Helvetica-Bold").fontSize(19).fillColor("#111827").text("Visit Note", contentLeft, 86);
  document.y = 110;

  for (const field of fields) {
    if (field.section) {
      if (document.y > document.page.height - 95) document.addPage();
      const key = field.label.toLowerCase();
      const color = visitSectionColors[key] || "#3498db";
      const sectionY = document.y;
      document.rect(sectionLeft, sectionY, sectionWidth, 23).fill(color);
      const sectionLabel = key === "signatures" ? "SIGNATURE" : field.label.toUpperCase();
      document.font("Helvetica-Bold").fontSize(10.5).fillColor("#ffffff").text(sectionLabel, contentLeft, sectionY + 6);
      document.y = sectionY + 28;
      continue;
    }

    if (field.subheading) {
      const headingY = document.y;
      document.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(field.label, contentLeft, headingY);
      document.y = headingY + 17;
      continue;
    }

    if (document.y > document.page.height - 75) document.addPage();
    const rowY = document.y;
    document.font("Helvetica-Bold").fontSize(9).fillColor("#111827").text(`${field.label}:`, contentLeft, rowY, { width: 128 });
    const valueX = contentLeft + 128;
    if (field.imageDataUrl?.startsWith("data:image/")) {
      try {
        const base64 = field.imageDataUrl.split(",", 2)[1];
        if (base64) document.image(Buffer.from(base64, "base64"), valueX, rowY, { fit: [220, 75] });
        document.y = rowY + 80;
      } catch {
        document.font("Helvetica").fontSize(9).fillColor("#111827").text("Signature captured", valueX, rowY);
        document.y = rowY + 16;
      }
    } else {
      const value = String(field.value ?? "N/A");
      document.font("Helvetica").fontSize(9);
      const isDiagnoses = field.label.toLowerCase() === "diagnoses";
      const textX = isDiagnoses ? contentLeft + 5 : valueX;
      const textY = isDiagnoses ? rowY + 13 : rowY;
      const textWidth = isDiagnoses ? contentWidth - 5 : contentWidth - 138;
      const lineGap = isDiagnoses ? 2.5 : 1.5;
      const height = document.heightOfString(value, { width: textWidth, lineGap });
      document.fillColor("#111827").text(value, textX, textY, { width: textWidth, lineGap });
      document.y = textY + Math.max(14, height + 2);
    }
  }

  const range = document.bufferedPageRange();
  for (let pageIndex = range.start; pageIndex < range.start + range.count; pageIndex += 1) {
    document.switchToPage(pageIndex);
    const originalBottomMargin = document.page.margins.bottom;
    document.page.margins.bottom = 0;
    const footerY = document.page.height - 29;
    document.font("Helvetica").fontSize(7).fillColor("#777777");
    document.text(`Generated: ${options.generatedDate || new Date().toLocaleDateString("en-US")}`, contentLeft, footerY, { lineBreak: false });
    document.text(`Page ${pageIndex - range.start + 1} of ${range.count}`, 0, footerY, { align: "center", width: document.page.width, lineBreak: false });
    document.text(`Patient: ${options.patientName}`, sectionLeft, footerY, { align: "right", width: sectionWidth, lineBreak: false });
    document.page.margins.bottom = originalBottomMargin;
  }

  document.end();
  return completed;
}

export async function createSimplePdf(title: string, fields: PdfField[]) {
  const document = new PDFDocument({ margin: 48, size: "LETTER", bufferPages: true });
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
    if (field.section) {
      document.moveDown(0.4);
      document.fontSize(13).fillColor("#0f766e").text(field.label);
      document.moveTo(document.x, document.y + 2).lineTo(564, document.y + 2).strokeColor("#99f6e4").stroke();
      document.moveDown(0.7);
      continue;
    }
    document.fontSize(9).fillColor("#64748b").text(field.label.toUpperCase());
    if (field.imageDataUrl?.startsWith("data:image/")) {
      try {
        const base64 = field.imageDataUrl.split(",", 2)[1];
        if (base64) {
          document.image(Buffer.from(base64, "base64"), { fit: [260, 100] });
        }
      } catch {
        document.fontSize(11).fillColor("#0f172a").text("Signature captured");
      }
    } else {
      document.fontSize(11).fillColor("#0f172a").text(String(field.value ?? "—"));
    }
    document.moveDown(0.7);
  }
  const pageRange = document.bufferedPageRange();
  for (let pageIndex = pageRange.start; pageIndex < pageRange.start + pageRange.count; pageIndex += 1) {
    document.switchToPage(pageIndex);
    const originalBottomMargin = document.page.margins.bottom;
    document.page.margins.bottom = 0;
    document
      .fontSize(8)
      .fillColor("#94a3b8")
      .text(
        `Page ${pageIndex - pageRange.start + 1} of ${pageRange.count}`,
        48,
        document.page.height - 32,
        { align: "right", width: document.page.width - 96, lineBreak: false },
      );
    document.page.margins.bottom = originalBottomMargin;
  }
  document.end();
  return completed;
}
