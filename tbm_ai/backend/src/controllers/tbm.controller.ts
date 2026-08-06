import { Request, Response } from "express";
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";
import PDFDocument from "pdfkit";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  generateTbmDraft,
  getRecentTbmHistory,
  getTbmHistoryById,
  getTbmHistoryPage,
  removeTbmHistoryById,
  saveTbmHistoryDraftById,
  saveTbmHistorySignatureById,
  type TbmSignatureData
} from "../services/tbm.service";
import {
  buildBundleContent,
  buildPreviewBundleData,
  type TbmDocumentKind
} from "../services/tbm-document-template.service";

type GenerateBody = {
  historyId?: number;
  prompt?: string;
  preset?: {
    workType?: string;
    permitType?: string;
    risk?: string;
    shift?: string;
    workDate?: string;
    location?: string;
  };
  options?: string[];
};

type SignatureBody = {
  checklist?: Record<string, boolean>;
  workerSignature?: string;
  supervisorSignature?: string;
  signedAt?: string;
};

type DraftBody = {
  draftText?: string;
};

const isFilled = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;
const toLimit = (value: string | undefined): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 10;
  }
  return Math.min(Math.max(Math.trunc(parsed), 1), 50);
};

const toHistoryId = (value: string | undefined): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }
  return parsed;
};

const toBodyHistoryId = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return undefined;
  }
  return parsed;
};

const sanitizeFilenamePart = (value: string): string =>
  value
    .replace(/[\\/:*?"<>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);

const toCompactDate = (value: string): string => {
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 8 ? digits.slice(0, 8) : "date";
};

const toDocumentKind = (value: unknown): TbmDocumentKind => {
  if (value === "script" || value === "minutes" || value === "bundle") {
    return value;
  }
  return "bundle";
};

const toDocumentFormat = (value: unknown): "md" | "docx" => {
  if (value === "docx") {
    return "docx";
  }
  return "md";
};

const normalizeSignatureImage = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (!/^data:image\/(?:png|jpeg|jpg|webp);base64,/i.test(trimmed)) {
    return "";
  }
  return trimmed.slice(0, 1_500_000);
};

const normalizeWorkerSignatures = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return "";
  }

  try {
    const parsed = JSON.parse(trimmed);

    if (!Array.isArray(parsed)) {
      return "";
    }

    const normalized = parsed.map((signature) =>
      normalizeSignatureImage(signature)
    );

    return JSON.stringify(normalized);
  } catch {
    // 과거 데이터가 작업자 서명 1개만 저장한 형태라면 호환
    return normalizeSignatureImage(trimmed);
  }
};

const normalizeSignatureChecklist = (value: unknown): Record<string, boolean> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, checked]) => [
      key,
      checked === true
    ])
  );
};

const toDocxParagraphs = (text: string, bold = false): Paragraph[] => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) {
    return [new Paragraph("")];
  }
  return lines.map((line) => new Paragraph({ children: [new TextRun({ text: line, bold })] }));
};

const tableBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "DDE3F0" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDE3F0" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "DDE3F0" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "DDE3F0" },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "DDE3F0" },
  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "DDE3F0" }
};

const resolvePdfFontPath = (): string | null => {
  const envFontPath = process.env.PDF_FONT_PATH;
  if (envFontPath && existsSync(envFontPath)) {
    return envFontPath;
  }

  if (process.platform === "win32") {
    const winDir = process.env.WINDIR ?? "C:\\Windows";
    const candidates = [
      path.join(winDir, "Fonts", "malgun.ttf"), // 맑은 고딕
      path.join(winDir, "Fonts", "malgunbd.ttf")
    ];
    const found = candidates.find((fontPath) => existsSync(fontPath));
    return found ?? null;
  }

  const unixCandidates = [
    "/usr/share/fonts/nanum/NanumGothic.ttf",
    "/usr/share/fonts/nanum/NanumBarunGothic.ttf",
    "/usr/share/fonts/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
  ];
  const found = unixCandidates.find((fontPath) => existsSync(fontPath));
  return found ?? null;
};

