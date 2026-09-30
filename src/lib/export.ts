import { analyze } from "./analysis";
import { formatAmount, formatSigned } from "./format";
import type { Lang, Translate } from "./i18n";
import { isPaid, type MemberRow, type MonthSummary, type YearMonth } from "./ledger";

export type ReportKind = "annual" | "monthly" | "alerts" | "analysis";
export type ExportFormat = "xlsx" | "pdf";

export type ExportContext = {
  year: number;
  today: YearMonth;
  rows: MemberRow[];
  months: MonthSummary[];
  totals: { total: number; withdraw: number; balance: number };
  lang: Lang;
  t: Translate;
  monthNames: string[];
  monthsShort: string[];
};

type Cell = string | number | null;

type Section = {
  sheet: string;
  title?: string;
  head: string[];
  body: Cell[][];
  foot?: Cell[];
  /** column indexes holding FCFA amounts */
  money?: number[];
  /** column indexes shown as +/- with green/red colour */
  signed?: number[];
  /** Excel: live formulas for the annual grid */
  annualFormulas?: boolean;
  /** PDF: pad the table with empty numbered rows, like the paper register */
  padRows?: number;
};

type Report = {
  file: string;
  subtitle: string;
  orientation: "landscape" | "portrait";
  fontSize: number;
  sections: Section[];
};

const PURPLE: [number, number, number] = [47, 0, 82];
const LAVENDER: [number, number, number] = [246, 233, 255];
const GOLD: [number, number, number] = [217, 119, 6];
const GREEN: [number, number, number] = [15, 138, 79];
const RED: [number, number, number] = [200, 30, 30];

