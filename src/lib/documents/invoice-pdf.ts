import PDFDocument from "pdfkit";

type InvoicePdf = {
  number: string;
  agency: string;
  period: string;
  status: string;
  total: number;
  terms?: string;
  notes?: string | null;
  rows: string[][];
};

const teal = "#11736e";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function invoiceMoney(value: number) {
  return money.format(value);
}

export function createInvoicePdf(invoice: InvoicePdf) {
  const pdf = new PDFDocument({ size: "A4", margin: 42 });
  const chunks: Buffer[] = [];
  const completed = new Promise<Buffer>((resolve, reject) => {
    pdf.on("data", (chunk) => chunks.push(chunk));
    pdf.on("end", () => resolve(Buffer.concat(chunks)));
    pdf.on("error", reject);
  });
  const tableWidth = pdf.page.width - 84;
  const positions = [56, 198, 283, 411, 467, 500];
  const widths = [134, 77, 120, 48, 29, 39];

  function drawHeader() {
    pdf.rect(0, 0, pdf.page.width, 113).fill(teal);
    pdf.font("Helvetica-Bold").fontSize(22).fillColor("white").text("INVOICE", 56, 36);
    pdf.fontSize(12).text(invoice.number, 56, 74);
  }

  function tableHeader(y: number) {
    pdf.rect(42, y, tableWidth, 28).fill("#eff3f9");
    pdf.font("Helvetica-Bold").fontSize(9).fillColor("#425269");
    ["PATIENT", "DATE", "THERAPIST", "TYPE", "VISIT", "RATE"].forEach((label, i) =>
      pdf.text(label, positions[i], y + 11, { width: widths[i], lineBreak: false }));
    return y + 28;
  }

  drawHeader();
  pdf.font("Helvetica-Bold").fontSize(11).fillColor("#111111");
  pdf.text("Billed To:", 56, 146);
  pdf.text("Period:", 368, 146);
  pdf.text("Status:", 368, 197);
  pdf.font("Helvetica").text(invoice.agency, 56, 169, { width: 296 });
  const agencyEnd = pdf.y;
  pdf.text(invoice.period, 368, 169);
  pdf.text(invoice.status, 368, 220);

  let y = tableHeader(Math.max(269, agencyEnd + 20));
  for (const [index, row] of invoice.rows.entries()) {
    pdf.font("Helvetica").fontSize(9);
    const height = Math.max(28, ...row.map((value, i) => pdf.heightOfString(value, { width: widths[i] }) + 18));
    if (y + height > pdf.page.height - 54) {
      pdf.addPage();
      drawHeader();
      y = tableHeader(145);
      pdf.font("Helvetica").fontSize(9);
    }
    pdf.rect(42, y, tableWidth, height).fill(index % 2 ? "#ffffff" : "#f5f8fa");
    pdf.fillColor("#111111");
    row.forEach((value, i) =>
      pdf.text(value, positions[i], y + 10, { width: widths[i], align: i === 5 ? "right" : "left" }));
    y += height;
  }

  if (y + 60 > pdf.page.height - 42) {
    pdf.addPage();
    drawHeader();
    y = 120;
  }
  y += 26;
  pdf.rect(42, y, tableWidth, 34).fill(teal);
  pdf.font("Helvetica-Bold").fontSize(11).fillColor("white").text("TOTAL", 56, y + 12);
  pdf.text(invoiceMoney(invoice.total), 360, y + 12, { width: 179, align: "right" });

  pdf.font("Helvetica").fontSize(10).fillColor("#111111");
  let footerY = y + 48;
  for (const [label, value] of [["Invoice Terms", invoice.terms], ["Notes", invoice.notes]]) {
    if (!value) continue;
    pdf.text(`${label}: ${value}`, 56, footerY, { width: tableWidth - 28 });
    footerY = pdf.y + 8;
  }

  pdf.end();
  return completed;
}