const buildScriptPreviewRows = (detail: Awaited<ReturnType<typeof getTbmHistoryById>>) => {
  if (!detail) {
    return [];
  }
  const preview = buildPreviewBundleData(detail);
  return [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 2200, type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "구분", bold: true })]
            })
          ]
        }),
        new TableCell({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: "T.B.M 리더 멘트", bold: true })]
            })
          ]
        })
      ]
    }),
    ...preview.scriptSections.map(
      (section) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 2200, type: WidthType.DXA },
              children: toDocxParagraphs(
                section.subtitle ? `${section.title}\n${section.subtitle}` : section.title,
                true
              )
            }),
            new TableCell({ children: toDocxParagraphs(section.content) })
          ]
        })
    )
  ];
};

const buildMinutesPreviewRows = (detail: Awaited<ReturnType<typeof getTbmHistoryById>>) => {
  if (!detail) {
    return [];
  }
  const preview = buildPreviewBundleData(detail);
  return [
    new TableRow({
      children: [
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: "TBM 일시", bold: true })] })]
        }),
        new TableCell({
          children: [new Paragraph(`${preview.summary.workDate} / ${preview.summary.shift}`)]
        })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: "작 업 명", bold: true })] })]
        }),
        new TableCell({ children: [new Paragraph(preview.summary.workName)] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: "작업장소", bold: true })] })]
        }),
        new TableCell({ children: [new Paragraph(preview.summary.location)] })
      ]
    }),
    new TableRow({
      children: [
        new TableCell({
          width: { size: 1800, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: "위험등급", bold: true })] })]
        }),
        new TableCell({ children: [new Paragraph(preview.summary.risk)] })
      ]
    }),
    ...preview.minutesRows.map(
      (row) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: 1800, type: WidthType.DXA },
              children: [
                new Paragraph({ children: [new TextRun({ text: row.label, bold: true })] })
              ]
            }),
            new TableCell({ children: toDocxParagraphs(row.content) })
          ]
        })
    )
  ];
};

const buildPreviewDocx = (
  detail: NonNullable<Awaited<ReturnType<typeof getTbmHistoryById>>>,
  kind: TbmDocumentKind
): Document => {
  const children: Array<Paragraph | Table> = [];

  if (kind === "script" || kind === "bundle") {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "TBM 실행 시나리오" })]
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: buildScriptPreviewRows(detail),
        borders: tableBorders
      })
    );
  }

  if (kind === "bundle") {
    children.push(new Paragraph(""));
  }

  if (kind === "minutes" || kind === "bundle") {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: "Tool Box Meeting 회의록" })]
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: buildMinutesPreviewRows(detail),
        borders: tableBorders
      })
    );
  }

  return new Document({
    sections: [
      {
        properties: {},
        children
      }
    ]
  });
};

const ensurePdfSpace = (doc: PDFKit.PDFDocument, requiredHeight: number): void => {
  if (doc.y + requiredHeight > doc.page.height - doc.page.margins.bottom) {
    doc.addPage();
  }
};

const drawPdfCellText = (
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  bold = false
): void => {
  doc.fontSize(bold ? 10 : 9);
  doc.text(text, x + 6, y + 6, {
    width: width - 12,
    height: Math.max(10, height - 12),
    lineGap: 2,
    align: bold ? "center" : "left"
  });
};

const drawPdfTableRow = (
  doc: PDFKit.PDFDocument,
  cells: Array<{ text: string; width: number; bold?: boolean }>,
  minHeight = 28
): void => {
  const startX = doc.page.margins.left;
  const heights = cells.map(
    (cell) => doc.heightOfString(cell.text, { width: cell.width - 12, lineGap: 2 }) + 14
  );
  const rowHeight = Math.max(minHeight, ...heights);
  ensurePdfSpace(doc, rowHeight);
  const startY = doc.y;

  let x = startX;
  cells.forEach((cell) => {
    doc.rect(x, startY, cell.width, rowHeight).stroke("#DDE3F0");
    drawPdfCellText(doc, cell.text, x, startY, cell.width, rowHeight, cell.bold);
    x += cell.width;
  });
  doc.y = startY + rowHeight;
};

const drawScriptPreviewPdf = (
  doc: PDFKit.PDFDocument,
  detail: NonNullable<Awaited<ReturnType<typeof getTbmHistoryById>>>
): void => {
  const preview = buildPreviewBundleData(detail);
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const labelWidth = 150;
  const contentWidth = tableWidth - labelWidth;

  doc.fontSize(18).text("TBM 실행 시나리오", { align: "center" });
  doc.moveDown(0.8);
  drawPdfTableRow(
    doc,
    [
      { text: "구분", width: labelWidth, bold: true },
      { text: "T.B.M 리더 멘트", width: contentWidth, bold: true }
    ],
    30
  );
  preview.scriptSections.forEach((section) => {
    drawPdfTableRow(
      doc,
      [
        {
          text: section.subtitle ? `${section.title}\n${section.subtitle}` : section.title,
          width: labelWidth,
          bold: true
        },
        { text: section.content, width: contentWidth }
      ],
      52
    );
  });
};