export function buildReport(kind: ReportKind, ctx: ExportContext): Report {
  const { t, year, rows, months, totals, monthNames, monthsShort } = ctx;
  const njangi = t("njangiTitle", { year });

  if (kind === "annual") {
    return {
      file: `BOBA80s_Njangi_${year}`,
      subtitle: njangi,
      orientation: "landscape",
      fontSize: 7,
      sections: [
        {
          sheet: String(year),
          head: [t("sn"), t("membersName"), ...monthsShort, t("total"), t("withdraw"), t("balance")],
          body: rows.map((r) => [r.sn, r.name, ...r.contributions.map((c) => (isPaid(c) ? c : null)), r.total, r.withdraw, r.balance]),
          foot: ["", t("totals"), ...months.map((m) => m.contributed), totals.total, totals.withdraw, totals.balance],
          money: Array.from({ length: 15 }, (_, i) => i + 2),
          signed: [16],
          annualFormulas: true,
          padRows: 20,
        },
      ],
    };
  }

  if (kind === "monthly") {
    const statusLabel = (m: MonthSummary) =>
      m.status === "past" ? t("statusPast") : m.status === "current" ? t("statusCurrent") : t("statusUpcoming");
    const detailMonths = months.filter((m) => m.status !== "upcoming" || m.contributed > 0 || m.withdrawn > 0);
    return {
      file: `BOBA80s_Monthly_${year}`,
      subtitle: `${t("reportMonth")} - ${year}`,
      orientation: "portrait",
      fontSize: 9,
      sections: [
        {
          sheet: t("reportMonth"),
          head: [t("month"), t("status"), t("contribution"), t("withdrawal"), t("balance"), t("paid"), t("notPaid")],
          body: months.map((m) => [
            monthNames[m.month - 1],
            statusLabel(m),
            m.contributed,
            m.withdrawn,
            m.contributed - m.withdrawn,
            `${m.paid}/${m.count}`,
            m.status === "past" ? m.missing.length : "",
          ]),
          foot: [t("totals"), "", totals.total, totals.withdraw, totals.balance, "", ""],
          money: [2, 3, 4],
          signed: [4],
        },
        ...detailMonths.map<Section>((m) => ({
          sheet: monthNames[m.month - 1],
          title: `${monthNames[m.month - 1]} ${year}`,
          head: [t("sn"), t("member"), t("contribution"), t("withdrawal"), t("status")],
          body: rows.map((r) => {
            const c = r.contributions[m.month - 1];
            return [
              r.sn,
              r.name,
              isPaid(c) ? c : null,
              r.withdrawals[m.month - 1] || null,
              isPaid(c) ? t("paid") : m.status === "past" ? t("notPaid") : "-",
            ];
          }),
          foot: ["", t("totals"), m.contributed, m.withdrawn, `${m.paid}/${m.count}`],
          money: [2, 3],
        })),
      ],
    };
  }

  if (kind === "alerts") {
    const byMonth = months.filter((m) => m.missing.length > 0);
    const byMember = rows.filter((r) => r.missingMonths.length > 0);
    return {
      file: `BOBA80s_Missing_${year}`,
      subtitle: `${t("reportAlerts")} - ${year}`,
      orientation: "portrait",
      fontSize: 9,
      sections: [
        {
          sheet: t("byMonth"),
          title: t("byMonth"),
          head: [t("month"), t("sn"), t("member")],
          body: byMonth.flatMap((m) => m.missing.map((r) => [monthNames[m.month - 1], r.sn, r.name])),
        },
        {
          sheet: t("byMember"),
          title: t("byMember"),
          head: [t("sn"), t("member"), t("notPaid"), t("month")],
          body: byMember.map((r) => [r.sn, r.name, r.missingMonths.length, r.missingMonths.map((m) => monthsShort[m - 1]).join(", ")]),
        },
      ],
    };
  }

  const a = analyze(rows, months, year, ctx.today);
  let running = 0;
  return {
    file: `BOBA80s_Analysis_${year}`,
    subtitle: `${t("reportAnalysis")} - ${year}`,
    orientation: "portrait",
    fontSize: 9,
    sections: [
      {
        sheet: t("analysisTitle"),
        title: t("analysisTitle"),
        head: ["", ""],
        body: [
          [t("totalContributed"), a.total],
          [t("totalWithdrawn"), a.withdraw],
          [t("netBalance"), a.balance],
          [t("collectionRate"), a.collectionRate === null ? "-" : `${a.collectionRate.toFixed(1)}%`],
          [t("avgMonthly"), Math.round(a.avgMonthly)],
          [t("bestMonth"), a.best ? `${monthNames[a.best.month - 1]} (${formatAmount(a.best.contributed, ctx.lang)} FCFA)` : "-"],
          [t("topContributor"), a.top ? `${a.top.name} (${formatAmount(a.top.total, ctx.lang)} FCFA)` : "-"],
          [t("activeMembers"), rows.length],
        ],
        money: [1],
      },
      {
        sheet: t("memberSummary"),
        title: t("memberSummary"),
        head: [t("sn"), t("member"), t("monthsPaid"), t("rate"), t("total"), t("withdraw"), t("balance")],
        body: a.memberStats.map((r) => [
          r.sn,
          r.name,
          `${r.paidMonths}/${a.passedCount}`,
          r.rate === null ? "-" : `${r.rate.toFixed(0)}%`,
          r.total,
          r.withdraw,
          r.balance,
        ]),
        foot: ["", t("totals"), "", "", a.total, a.withdraw, a.balance],
        money: [4, 5, 6],
        signed: [6],
      },
      {
        sheet: t("cumulativeChart"),
        title: t("monthlyChart"),
        head: [t("month"), t("contribution"), t("withdrawal"), t("cumulativeChart")],
        body: months.map((m) => {
          running += m.contributed - m.withdrawn;
          return [monthNames[m.month - 1], m.contributed, m.withdrawn, running];
        }),
        money: [1, 2, 3],
        signed: [3],
      },
    ],
  };
}

