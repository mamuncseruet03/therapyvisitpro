import PDFDocument from "pdfkit";

export type PdfField = {
  label: string;
  value?: unknown;
  section?: boolean;
  subheading?: boolean;
  fullWidth?: boolean;
  layout?: "goal" | "complexity" | "adl-grid" | "rom-grid" | "strength-grid" | "other-findings" | "discharge-plan" | "physician-approval" | "assessment-summary" | "standardized-tests";
  data?: unknown;
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
  subjective: "#9b59b6",
  objective: "#f57c00",
  "range of motion": "#2563eb",
  "activities of daily living": "#29a8df",
  mobility: "#08b7c7",
  assessment: "#2ecc71",
  "goals and plan": "#2e86c1",
  "therapy orders and frequency": "#0f766e",
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
  const sectionGap = 12;
  const subsectionGap = 8;

  const isAtPageTop = () => document.y <= document.page.margins.top + 4;

  const drawHeader = (includeVisitTitle: boolean) => {
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
    if (includeVisitTitle) {
      document.font("Helvetica-Bold").fontSize(19).fillColor("#111827").text("Visit Note", contentLeft, 86);
      document.y = 110;
    } else {
      document.y = 99;
    }
  };

  drawHeader(true);
  let physicianApprovalPageOpen = false;

  for (const field of fields) {
    if (field.section) {
      const key = field.label.toLowerCase();
      const dedicatedPage = key === "goals and plan" || key === "signatures";
      const needsDedicatedPage = dedicatedPage && !(key === "signatures" && physicianApprovalPageOpen);
      if ((needsDedicatedPage && document.y > 115) || document.y > document.page.height - 95) {
        document.addPage();
      } else if (!isAtPageTop() && document.y > 115) {
        document.y += sectionGap;
      }
      if (document.y <= document.page.margins.top + 2 && key === "signatures") drawHeader(false);
      const color = visitSectionColors[key] || "#3498db";
      const sectionY = document.y;
      document.rect(sectionLeft, sectionY, sectionWidth, 23).fill(color);
      const sectionLabel = key === "signatures" ? "SIGNATURE" : key === "goals and plan" ? "GOALS & PLAN" : field.label.toUpperCase();
      document.font("Helvetica-Bold").fontSize(10.5).fillColor("#ffffff").text(sectionLabel, contentLeft, sectionY + 6);
      document.y = sectionY + 28;
      continue;
    }

    if (field.layout === "physician-approval") {
      if (document.y > 115) document.addPage();
      if (document.y <= document.page.margins.top + 2) drawHeader(false);
      physicianApprovalPageOpen = true;
      const approval = (field.data || {}) as Record<string, unknown>;
      const boxY = document.y;
      document.rect(sectionLeft, boxY, sectionWidth, 112).lineWidth(1).strokeColor("#2e86c1").stroke();
      document.rect(sectionLeft, boxY + 5, sectionWidth, 25).fill("#2e86c1");
      document.font("Helvetica").fontSize(10).fillColor("#ffffff").text("Physician Review & Approval", contentLeft, boxY + 12);
      document.font("Helvetica").fontSize(8.5).fillColor("#111827").text("I have reviewed the Therapy Plan of Care and approved the requested visits.", contentLeft, boxY + 39);
      document.text(`Physician Name:  ${String(approval.physicianName || "N/A")}`, contentLeft, boxY + 59);
      document.moveTo(contentLeft, boxY + 88).lineTo(contentLeft + 242, boxY + 88).lineWidth(0.6).strokeColor("#9ca3af").stroke();
      document.moveTo(contentLeft + 272, boxY + 88).lineTo(sectionLeft + sectionWidth - 14, boxY + 88).stroke();
      document.font("Helvetica").fontSize(7).fillColor("#6b7280").text("Physician Signature", contentLeft, boxY + 94);
      document.text("Date", contentLeft + 272, boxY + 94);
      document.y = boxY + 118;
      continue;
    }

    if (field.subheading) {
      if (document.y > document.page.height - 72) document.addPage();
      const headingY = document.y + (isAtPageTop() ? 0 : subsectionGap);
      document.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text(field.label, contentLeft, headingY);
      document.y = headingY + 17;
      continue;
    }

    if (field.layout === "goal") {
      const goal = (field.data || {}) as Record<string, unknown>;
      const interventions = Array.isArray(goal.interventions) ? goal.interventions.map(String) : [];
      const goalText = String(goal.goal || "N/A");
      const initialStatus = String(goal.initial_status || goal.functional_status || "N/A");
      const expectedCompletion = String(goal.expected_completion || "N/A");
      const estimatedHeight = 56
        + document.heightOfString(goalText, { width: contentWidth - 24, lineGap: 1.5 })
        + document.heightOfString(interventions.join("\n"), { width: contentWidth - 38, lineGap: 1.5 });
      if (document.y > document.page.height - Math.max(115, estimatedHeight)) document.addPage();
      const goalY = document.y;
      document.rect(sectionLeft, goalY, sectionWidth, 22).fill("#d9eaf8");
      document.font("Helvetica").fontSize(10).fillColor("#1f5f8b").text(field.label, contentLeft, goalY + 6);
      document.y = goalY + 29;
      document.font("Helvetica").fontSize(8.5).fillColor("#111827").text(goalText, contentLeft, document.y, { width: contentWidth, lineGap: 1.5 });
      document.moveDown(0.35);
      document.font("Helvetica-Bold").text("Initial Status:", contentLeft + 14, document.y, { continued: true });
      document.font("Helvetica").text(`  ${initialStatus}`);
      document.font("Helvetica-Bold").text("Expected Completion:", contentLeft + 14, document.y, { continued: true });
      document.font("Helvetica").text(`  ${expectedCompletion}`);
      if (interventions.length) {
        document.font("Helvetica-Bold").text("Interventions:", contentLeft + 14, document.y);
        interventions.forEach((item) => document.font("Helvetica").text(`• ${item}`, contentLeft + 14, document.y, { width: contentWidth - 14 }));
      }
      document.moveDown(0.55);
      continue;
    }

    if (field.layout === "complexity") {
      if (document.y > document.page.height - 85) document.addPage();
      const bannerY = document.y + 3;
      document.roundedRect(sectionLeft, bannerY, sectionWidth, 35, 7).fill("#ef7d16");
      document.font("Helvetica").fontSize(11).fillColor("#ffffff").text("Evaluation Complexity Level:", contentLeft, bannerY + 11);
      document.text(String(field.value || "N/A"), sectionLeft + sectionWidth - 180, bannerY + 11, { width: 160, align: "center" });
      document.y = bannerY + 47;
      continue;
    }

    if (field.layout === "assessment-summary") {
      const assessment = (field.data || {}) as Record<string, unknown>;
      const narrative = String(assessment.narrative || "").trim();
      const riskFactors = Array.isArray(assessment.riskFactors)
        ? assessment.riskFactors.map(String).filter(Boolean)
        : [];
      const narrativeHeight = narrative
        ? document.heightOfString(narrative, { width: contentWidth, lineGap: 2 })
        : 0;
      const estimatedHeight = 22 + narrativeHeight + (riskFactors.length ? 20 + riskFactors.length * 12 : 0);
      if (document.y > document.page.height - Math.max(90, estimatedHeight + 35)) document.addPage();
      document.font("Helvetica-Bold").fontSize(9).fillColor("#111827")
        .text("Clinical Impression & Prognosis:", contentLeft, document.y);
      document.moveDown(0.25);
      if (narrative) {
        document.font("Helvetica").fontSize(8.5).fillColor("#111827")
          .text(narrative, contentLeft, document.y, { width: contentWidth, lineGap: 2 });
        document.moveDown(0.65);
      }
      if (riskFactors.length) {
        document.font("Helvetica-Bold").fontSize(9).fillColor("#111827")
          .text("Risk Factors for Fall:", contentLeft, document.y);
        document.moveDown(0.2);
        riskFactors.forEach((risk) => {
          document.font("Helvetica").fontSize(8.5).fillColor("#111827")
            .text(`• ${risk}`, contentLeft + 8, document.y, { width: contentWidth - 8, lineGap: 1 });
        });
      }
      document.moveDown(0.55);
      document.moveTo(sectionLeft, document.y).lineTo(sectionLeft + sectionWidth, document.y)
        .lineWidth(0.6).strokeColor("#f0a35e").stroke();
      document.y += 9;
      continue;
    }

    if (field.layout === "standardized-tests") {
      const tests = Array.isArray(field.data)
        ? field.data.filter((item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item))
        : [];
      if (!tests.length) continue;
      if (document.y > document.page.height - 125) document.addPage();
      document.font("Helvetica-Bold").fontSize(10).fillColor("#111827").text("Standardized Testing", contentLeft, document.y);
      document.y += 17;
      tests.forEach((test, index) => {
        const scoreRecord = test.scores && typeof test.scores === "object" && !Array.isArray(test.scores)
          ? test.scores as Record<string, unknown>
          : {};
        const rows = ([
          ["Date", test.date] as [string, unknown],
          ["Type", test.type] as [string, unknown],
          ...Object.entries(scoreRecord).map(([key, value]) => [humanizePdfKey(key), value] as [string, unknown]),
          ["Interpretation", test.interpretation] as [string, unknown],
          ["Calculated Score", test.calculated_score] as [string, unknown],
        ] as Array<[string, unknown]>).filter(([, value]) => value !== null && value !== undefined && value !== "");
        const boxHeight = 27 + rows.length * 14;
        if (document.y > document.page.height - boxHeight - 45) document.addPage();
        const boxY = document.y;
        document.roundedRect(sectionLeft, boxY, sectionWidth, boxHeight, 4).lineWidth(0.6).strokeColor("#cbd5e1").stroke();
        document.font("Helvetica-Bold").fontSize(8.5).fillColor("#0f766e")
          .text(String(test.name || test.type || `Test ${index + 1}`).toUpperCase(), contentLeft, boxY + 8);
        let rowY = boxY + 25;
        rows.forEach(([label, value]) => {
          document.font("Helvetica-Bold").fontSize(8).fillColor("#374151").text(`${label}:`, contentLeft, rowY, { width: 120 });
          document.font("Helvetica").fontSize(8).fillColor("#111827").text(String(value), contentLeft + 124, rowY, { width: contentWidth - 124 });
          rowY += 14;
        });
        document.y = boxY + boxHeight + 8;
      });
      continue;
    }

    if (field.layout === "adl-grid") {
      const grid = (field.data || {}) as Record<string, unknown>;
      const columns = ["NT", "I", "MI", "VC", "SBA", "CGA", "MinA", "ModA", "MaxA", "TD"];
      const availableRows = [
        ["Grooming", ["Grooming", "grooming"]],
        ["Toileting", ["Toileting", "toileting"]],
        ["Bathing", ["Bathing", "bathing"]],
        ["Laundry", ["Laundry", "laundry"]],
        ["Shopping", ["Shopping", "shopping"]],
        ["Transferring", ["Transferring", "transferring"]],
        ["Housekeeping", ["Housekeeping", "housekeeping"]],
        ["Transportation", ["Transportation", "transportation"]],
        ["Feeding / Eating", ["Feeding / Eating", "feeding_eating"]],
        ["Ability to Use Phone", ["Ability to Use Phone", "ability_to_use_phone"]],
        ["Light Meal Preparation", ["Light Meal Preparation", "light_meal_preparation"]],
        ["Ambulation / Locomotion", ["Ambulation / Locomotion", "ambulation_locomotion"]],
        ["Ability to Dress Lower Body", ["Ability to Dress Lower Body", "ability_to_dress_lower_body"]],
        ["Ability to Dress Upper Body", ["Ability to Dress Upper Body", "ability_to_dress_upper_body"]],
        ["Upper Body Dressing", ["Upper Body Dressing", "upper_body_dressing"]],
        ["Lower Body Dressing", ["Lower Body Dressing", "lower_body_dressing"]],
        ["Toilet Hygiene", ["Toilet Hygiene", "toilet_hygiene"]],
        ["Light Meal Prep", ["Light Meal Prep", "light_meal_prep"]],
      ] as const;
      const rows = availableRows.filter(([, keys]) =>
        keys.some((key) => grid[key] !== undefined && grid[key] !== null && grid[key] !== "")
      );
      const labelWidth = 118;
      const colWidth = (sectionWidth - labelWidth) / columns.length;
      const gridHeight = 18 + rows.length * 19;
      if (document.y > document.page.height - gridHeight - 55) document.addPage();
      const gridY = document.y;
      columns.forEach((column, index) => document.font("Helvetica").fontSize(6.5).fillColor("#111827").text(column, sectionLeft + labelWidth + index * colWidth, gridY, { width: colWidth, align: "center" }));
      rows.forEach(([rowLabel, keys], rowIndex) => {
        const y = gridY + 17 + rowIndex * 19;
        if (rowIndex % 2 === 0) document.rect(sectionLeft, y - 4, sectionWidth, 17).fill("#f1f5f9");
        document.font("Helvetica").fontSize(7).fillColor("#009f9a").text(rowLabel, sectionLeft + 2, y, { width: labelWidth - 4 });
        const selectedValue = keys.map((key) => grid[key]).find((value) => value !== undefined && value !== null);
        columns.forEach((column, index) => {
          const cx = sectionLeft + labelWidth + index * colWidth + colWidth / 2;
          const normalizedSelected = String(selectedValue || "").toLowerCase();
          const selected = normalizedSelected === column.toLowerCase() || (column === "TD" && normalizedSelected === "d");
          document.circle(cx, y + 3, 4).lineWidth(0.7).strokeColor(selected ? "#14b8a6" : "#9ca3af").stroke();
          if (selected) document.circle(cx, y + 3, 3.2).fill("#14b8a6");
        });
      });
      document.y = gridY + gridHeight + 5;
      continue;
    }

    if (field.layout === "rom-grid") {
      const rom = (field.data || {}) as Record<string, unknown>;
      const joints = ["Shoulder", "Elbow", "Wrist", "Hip", "Knee", "Ankle"];
      const rows = joints.filter((joint) => rom[`${joint}_L_status`] || rom[`${joint}_R_status`]);
      const sideText = (joint: string, side: "L" | "R") => {
        const status = String(rom[`${joint}_${side}_status`] || "N/A");
        const movements = Array.isArray(rom[`${joint}_${side}_movements`])
          ? (rom[`${joint}_${side}_movements`] as Array<Record<string, unknown>>)
              .filter((movement) => movement && (movement.movement || movement.value))
              .map((movement) => [movement.movement, movement.value].filter(Boolean).join(": "))
          : [];
        return `${side}: ${status}${movements.length ? ` - ${movements.join("; ")}` : ""}`;
      };
      const rowHeights = rows.map((joint) => Math.max(
        16,
        document.heightOfString(sideText(joint, "L"), { width: 165, lineGap: 1 }) + 4,
        document.heightOfString(sideText(joint, "R"), { width: 165, lineGap: 1 }) + 4,
      ));
      const estimatedHeight = 24 + rowHeights.reduce((sum, height) => sum + height, 0);
      if (document.y > document.page.height - estimatedHeight - 45) document.addPage();
      document.font("Helvetica-Bold").fontSize(9).fillColor("#111827").text("Range of Motion:", contentLeft, document.y);
      document.y += 17;
      rows.forEach((joint, index) => {
        const y = document.y;
        if (index % 2 === 0) document.rect(sectionLeft, y - 3, sectionWidth, rowHeights[index]).fill("#f8fafc");
        document.font("Helvetica-Bold").fontSize(8).fillColor("#374151").text(`${joint}:`, contentLeft + 5, y, { width: 90 });
        document.font("Helvetica").fillColor("#111827").text(sideText(joint, "L"), contentLeft + 95, y, { width: 165, lineGap: 1 });
        document.text(sideText(joint, "R"), contentLeft + 275, y, { width: 165, lineGap: 1 });
        document.y = y + rowHeights[index];
      });
      document.moveDown(0.35);
      continue;
    }

    if (field.layout === "other-findings") {
      const findings = (field.data || {}) as Record<string, unknown>;
      const categories = [
        ["Neurological", "neurological"],
        ["Sensation", "sensation"],
        ["Skin Condition", "skin_condition"],
        ["Edema", "edema"],
      ] as const;
      const rows = categories.flatMap(([label, key]) => {
        const hasStatus = Object.prototype.hasOwnProperty.call(findings, `${key}_wnl`);
        const notes = String(findings[`${key}_notes`] || "").trim();
        if (!hasStatus && !notes) return [];
        return [{ label, status: findings[`${key}_wnl`] === false ? "Abnormal" : "WNL", notes: notes || "-" }];
      });
      if (!rows.length) continue;
      const labelWidth = 112;
      const statusWidth = 74;
      const notesWidth = sectionWidth - labelWidth - statusWidth;
      const rowHeights = rows.map((row) => Math.max(18, document.heightOfString(row.notes, { width: notesWidth - 12, lineGap: 1 }) + 8));
      const estimatedHeight = 22 + rowHeights.reduce((sum, height) => sum + height, 0);
      if (document.y > document.page.height - estimatedHeight - 45) document.addPage();
      const tableY = document.y;
      document.rect(sectionLeft, tableY, sectionWidth, 20).fill("#e2e8f0");
      document.font("Helvetica-Bold").fontSize(7.5).fillColor("#334155").text("CATEGORY", sectionLeft + 7, tableY + 6, { width: labelWidth - 12 });
      document.text("STATUS", sectionLeft + labelWidth + 6, tableY + 6, { width: statusWidth - 12 });
      document.text("NOTES", sectionLeft + labelWidth + statusWidth + 6, tableY + 6, { width: notesWidth - 12 });
      let y = tableY + 20;
      rows.forEach((row, index) => {
        const height = rowHeights[index];
        if (index % 2 === 0) document.rect(sectionLeft, y, sectionWidth, height).fill("#f8fafc");
        document.font("Helvetica-Bold").fontSize(8).fillColor("#0f766e").text(row.label, sectionLeft + 7, y + 5, { width: labelWidth - 12 });
        document.font("Helvetica").fillColor("#111827").text(row.status, sectionLeft + labelWidth + 6, y + 5, { width: statusWidth - 12 });
        document.text(row.notes, sectionLeft + labelWidth + statusWidth + 6, y + 5, { width: notesWidth - 12, lineGap: 1 });
        document.moveTo(sectionLeft, y + height).lineTo(sectionLeft + sectionWidth, y + height).lineWidth(0.35).strokeColor("#cbd5e1").stroke();
        y += height;
      });
      document.y = y + 8;
      continue;
    }

    if (field.layout === "discharge-plan") {
      const data = (field.data || {}) as Record<string, unknown>;
      const dcPlan = data.dcPlan && typeof data.dcPlan === "object" && !Array.isArray(data.dcPlan) ? data.dcPlan as Record<string, unknown> : {};
      const education = data.education && typeof data.education === "object" && !Array.isArray(data.education) ? data.education as Record<string, unknown> : {};
      const list = (value: unknown) => Array.isArray(value) ? value.filter(Boolean).join(", ") : value;
      const rows = ([
        ["Discharge Notes", dcPlan.discharge_notes],
        ["Discharge Criteria", dcPlan.discharge_criteria],
        ["Discharge Setting", dcPlan.discharge_setting],
        ["Treatment Performed", dcPlan.treatment_performed],
        ["Rehabilitation Potential", dcPlan.rehab_potential],
        ["Barriers to Progress", dcPlan.barriers_to_progress],
        ["Patient Education - Topics", list(education.topics)],
        ["Patient Education - Educated To", list(education.educated_to)],
        ["Patient Education - Response", education.response],
        ["Patient Education - Notes", education.notes],
      ] as Array<[string, unknown]>).filter(([, value]) => value !== null && value !== undefined && value !== "");
      if (!rows.length) continue;
      const labelWidth = 145;
      const valueWidth = contentWidth - labelWidth;
      const rowHeights = rows.map(([label, value]) => Math.max(
        17,
        document.heightOfString(`${label}:`, { width: labelWidth - 8, lineGap: 1 }) + 5,
        document.heightOfString(String(value), { width: valueWidth, lineGap: 1.5 }) + 5,
      ));
      const estimatedHeight = rowHeights.reduce((sum, height) => sum + height, 0) + 8;
      if (document.y > document.page.height - estimatedHeight - 45) document.addPage();
      rows.forEach(([label, value], index) => {
        const y = document.y;
        const height = rowHeights[index];
        if (index % 2 === 0) document.rect(sectionLeft, y - 2, sectionWidth, height).fill("#f8fafc");
        document.font("Helvetica-Bold").fontSize(8).fillColor("#374151").text(`${label}:`, contentLeft, y + 3, { width: labelWidth - 8, lineGap: 1 });
        document.font("Helvetica").fillColor("#111827").text(String(value), contentLeft + labelWidth, y + 3, { width: valueWidth, lineGap: 1.5 });
        document.y = y + height;
      });
      document.y += 8;
      continue;
    }

    if (field.layout === "strength-grid") {
      const strength = (field.data || {}) as Record<string, unknown>;
      const entries = new Map<string, { left?: unknown; right?: unknown }>();
      Object.entries(strength).forEach(([key, value]) => {
        const match = key.match(/^(.+)_([LR])$/);
        if (!match || !value) return;
        const label = humanizePdfKey(match[1]);
        const existing = entries.get(label) || {};
        if (match[2] === "L") existing.left = value;
        else existing.right = value;
        entries.set(label, existing);
      });
      if (document.y > document.page.height - entries.size * 14 - 55) document.addPage();
      document.font("Helvetica-Bold").fontSize(9).fillColor("#111827").text("Strength Evaluation:", contentLeft, document.y);
      document.moveDown(0.25);
      for (const [label, sides] of entries) {
        const y = document.y;
        document.font("Helvetica").fontSize(8).text(`${label}:`, contentLeft + 15, y, { width: 210 });
        document.text(`L: ${String(sides.left || "N/A")}`, contentLeft + 240, y, { width: 95 });
        document.text(`R: ${String(sides.right || "N/A")}`, contentLeft + 350, y, { width: 95 });
        document.y = y + 14;
      }
      document.moveDown(0.35);
      continue;
    }

    if (document.y > document.page.height - 75) document.addPage();
    const rowY = document.y;
    if (field.fullWidth) {
      const value = String(field.value ?? "N/A");
      const line = `${field.label}: ${value}`;
      document.font("Helvetica-Bold").fontSize(9);
      const lineHeight = document.heightOfString(line, { width: contentWidth, lineGap: 1.5 });
      document.fillColor("#111827").text(line, contentLeft, rowY, { width: contentWidth, lineGap: 1.5 });
      document.y = rowY + Math.max(14, lineHeight + 2);
      continue;
    }
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
      const isDiagnoses = field.label.toLowerCase() === "diagnoses";
      const textX = isDiagnoses ? contentLeft + 5 : valueX;
      const textY = isDiagnoses ? rowY + 13 : rowY;
      const textWidth = isDiagnoses ? contentWidth - 5 : contentWidth - 138;
      const lineGap = isDiagnoses ? 2.5 : 1.5;
      document.font("Helvetica-Bold").fontSize(9);
      const labelHeight = isDiagnoses ? 13 : document.heightOfString(`${field.label}:`, { width: 128, lineGap: 1.5 });
      document.font("Helvetica").fontSize(9);
      const valueHeight = document.heightOfString(value, { width: textWidth, lineGap });
      document.fillColor("#111827").text(value, textX, textY, { width: textWidth, lineGap });
      document.y = rowY + Math.max(14, labelHeight + 2, (textY - rowY) + valueHeight + 2);
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

function humanizePdfKey(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
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