const drawMinutesPreviewPdf = (
  doc: PDFKit.PDFDocument,
  detail: NonNullable<Awaited<ReturnType<typeof getTbmHistoryById>>>
): void => {
  const preview = buildPreviewBundleData(detail);
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const labelWidth = 120;
  const contentWidth = tableWidth - labelWidth;

  doc.fontSize(18).text("Tool Box Meeting 회의록", { align: "center" });
  doc.moveDown(0.8);
  [
    { label: "TBM 일시", content: `${preview.summary.workDate} / ${preview.summary.shift}` },
    { label: "작 업 명", content: preview.summary.workName },
    { label: "작업장소", content: preview.summary.location },
    { label: "위험등급", content: preview.summary.risk },
    ...preview.minutesRows
  ].forEach((row) => {
    drawPdfTableRow(
      doc,
      [
        { text: row.label, width: labelWidth, bold: true },
        { text: row.content, width: contentWidth }
      ],
      30
    );
  });
};

export const generateTbm = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = (req.body ?? {}) as GenerateBody;
    const preset = body.preset ?? {};

    if (
      !isFilled(body.prompt) ||
      !isFilled(preset.workType) ||
      !isFilled(preset.permitType) ||
      !isFilled(preset.risk) ||
      !isFilled(preset.shift) ||
      !isFilled(preset.workDate) ||
      !isFilled(preset.location)
    ) {
      res.status(400).json({
        ok: false,
        message: "prompt, workType, permitType, risk, shift, workDate, location are required"
      });
      return;
    }

    const generated = await generateTbmDraft({
      historyId: toBodyHistoryId(body.historyId),
      prompt: body.prompt.trim(),
      preset: {
        workType: preset.workType.trim(),
        permitType: preset.permitType.trim(),
        risk: preset.risk.trim(),
        shift: preset.shift.trim(),
        workDate: preset.workDate.trim(),
        location: preset.location.trim()
      },
      options: Array.isArray(body.options)
        ? body.options.filter(isFilled).map((item) => item.trim())
        : []
    });

    res.json({
      ok: true,
      draft: generated.draft,
      historyId: generated.historyId,
      title: generated.title
    });
  } catch (error) {
    console.error("[TBM_GENERATE] failed:", (error as Error).message);
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const listRecentTbm = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = toLimit(req.query.limit as string | undefined);
    const rows = await getRecentTbmHistory(limit);
    res.json({ ok: true, rows });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

const toPage = (value: string | undefined): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
};

const toPageSize = (value: string | undefined): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 10;
  }
  return Math.min(Math.max(Math.trunc(parsed), 1), 100);
};