async function loadLogo(): Promise<string | null> {
  try {
    const res = await fetch("/logo-print.jpg");
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function columnLetter(n: number) {
  let s = "";
  for (let i = n; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s;
  return s;
}

type ExcelModule = typeof import("exceljs");

export async function renderExcel(report: Report, ctx: ExportContext, logo: string | null, ExcelJS: ExcelModule): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "BOBA 80s Njangi";
  wb.created = new Date();
  const usedNames = new Set<string>();
  const logoId = logo ? wb.addImage({ base64: logo, extension: "jpeg" }) : null;

  for (const section of report.sections) {
    let name = section.sheet.replace(/[\\/*?:[\]]/g, " ").slice(0, 31);
    while (usedNames.has(name)) name = `${name.slice(0, 28)} ${usedNames.size}`;
    usedNames.add(name);

    const ws = wb.addWorksheet(name, {
      pageSetup: { orientation: report.orientation, fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
    });
    const cols = section.head.length;
    const last = columnLetter(cols);

    const titles = [ctx.t("school"), ctx.t("boba"), section.title ? `${report.subtitle} - ${section.title}` : report.subtitle];
    titles.forEach((text, i) => {
      const row = ws.getRow(i + 1);
      ws.mergeCells(`A${i + 1}:${last}${i + 1}`);
      row.getCell(1).value = text;
      row.getCell(1).alignment = { horizontal: "center", vertical: "middle" };
      row.getCell(1).font = { bold: true, size: i === 1 ? 14 : 12, color: { argb: i === 1 ? "FF904D00" : "FF2F0052" } };
      row.height = 20;
    });
    if (logoId !== null && cols >= 3) {
      ws.addImage(logoId, { tl: { col: 0, row: 0 }, ext: { width: 58, height: 58 } });
    }

    const headRowIndex = 5;
    const headRow = ws.getRow(headRowIndex);
    section.head.forEach((h, i) => {
      const cell = headRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F0052" } };
      cell.alignment = { horizontal: section.money?.includes(i) ? "right" : "left", vertical: "middle" };
    });
    headRow.height = 22;

    const firstBody = headRowIndex + 1;
    section.body.forEach((values, r) => {
      const excelRow = ws.getRow(firstBody + r);
      values.forEach((v, c) => {
        const cell = excelRow.getCell(c + 1);
        cell.value = v === null ? null : v;
      });
      if (section.annualFormulas) {
        const n = firstBody + r;
        excelRow.getCell(15).value = { formula: `SUM(C${n}:N${n})`, result: values[14] as number };
        excelRow.getCell(17).value = { formula: `O${n}-P${n}`, result: values[16] as number };
      }
      if (r % 2 === 1) {
        for (let c = 1; c <= cols; c++) {
          excelRow.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFAF0FF" } };
        }
      }
    });

    const lastBody = firstBody + section.body.length - 1;
    if (section.foot) {
      const footRow = ws.getRow(lastBody + 1);
      section.foot.forEach((v, c) => {
        const cell = footRow.getCell(c + 1);
        if (section.annualFormulas && c >= 2 && section.body.length > 0) {
          const L = columnLetter(c + 1);
          cell.value = { formula: `SUM(${L}${firstBody}:${L}${lastBody})`, result: v as number };
        } else {
          cell.value = v;
        }
        cell.font = { bold: true, color: { argb: "FF2F0052" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1E3FE" } };
      });
    }

    const lastRow = lastBody + (section.foot ? 1 : 0);
    for (let r = headRowIndex; r <= lastRow; r++) {
      const row = ws.getRow(r);
      for (let c = 1; c <= cols; c++) {
        const cell = row.getCell(c);
        cell.border = {
          top: { style: "thin", color: { argb: "FFCEC3D2" } },
          bottom: { style: "thin", color: { argb: "FFCEC3D2" } },
          left: { style: "thin", color: { argb: "FFCEC3D2" } },
          right: { style: "thin", color: { argb: "FFCEC3D2" } },
        };
        if (r > headRowIndex && section.money?.includes(c - 1)) {
          cell.numFmt = section.signed?.includes(c - 1) ? '"+"#,##0;"-"#,##0;0' : "#,##0";
          cell.alignment = { horizontal: "right" };
        }
        if (r > headRowIndex && section.signed?.includes(c - 1)) {
          const raw = cell.value;
          const num = typeof raw === "number" ? raw : raw && typeof raw === "object" && "result" in raw ? Number(raw.result) : 0;
          cell.font = { bold: true, color: { argb: num > 0 ? "FF0F8A4F" : num < 0 ? "FFC81E1E" : "FF4C4451" } };
        }
      }
    }

    ws.columns.forEach((col, i) => {
      const values = [section.head[i], ...section.body.map((b) => b[i]), section.foot?.[i]];
      const longest = Math.max(...values.map((v) => (v == null ? 0 : typeof v === "number" ? formatAmount(v).length + 1 : String(v).length)));
      col.width = Math.min(Math.max(longest + 3, i === 0 ? 6 : 10), 42);
    });
    ws.views = [{ state: "frozen", xSplit: section.annualFormulas ? 2 : 0, ySplit: headRowIndex }];
  }

  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export async function renderPdf(report: Report, ctx: ExportContext, logo: string | null): Promise<ArrayBuffer> {
  const { jsPDF } = await import("jspdf");
  const { autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ orientation: report.orientation, unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 28;

  const header = () => {
    if (logo) doc.addImage(logo, "JPEG", margin, 16, 54, 54, "logo");
    doc.setTextColor(...PURPLE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(ctx.t("school"), pageWidth / 2, 32, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(...GOLD);
    doc.text(ctx.t("boba"), pageWidth / 2, 50, { align: "center" });
    doc.setTextColor(...PURPLE);
    doc.setFontSize(12);
    doc.text(report.subtitle, pageWidth / 2, 67, { align: "center" });
  };

  const fmt = (v: Cell, col: number, section: Section) => {
    if (v === null || v === "") return "";
    if (typeof v === "number" && section.money?.includes(col)) {
      return section.signed?.includes(col) ? formatSigned(v, ctx.lang) : formatAmount(v, ctx.lang);
    }
    return String(v);
  };

  // Page header is drawn by autoTable's didDrawPage, once per page
  const headerPages = new Set<number>();
  let y = 84;
  for (const section of report.sections) {
    if (section.title && report.sections.length > 1) {
      if (y > pageHeight - 90) {
        doc.addPage();
        y = 84;
      }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...PURPLE);
      doc.text(section.title, margin, y + 6);
      y += 14;
    }

    const body = section.body.map((row) => row.map((v, c) => fmt(v, c, section)));
    if (section.padRows && body.length < section.padRows) {
      for (let i = body.length; i < section.padRows; i++) body.push([String(i + 1), ...Array(section.head.length - 1).fill("")]);
    }

    const columnStyles: Record<number, { halign?: "right"; cellWidth?: number }> = {};
    for (const c of section.money ?? []) columnStyles[c] = { halign: "right" };
    if (section.annualFormulas) columnStyles[1] = { cellWidth: 110 };

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin, top: 84 },
      head: section.head.some(Boolean) ? [section.head] : undefined,
      body,
      foot: section.foot ? [section.foot.map((v, c) => fmt(v, c, section))] : undefined,
      showFoot: "lastPage",
      theme: "grid",
      styles: { fontSize: report.fontSize, cellPadding: 3.5, lineColor: [206, 195, 210], lineWidth: 0.4, textColor: [32, 24, 43] },
      headStyles: { fillColor: PURPLE, textColor: 255, fontStyle: "bold", halign: "center" },
      footStyles: { fillColor: [241, 227, 254], textColor: PURPLE, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [250, 240, 255] },
      columnStyles,
      didParseCell: (data) => {
        const col = data.column.index;
        if (section.annualFormulas && col === 14 && data.section !== "head") data.cell.styles.fillColor = LAVENDER;
        if (section.annualFormulas && col === 15 && data.section !== "head") data.cell.styles.fillColor = [255, 231, 207];
        if (data.section !== "head" && section.signed?.includes(col)) {
          const text = String(data.cell.raw ?? "");
          if (text.startsWith("+")) data.cell.styles.textColor = GREEN;
          else if (text.startsWith("-")) data.cell.styles.textColor = RED;
          data.cell.styles.fontStyle = "bold";
        }
      },
      didDrawPage: () => {
        const page = doc.getCurrentPageInfo().pageNumber;
        if (!headerPages.has(page)) {
          headerPages.add(page);
          header();
        }
      },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 22;
  }

  const pages = doc.getNumberOfPages();
  const stamp = ctx.t("generatedOn", { date: new Date().toLocaleString(ctx.lang === "fr" ? "fr-FR" : "en-GB") });
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(76, 68, 81);
    doc.text(stamp, margin, pageHeight - 14);
    doc.text(`${i} / ${pages}`, pageWidth - margin, pageHeight - 14, { align: "right" });
  }
  return doc.output("arraybuffer");
}

export async function exportReport(kind: ReportKind, format: ExportFormat, ctx: ExportContext) {
  const report = buildReport(kind, ctx);
  const logo = await loadLogo();
  if (format === "xlsx") {
    const mod = await import("exceljs/dist/exceljs.min.js");
    const buffer = await renderExcel(report, ctx, logo, (mod.default ?? mod) as ExcelModule);
    download(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${report.file}.xlsx`);
  } else {
    const buffer = await renderPdf(report, ctx, logo);
    download(new Blob([buffer], { type: "application/pdf" }), `${report.file}.pdf`);
  }
}