export const listTbmHistoryList = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = toPage(req.query.page as string | undefined);
    const pageSize = toPageSize(req.query.pageSize as string | undefined);
    const workType = isFilled(req.query.workType as string | undefined)
      ? (req.query.workType as string).trim()
      : undefined;
    const risk = isFilled(req.query.risk as string | undefined)
      ? (req.query.risk as string).trim()
      : undefined;
    const search = isFilled(req.query.search as string | undefined)
      ? (req.query.search as string).trim()
      : undefined;

    const { rows, totalCount } = await getTbmHistoryPage({
      page,
      pageSize,
      workType,
      risk,
      search
    });
    res.json({ ok: true, rows, totalCount, page, pageSize });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const getTbmHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const historyId = toHistoryId(req.params.id);
    if (!historyId) {
      res.status(400).json({ ok: false, message: "invalid history id" });
      return;
    }

    const detail = await getTbmHistoryById(historyId);
    if (!detail) {
      res.status(404).json({ ok: false, message: "history not found" });
      return;
    }

    res.json({ ok: true, row: detail });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const saveTbmHistorySignature = async (req: Request, res: Response): Promise<void> => {
  try {
    const historyId = toHistoryId(req.params.id);
    if (!historyId) {
      res.status(400).json({ ok: false, message: "invalid history id" });
      return;
    }

    const body = (req.body ?? {}) as SignatureBody;
    const signature: TbmSignatureData = {
      checklist: normalizeSignatureChecklist(body.checklist),
      workerSignature: normalizeWorkerSignatures(
        body.workerSignature
      ),
      supervisorSignature: normalizeSignatureImage(
        body.supervisorSignature
      ),
      signedAt: isFilled(body.signedAt)
        ? body.signedAt.trim()
        : new Date().toISOString()
    };

    const saved = await saveTbmHistorySignatureById(historyId, signature);
    if (!saved) {
      res.status(404).json({ ok: false, message: "history not found" });
      return;
    }

    res.json({ ok: true, signature: saved });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const saveTbmHistoryDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const historyId = toHistoryId(req.params.id);
    if (!historyId) {
      res.status(400).json({ ok: false, message: "invalid history id" });
      return;
    }

    const body = (req.body ?? {}) as DraftBody;
    if (!isFilled(body.draftText)) {
      res.status(400).json({ ok: false, message: "draftText is required" });
      return;
    }

    const saved = await saveTbmHistoryDraftById(historyId, body.draftText.trim());
    if (!saved) {
      res.status(404).json({ ok: false, message: "history not found" });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const deleteTbmHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const historyId = toHistoryId(req.params.id);
    if (!historyId) {
      res.status(400).json({ ok: false, message: "invalid history id" });
      return;
    }

    const deleted = await removeTbmHistoryById(historyId);
    if (!deleted) {
      res.status(404).json({ ok: false, message: "history not found" });
      return;
    }

    res.json({ ok: true, id: historyId });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const downloadTbmHistoryDocument = async (req: Request, res: Response): Promise<void> => {
  try {
    const historyId = toHistoryId(req.params.id);
    if (!historyId) {
      res.status(400).json({ ok: false, message: "invalid history id" });
      return;
    }

    const detail = await getTbmHistoryById(historyId);
    if (!detail) {
      res.status(404).json({ ok: false, message: "history not found" });
      return;
    }

    const kind = toDocumentKind(req.query.kind);
    const format = toDocumentFormat(req.query.format);
    const titlePart = sanitizeFilenamePart(detail.title || "tbm");
    const datePart = toCompactDate(detail.preset.workDate || detail.createdAt);
    const suffix = kind === "script" ? "script" : kind === "minutes" ? "minutes" : "bundle";
    const ext = format === "docx" ? "docx" : "md";
    const filename = `tbm-${datePart}-${titlePart || "draft"}-${suffix}.${ext}`;

    if (format === "docx") {
      const doc = buildPreviewDocx(detail, kind);
      const buffer = await Packer.toBuffer(doc);
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
      );
      res.status(200).send(Buffer.from(buffer));
      return;
    }

    const mergedContent = buildBundleContent(detail, kind);
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.status(200).send(mergedContent);
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const downloadTbmHistoryPdf = async (req: Request, res: Response): Promise<void> => {
  try {
    const historyId = toHistoryId(req.params.id);
    if (!historyId) {
      res.status(400).json({ ok: false, message: "invalid history id" });
      return;
    }

    const detail = await getTbmHistoryById(historyId);
    if (!detail) {
      res.status(404).json({ ok: false, message: "history not found" });
      return;
    }

    const kind = toDocumentKind(req.query.kind);
    const titlePart = sanitizeFilenamePart(detail.title || "tbm");
    const datePart = toCompactDate(detail.preset.workDate || detail.createdAt);
    const suffix = kind === "script" ? "script" : kind === "minutes" ? "minutes" : "bundle";
    const filename = `tbm-${datePart}-${titlePart || "draft"}-${suffix}.pdf`;

    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));

    await new Promise<void>((resolve, reject) => {
      doc.on("end", () => resolve());
      doc.on("error", (error) => reject(error));

      const fontPath = resolvePdfFontPath();
      if (!fontPath) {
        reject(
          new Error(
            "PDF 한글 폰트를 찾지 못했습니다. PDF_FONT_PATH를 설정하거나 컨테이너에 CJK 폰트를 설치해 주세요."
          )
        );
        return;
      }
      doc.font(fontPath);

      if (kind === "script" || kind === "bundle") {
        drawScriptPreviewPdf(doc, detail);
      }

      if (kind === "bundle") {
        doc.addPage();
      }

      if (kind === "minutes" || kind === "bundle") {
        drawMinutesPreviewPdf(doc, detail);
      }

      doc.end();
    });

    const buffer = Buffer.concat(chunks);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    );
    res.status(200).send(buffer);
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};
