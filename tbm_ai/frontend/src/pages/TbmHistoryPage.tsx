import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/apiClient";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import NavigateBeforeRoundedIcon from "@mui/icons-material/NavigateBeforeRounded";
import NavigateNextRoundedIcon from "@mui/icons-material/NavigateNextRounded";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import TextField from "@mui/material/TextField";

const pageBg = "#ffffff";
const pageGradient = "linear-gradient(180deg, #ffffff 0%, #ffffff 100%)";
const panelBg = "#ffffff";
const panelBorder = "#a7ddf4";
const panelText = "#11344a";
const mutedText = "#5f7482";
const inputBg = "#f7fdff";
const tableBg = "#ffffff";
const tableHeaderBg = "#bfdbfe";
const rowStripeBg = "#f8fbff";
const rowHoverBg = "#eff6ff";
const accentBlue = "#2563eb";
const accentBlueHover = "#1d4ed8";
const errorColor = "#dc2626";
const darkNavyText = "#ffffff";

type WorkTypeOption = {
  code: string;
  name: string;
};

type SiteOption = {
  siteId: number;
  siteName: string;
};

type CodeOptionsResponse = {
  ok?: boolean;
  workTypes?: WorkTypeOption[];
  riskLevels?: string[];
};

type TbmHistoryRow = {
  id: number;
  title: string;
  workType: string;
  permitType: string;
  risk: string;
  workDate: string;
  location: string;
  signed?: boolean;
  createdAt: string;
};

type TbmSignatureData = {
  checklist: Record<string, boolean>;
  workerSignature: string;
  supervisorSignature: string;
  signedAt: string | null;
};

type SignatureKind = "worker" | "supervisor";

type TbmHistoryListResponse = {
  ok?: boolean;
  rows?: TbmHistoryRow[];
  totalCount?: number;
  message?: string;
};

type TbmHistoryDetailResponse = {
  ok?: boolean;
  row?: {
    id: number;
    title: string;
    draftText: string;
    signature?: TbmSignatureData;
  };
  message?: string;
};

const SIGNATURE_CHECKLIST_ITEMS = ["PPE 확인", "LOTO 확인", "위험요인 숙지"] as const;
const EMPTY_SIGNATURE: TbmSignatureData = {
  checklist: {},
  workerSignature: "",
  supervisorSignature: "",
  signedAt: null
};

const riskChipStyle: Record<string, { color: string; borderColor: string; bgcolor: string }> = {
  HIGH: { color: "#dc2626", borderColor: "#fecaca", bgcolor: "#fef2f2" },
  MEDIUM: { color: "#b45309", borderColor: "#fde68a", bgcolor: "#fffbeb" },
  LOW: { color: "#047857", borderColor: "#a7f3d0", bgcolor: "#ecfdf5" },
  CRITICAL: { color: "#7f1d1d", borderColor: "#fca5a5", bgcolor: "#fee2e2" }
};

const normalizeRiskLevel = (
  value: string
): "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" => {
  const normalized = value.trim().toUpperCase();

  if (normalized === "CRITICAL" || normalized === "최상") return "CRITICAL";
  if (normalized === "HIGH" || normalized === "상") return "HIGH";
  if (normalized === "MEDIUM" || normalized === "중") return "MEDIUM";
  if (normalized === "LOW" || normalized === "하") return "LOW";

  return "MEDIUM";
};

const tableHeadCellSx = {
  fontWeight: 700,
  fontSize: 12,
  color: mutedText,
  bgcolor: tableHeaderBg,
  textAlign: "center" as const,
  py: 0.5,
  borderBottom: `1px solid ${panelBorder}`,
  whiteSpace: "nowrap" as const
};

const tableBodyCellSx = {
  fontSize: 12,
  color: panelText,
  py: 0.35,
  borderBottom: `1px solid ${panelBorder}`
};

const badgeChipSx = {
  fontWeight: 700,
  fontSize: 10,
  height: 20,
  minWidth: 64,
  borderRadius: 0
};

const controlSx = {
  height: 32,
  bgcolor: inputBg,
  color: panelText,
  fontSize: 12,
  borderRadius: 0,
  "& .MuiOutlinedInput-notchedOutline": { borderColor: panelBorder },
  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: accentBlue },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: accentBlue },
  "& .MuiSvgIcon-root": { color: panelText }
};

const menuPaperSx = {
  bgcolor: panelBg,
  color: panelText,
  border: `1px solid ${panelBorder}`,
  "& .MuiMenuItem-root": { color: panelText, fontSize: 12 },
  "& .MuiMenuItem-root.Mui-selected": { bgcolor: rowHoverBg },
  "& .MuiMenuItem-root:hover": { bgcolor: "#eff6ff" }
};

type PreviewSection = {
  title: string;
  subtitle?: string;
  content: string;
};

const SCRIPT_TEMPLATE: Array<Omit<PreviewSection, "content">> = [
  { title: "인사" },
  { title: "건강" },
  { title: "작업" },
  { title: "위험" },
  { title: "조치" },
  { title: "사례" },
  { title: "의견" },
  { title: "비상" },
  { title: "지적확인" }
];

const PREVIEW_SECTION_ALIAS_MAP: Record<string, string[]> = {
  인사: [
    "1. 인사",
    "1. 작업장소 이동",
    "작업장소 이동(인사/체조)",
    "작업장소 이동 (인사/체조)",
    "작업장소 이동 (체조 및 스트레칭)",
    "작업장소 이동"
  ],
  건강: ["2. 건강", "2. 건강상태 확인", "건강상태 확인", "건강상태"],
  작업: ["3. 작업", "3. 작업내용 공유", "작업내용 공유", "작업내용", "작업내용, 위험요인, 작업절차 확인"],
  위험: ["4. 위험", "4. 핵심 위험요인", "핵심 위험요인", "잠재위험요인"],
  조치: ["5. 조치", "5. 안전조치 확인", "안전조치 확인", "보호구 착용상태 확인", "보호구", "PPE"],
  사례: ["6. 사례", "6. 유사 사고사례", "유사 사고사례", "유사 사고 사례", "사고사례", "중점위험요인"],
  의견: ["7. 의견", "7. 의견 및 질의응답", "의견 및 질의응답", "질의응답", "질의 응답", "Q&A", "작업 후 종료 미팅"],
  비상: ["8. 비상", "8. 비상대피요령", "비상대피요령", "비상대피", "비상 시 대피요령", "대피"],
  지적확인: ["9. 지적확인", "숙지여부 확인", "속지여부 확인", "참석자 확인"]
};

const normalizePreviewLabel = (value: string): string => {
  return value
    .trim()
    .replace(/^#{1,6}\s*/, "")       // ### 제목 표시 제거
    .replace(/^\d+[.)]\s*/, "")      // 4. 또는 4) 제거
    .replace(/^[-*•■▪▶]+\s*/, "")    // 글머리 기호 제거
    .replace(/[：:]\s*$/, "")         // 제목 끝의 : 제거
    .replace(/\s+/g, "")              // 띄어쓰기 제거
    .toLowerCase();
};

const extractPrimaryScriptText = (draft: string): string => {
  const startMarker = "## 2. TBM 대본(생성 결과)";
  const endMarkers = [
    "\n=== 구분선 ===",
    "\n# TBM 회의록",
    "\n## 1. 회의 개요",
    "\n### Safety Logic Check",
    "\n### 기상 특보 대응",
    "\n### PPE 체크리스트",
    "\n### 체크리스트/서명",
    "\n### RAG 근거"
  ];

  let body = draft;
  const startIndex = draft.indexOf(startMarker);
  if (startIndex >= 0) {
    body = draft.slice(startIndex + startMarker.length).trim();
  }

  let endIndex = body.length;
  endMarkers.forEach((marker) => {
    const index = body.indexOf(marker);
    if (index >= 0 && index < endIndex) {
      endIndex = index;
    }
  });

  return body.slice(0, endIndex).trim();
};

const detectPreviewSectionIndex = (line: string): number => {
  const normalizedLine = normalizePreviewLabel(line);

  if (!normalizedLine) {
    return -1;
  }

  return SCRIPT_TEMPLATE.findIndex((section) => {
    const candidates = [section.title, ...(PREVIEW_SECTION_ALIAS_MAP[section.title] ?? [])];

    return candidates.some((candidate) => normalizedLine === normalizePreviewLabel(candidate));
  });
};

const toPoliteControlSentence = (value: string): string => {
  const phrase = value.trim().replace(/[.!?。]+$/g, "");
  if (!phrase) return "";
  if (/(합니다|바랍니다|습니까)$/.test(phrase)) return `${phrase}.`;
  const controlMap: Record<string, string> = {
    "작업장 주변 인화물 제거": "작업장 주변 인화물을 제거해 주시기 바랍니다.",
    "소화기 2대 이상 비치": "소화기 2대 이상을 비치해 주시기 바랍니다.",
    "화기감시자 배치": "화기감시자를 배치해 주시기 바랍니다.",
    "작업 후 잔불 확인": "작업 후 잔불을 확인해 주시기 바랍니다.",
    "전원 차단 및 LOTO 실시": "전원을 차단하고 LOTO를 실시해 주시기 바랍니다.",
    "검전기로 무전압 확인": "검전기로 무전압 상태를 확인해 주시기 바랍니다.",
    "절연보호구 착용": "절연보호구를 착용해 주시기 바랍니다.",
    "접지 상태 확인": "접지 상태를 확인해 주시기 바랍니다."
  };
  if (controlMap[phrase]) return controlMap[phrase];
  if (/(확인|착용|배치|비치|제거|실시)$/.test(phrase)) return `${phrase}해 주시기 바랍니다.`;
  return `${phrase}을 확인해 주시기 바랍니다.`;
};

const normalizeControlListTone = (value: string): string => {
  const parts = value
    .split(/[;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length <= 1) return value;
  return parts.map(toPoliteControlSentence).filter(Boolean).join(" ");
};

const normalizeTbmSpeechTone = (value: string): string =>
  normalizeControlListTone(value)
    .replace(/화재 관련 화재/g, "화재 위험")
    .replace(/감전 관련 감전/g, "감전 위험")
    .replace(/보고되었다/g, "보고되었습니다")
    .replace(/발생했다/g, "발생했습니다")
    .replace(/사망했다/g, "사망했습니다")
    .replace(/부상을 입었다/g, "부상을 입었습니다")
    .replace(/화상을 입었다/g, "화상을 입었습니다")
    .replace(/있음/g, "있습니다")
    .replace(/필요하다/g, "필요합니다")
    .replace(/해야 한다/g, "해야 합니다")
    .replace(/하여야 한다/g, "해야 합니다")
    .replace(/([가-힣]+)한다(?=[.!?]|$)/g, "$1합니다")
    .replace(/있다(?=[.!?]|$)/g, "있습니다")
    .replace(/된다(?=[.!?]|$)/g, "됩니다")
    .replace(/이다(?=[.!?]|$)/g, "입니다");

const buildPreviewSections = (draft: string): PreviewSection[] => {
  const trimmed = extractPrimaryScriptText(draft).trim();
  if (!trimmed) {
    return [];
  }

  const buckets = SCRIPT_TEMPLATE.map(() => [] as string[]);
  let activeIndex: number | null = null;

  trimmed.split("\n").forEach((rawLine) => {
    const nextIndex = detectPreviewSectionIndex(rawLine);
    if (nextIndex >= 0) {
      activeIndex = nextIndex;
      return;
    }
    if (/^#{1,6}\s/.test(rawLine.replace(/^>+\s*/, ""))) {
      activeIndex = null;
      return;
    }
    if (activeIndex !== null) {
      buckets[activeIndex].push(rawLine.trimEnd());
    }
  });

  const parsed = SCRIPT_TEMPLATE.map((section, index) => ({
    ...section,
    content: normalizeTbmSpeechTone(buckets[index].join("\n").trim())
  })).filter((section) => section.content);

  return parsed.length > 0
    ? parsed
    : [{ title: "TBM 대본", content: normalizeTbmSpeechTone(trimmed) }];
};

const downloadWithAuth = async (path: string, fallbackFilename: string) => {
  const response = await apiFetch(path);
  if (!response.ok) {
    throw new Error("다운로드에 실패했습니다.");
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename\*=UTF-8''([^;]+)/);
  const filename = match ? decodeURIComponent(match[1]) : fallbackFilename;

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
};

function TbmHistoryPage() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [workType, setWorkType] = useState("all");
  const [risk, setRisk] = useState("all");
  const [selectedSite, setSelectedSite] = useState("all");
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);
  const [workTypeOptions, setWorkTypeOptions] = useState<WorkTypeOption[]>([]);
  const [riskOptions, setRiskOptions] = useState<string[]>([]);
  const [rows, setRows] = useState<TbmHistoryRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewHistoryId, setViewHistoryId] = useState<number | null>(null);
  const [viewTitle, setViewTitle] = useState("");
  const [viewText, setViewText] = useState("");

  const [viewSections, setViewSections] = useState<PreviewSection[]>([]);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaveMessage, setDraftSaveMessage] = useState("");

  const [signatureChecklistChecks, setSignatureChecklistChecks] = useState<Record<string, boolean>>(
    {}
  );
  const [workerSignature, setWorkerSignature] = useState("");
  const [supervisorSignature, setSupervisorSignature] = useState("");
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [signatureSaveMessage, setSignatureSaveMessage] = useState("");
  const workerSignatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const supervisorSignatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeSignatureRef = useRef<SignatureKind | null>(null);
  const lastSignaturePointRef = useRef<{ x: number; y: number } | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const pageCount = Math.max(1, Math.ceil(totalCount / rowsPerPage));
  const currentPage = Math.min(page, pageCount - 1);
  type PaginationItem = number | "ellipsis-start" | "ellipsis-end";

  //페이지네이션
  const paginationItems: PaginationItem[] = (() => {
    // 페이지가 7개 이하일 때는 전부 표시
    if (pageCount <= 7) {
      return Array.from({ length: pageCount }, (_, index) => index + 1);
    }

    const activePage = currentPage + 1;

    // 앞쪽 페이지
    if (activePage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis-end", pageCount];
    }

    // 뒤쪽 페이지
    if (activePage >= pageCount - 3) {
      return [
        1,
        "ellipsis-start",
        pageCount - 4,
        pageCount - 3,
        pageCount - 2,
        pageCount - 1,
        pageCount
      ];
    }

    // 중간 페이지
    return [
      1,
      "ellipsis-start",
      activePage - 1,
      activePage,
      activePage + 1,
      "ellipsis-end",
      pageCount
    ];
  })();

  useEffect(() => {
    const loadCodeOptions = async () => {
      try {
        const response = await apiFetch(`/code/options`);
        const result = (await response.json()) as CodeOptionsResponse;
        if (!response.ok || !result.ok) {
          setWorkTypeOptions([]);
          setRiskOptions([]);
          return;
        }
        setWorkTypeOptions(Array.isArray(result.workTypes) ? result.workTypes : []);
        setRiskOptions(Array.isArray(result.riskLevels) ? result.riskLevels : []);
      } catch {
        setWorkTypeOptions([]);
        setRiskOptions([]);
      }
    };
    void loadCodeOptions();
  }, []);

  useEffect(() => {
    const loadSiteOptions = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);

        const params = new URLSearchParams({
          date: today
        });

        const response = await apiFetch(
          `/dashboard/summary?${params.toString()}`
        );

        const result = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          siteOptions?: SiteOption[];
          message?: string;
        };

        if (!response.ok || !result.ok) {
          setSiteOptions([]);
          return;
        }

        setSiteOptions(
          Array.isArray(result.siteOptions)
            ? result.siteOptions
            : []
        );
      } catch {
        setSiteOptions([]);
      }
    };

    void loadSiteOptions();
  }, []);

  const loadRows = async () => {
    setIsLoadingRows(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(rowsPerPage)
      });
      if (workType !== "all") {
        params.set("workType", workType);
      }

      if (risk !== "all") {
        params.set("risk", risk);
      }

      if (selectedSite !== "all") {
        params.set("search", selectedSite);
      }

      const response = await apiFetch(`/tbm/history-list?${params.toString()}`);
      const result = (await response.json().catch(() => ({}))) as TbmHistoryListResponse;
      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "TBM 이력을 불러오지 못했습니다.");
      }
      setRows(Array.isArray(result.rows) ? result.rows : []);
      setTotalCount(typeof result.totalCount === "number" ? result.totalCount : 0);
    } catch (error) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage((error as Error).message);
    } finally {
      setIsLoadingRows(false);
    }
  };

  useEffect(() => {
    void loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage, workType, risk, selectedSite]);

  const getSignatureCanvas = (kind: SignatureKind): HTMLCanvasElement | null =>
    kind === "worker" ? workerSignatureCanvasRef.current : supervisorSignatureCanvasRef.current;

  const getSignatureValue = (kind: SignatureKind): string =>
    kind === "worker" ? workerSignature : supervisorSignature;

  const setSignatureValue = (kind: SignatureKind, value: string) => {
    if (kind === "worker") {
      setWorkerSignature(value);
      return;
    }
    setSupervisorSignature(value);
  };

  const buildSignaturePayload = (override: Partial<TbmSignatureData> = {}): TbmSignatureData => ({
    checklist: override.checklist ?? signatureChecklistChecks,
    workerSignature: override.workerSignature ?? workerSignature,
    supervisorSignature: override.supervisorSignature ?? supervisorSignature,
    signedAt: override.signedAt ?? new Date().toISOString()
  });

  const saveSignaturePayload = async (
    payload: TbmSignatureData
  ): Promise<boolean> => {
    if (!viewHistoryId) {
      return false;
    }

    setIsSavingSignature(true);
    setSignatureSaveMessage("서명 저장 중...");
    setErrorMessage("");

    try {
      const response = await apiFetch(
        `/tbm/history/${viewHistoryId}/signature`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message ?? "서명 저장에 실패했습니다."
        );
      }

      setSignatureSaveMessage("서명 저장됨");

      setRows((prev) =>
        prev.map((row) =>
          row.id === viewHistoryId
            ? {
              ...row,
              signed: Boolean(
                payload.workerSignature ||
                payload.supervisorSignature
              )
            }
            : row
        )
      );

      return true;
    } catch (error) {
      setSignatureSaveMessage("");

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "서명 저장에 실패했습니다."
      );

      return false;
    } finally {
      setIsSavingSignature(false);
    }
  };

  const handleSignatureChecklistChange = (item: string, checked: boolean) => {
    const nextChecklist = { ...signatureChecklistChecks, [item]: checked };
    setSignatureChecklistChecks(nextChecklist);
    void saveSignaturePayload(buildSignaturePayload({ checklist: nextChecklist }));
  };

  const prepareSignatureCanvas = (kind: SignatureKind, value = getSignatureValue(kind)) => {
    const canvas = getSignatureCanvas(kind);
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.floor(rect.width));
    const cssHeight = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.floor(cssWidth * dpr);
    const pixelHeight = Math.floor(cssHeight * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resized = canvas.width !== pixelWidth || canvas.height !== pixelHeight;
    if (resized) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = panelText;

    if (!value) {
      ctx.clearRect(0, 0, cssWidth, cssHeight);
      return;
    }

    if (resized) {
      const image = new Image();
      image.onload = () => {
        const restoreCtx = canvas.getContext("2d");
        if (!restoreCtx) return;
        restoreCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        restoreCtx.clearRect(0, 0, cssWidth, cssHeight);
        restoreCtx.drawImage(image, 0, 0, cssWidth, cssHeight);
      };
      image.src = value;
    }
  };

  const getSignaturePoint = (
    canvas: HTMLCanvasElement,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  };

  const handleSignaturePointerDown = (
    kind: SignatureKind,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (viewLoading || isSavingSignature || !isSignatureEditing(kind)
    ) { return; }
    const canvas = getSignatureCanvas(kind);
    if (!canvas) return;

    prepareSignatureCanvas(kind);
    canvas.setPointerCapture(event.pointerId);
    activeSignatureRef.current = kind;
    lastSignaturePointRef.current = getSignaturePoint(canvas, event);
    event.preventDefault();
  };

  const handleSignaturePointerMove = (
    kind: SignatureKind,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (activeSignatureRef.current !== kind || viewLoading || isSavingSignature || !isSignatureEditing(kind)
    ) { return; }
    const canvas = getSignatureCanvas(kind);
    const previousPoint = lastSignaturePointRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !previousPoint) return;

    const nextPoint = getSignaturePoint(canvas, event);
    ctx.beginPath();
    ctx.moveTo(previousPoint.x, previousPoint.y);
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.stroke();
    lastSignaturePointRef.current = nextPoint;
    event.preventDefault();
  };

  const handleSignaturePointerUp = (
    kind: SignatureKind,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (activeSignatureRef.current !== kind) return;
    const canvas = getSignatureCanvas(kind);
    if (canvas) {
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }
      const signatureImage = canvas.toDataURL("image/png");
      setSignatureValue(kind, signatureImage);
      setSignatureSaveMessage("");
    }
    activeSignatureRef.current = null;
    lastSignaturePointRef.current = null;
    event.preventDefault();
  };

  //서명
  const handleEditSignature = (kind: SignatureKind) => {
    setEditingSignatures((prev) => ({
      ...prev,
      [kind]: true
    }));

    setSignatureSaveMessage("");
  };

  //서명
  const handleSaveSignature = async (
    kind: SignatureKind
  ) => {
    const signatureValue = getSignatureValue(kind);

    if (!signatureValue) {
      setSignatureSaveMessage("서명을 입력해 주세요.");
      return;
    }

    const saved = await saveSignaturePayload(
      buildSignaturePayload(
        kind === "worker"
          ? {
            workerSignature: signatureValue
          }
          : {
            supervisorSignature: signatureValue
          }
      )
    );

    if (!saved) {
      return;
    }

    setEditingSignatures((prev) => ({
      ...prev,
      [kind]: false
    }));
  };

  const clearSignature = (kind: SignatureKind) => {
    const canvas = getSignatureCanvas(kind);
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
    setSignatureValue(kind, "");
    setSignatureSaveMessage("");
  };

  //서명
  const [editingSignatures, setEditingSignatures] = useState<
    Record<SignatureKind, boolean>
  >({
    worker: true,
    supervisor: true
  });

  useEffect(() => {
    if (!viewOpen || viewLoading) return;

    const prepareCanvases = () => {
      prepareSignatureCanvas("worker", workerSignature);
      prepareSignatureCanvas("supervisor", supervisorSignature);
    };

    const animationFrameId = window.requestAnimationFrame(prepareCanvases);
    window.addEventListener("resize", prepareCanvases);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", prepareCanvases);
    };
  }, [viewOpen, viewLoading, workerSignature, supervisorSignature]);

  const handleView = async (id: number) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewHistoryId(id);
    setViewTitle("");
    setViewText("");
    setViewSections([]);
    setDraftSaveMessage("");
    setSignatureChecklistChecks({});
    setWorkerSignature("");
    setSupervisorSignature("");
    setSignatureSaveMessage("");
    try {
      const response = await apiFetch(`/tbm/history/${id}`);
      const result = (await response.json().catch(() => ({}))) as TbmHistoryDetailResponse;
      if (!response.ok || !result.ok || !result.row) {
        throw new Error(result.message ?? "TBM 상세 내용을 불러오지 못했습니다.");
      }
      setViewTitle(result.row.title);
      setViewText(result.row.draftText);
      setViewSections(buildPreviewSections(result.row.draftText));
      const signature = result.row.signature ?? EMPTY_SIGNATURE;
      setSignatureChecklistChecks(signature.checklist ?? {});
      const loadedWorkerSignature = signature.workerSignature ?? "";
      const loadedSupervisorSignature =
        signature.supervisorSignature ?? "";

      setWorkerSignature(loadedWorkerSignature);
      setSupervisorSignature(loadedSupervisorSignature);

      setEditingSignatures({
        worker: !loadedWorkerSignature,
        supervisor: !loadedSupervisorSignature
      });
    } catch (error) {
      setViewText((error as Error).message);
    } finally {
      setViewLoading(false);
    }
  };

  //서명
  const isSignatureEditing = (kind: SignatureKind) =>
    editingSignatures[kind];

  const getSectionLines = (content: string): string[] => {
    const lines = content
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    return lines.length > 0 ? lines : [""];
  };

  const handleViewLineChange = (
    sectionIndex: number,
    lineIndex: number,
    value: string
  ) => {
    setViewSections((prev) =>
      prev.map((section, index) => {
        if (index !== sectionIndex) {
          return section;
        }

        const lines = getSectionLines(section.content);

        lines[lineIndex] = value;

        return {
          ...section,
          content: lines.join("\n")
        };
      })
    );

    setDraftSaveMessage("");
  };

  const handleDownload = async (id: number, kind: "pdf" | "docx") => {
    setDownloadingId(id);
    try {
      if (kind === "pdf") {
        await downloadWithAuth(`/tbm/history/${id}/pdf?kind=script`, `tbm-${id}-script.pdf`);
      } else {
        await downloadWithAuth(
          `/tbm/history/${id}/document?kind=script&format=docx`,
          `tbm-${id}-script.docx`
        );
      }
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setDownloadingId(null);
    }
  };

  const buildEditedDraftText = (sections: PreviewSection[]): string => {
    return sections
      .map((section, index) => {
        const subtitle = section.subtitle ? ` ${section.subtitle}` : "";

        return `### ${index + 1}. ${section.title}${subtitle}
  ${section.content.trim()}`;
      })
      .join("\n\n")
      .trim();
  };

  const handleSaveDraft = async () => {
    if (viewHistoryId === null) return;

    const editedScriptText = buildEditedDraftText(viewSections);

    if (!editedScriptText.trim()) {
      setDraftSaveMessage("저장할 대본 내용이 없습니다.");
      return;
    }

    setIsSavingDraft(true);
    setDraftSaveMessage("수정 내용 저장 중...");

    try {
      const startMarker = "## 2. TBM 대본(생성 결과)";
      const endMarkers = [
        "\n=== 구분선 ===",
        "\n# TBM 회의록",
        "\n## 1. 회의 개요",
        "\n### Safety Logic Check",
        "\n### 기상 특보 대응",
        "\n### PPE 체크리스트",
        "\n### 체크리스트/서명",
        "\n### RAG 근거"
      ];

      let updatedDraftText = editedScriptText;

      const startIndex = viewText.indexOf(startMarker);

      if (startIndex >= 0) {
        const contentStartIndex = startIndex + startMarker.length;

        let contentEndIndex = viewText.length;

        endMarkers.forEach((marker) => {
          const markerIndex = viewText.indexOf(marker, contentStartIndex);

          if (markerIndex >= 0 && markerIndex < contentEndIndex) {
            contentEndIndex = markerIndex;
          }
        });

        const beforeScript = viewText.slice(0, contentStartIndex);
        const afterScript = viewText.slice(contentEndIndex);

        updatedDraftText =
          `${beforeScript}\n\n${editedScriptText}${afterScript}`.trim();
      }

      const response = await apiFetch(
        `/tbm/history/${viewHistoryId}/draft`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            draftText: updatedDraftText
          })
        }
      );

      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
        row?: {
          draftText?: string;
        };
      };

      if (!response.ok || !result.ok) {
        throw new Error(
          result.message ?? "수정 내용 저장에 실패했습니다."
        );
      }

      const savedDraftText =
        result.row?.draftText ?? updatedDraftText;

      setViewText(savedDraftText);
      setViewSections(buildPreviewSections(savedDraftText));
      setDraftSaveMessage("수정 내용이 저장되었습니다.");
    } catch (error) {
      setDraftSaveMessage(
        error instanceof Error
          ? error.message
          : "수정 내용 저장에 실패했습니다."
      );
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDelete = async () => {
    if (deleteTargetId === null) return;
    setIsDeleting(true);
    try {
      const response = await apiFetch(`/tbm/history/${deleteTargetId}`, { method: "DELETE" });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "삭제에 실패했습니다.");
      }
      setDeleteTargetId(null);
      await loadRows();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderSignaturePad = (kind: SignatureKind, label: string) => (
    <Box
      sx={{
        p: {
          xs: 1,
          sm: 0.9
        },

        borderRight: {
          xs: "none",
          sm:
            kind === "worker"
              ? `1px solid ${panelBorder}`
              : "none"
        },

        borderBottom: {
          xs:
            kind === "worker"
              ? `1px solid ${panelBorder}`
              : "none",
          sm: "none"
        }
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 0.7
        }}
      >
        <Typography
          sx={{
            fontSize: 13,
            fontWeight: 700,
            color: panelText,
            whiteSpace: "nowrap"
          }}
        >
          {label}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          {isSignatureEditing(kind) ? (
            <>
              <Button
                size="small"
                variant="outlined"
                onClick={() => clearSignature(kind)}
                disabled={
                  viewLoading ||
                  isSavingSignature ||
                  !getSignatureValue(kind)
                }
                sx={{
                  minWidth: 54,
                  px: 0.8,
                  py: 0.2,
                  fontSize: 11,
                  color: panelText,
                  borderColor: panelBorder,
                  borderRadius: 0,
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  "&:hover": {
                    borderColor: accentBlue,
                    bgcolor: "#eff6ff"
                  }
                }}
              >
                지우기
              </Button>

              <Button
                size="small"
                variant="contained"
                onClick={() => void handleSaveSignature(kind)}
                disabled={
                  viewLoading ||
                  isSavingSignature ||
                  !getSignatureValue(kind)
                }
                sx={{
                  minWidth: 54,
                  px: 0.8,
                  py: 0.2,
                  fontSize: 11,
                  bgcolor: accentBlue,
                  borderRadius: 0,
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  "&:hover": {
                    bgcolor: accentBlueHover
                  }
                }}
              >
                저장
              </Button>
            </>
          ) : (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleEditSignature(kind)}
              disabled={viewLoading || isSavingSignature}
              sx={{
                minWidth: 64,
                px: 0.8,
                py: 0.2,
                fontSize: 11,
                color: panelText,
                borderColor: panelBorder,
                borderRadius: 0,
                whiteSpace: "nowrap",
                textTransform: "none",
                "&:hover": {
                  borderColor: accentBlue,
                  bgcolor: "#eff6ff"
                }
              }}
            >
              수정하기
            </Button>
          )}
        </Box>
      </Box>
      <Box
        sx={{
          position: "relative",
          height: 112,
          border: `1px solid ${panelBorder}`,
          bgcolor: inputBg,
          overflow: "hidden"
        }}
      >
        {!getSignatureValue(kind) ? (
          <Typography
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: mutedText,
              fontSize: 12,
              pointerEvents: "none"
            }}
          >
            이 영역에 직접 서명해 주세요.
          </Typography>
        ) : null}
        <canvas
          ref={kind === "worker" ? workerSignatureCanvasRef : supervisorSignatureCanvasRef}
          onPointerDown={(event) => handleSignaturePointerDown(kind, event)}
          onPointerMove={(event) => handleSignaturePointerMove(kind, event)}
          onPointerUp={(event) => handleSignaturePointerUp(kind, event)}
          onPointerCancel={(event) => handleSignaturePointerUp(kind, event)}
          style={{
            position: "relative",
            width: "100%",
            height: "112px",
            display: "block",
            cursor: viewLoading || isSavingSignature || !isSignatureEditing(kind)
              ? "default" : "crosshair", touchAction: "none"
          }}
        />
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,

        minHeight: "100%",
        bgcolor: pageBg,
        backgroundImage: pageGradient,

        px: {
          xs: 1,
          sm: 2.5
        },
        py: 1.75,

        boxSizing: "border-box",

        overflowX: "hidden",
        overflowY: "auto",

        display: "flex",
        flexDirection: "column"
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Typography variant="h2" sx={{ fontSize: 20, m: 0, color: panelText, fontWeight: 800 }}>
          TBM 이력 관리
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          flexShrink: 0,
          borderRadius: 0,
          border: `1px solid ${panelBorder}`,
          bgcolor: panelBg,
          display: "flex",
          flexDirection: "column",
          overflow: "visible"
        }}
      >
        <Box
          sx={{
            px: {
              xs: 1,
              sm: 1.5
            },
            py: 1,
            borderBottom: `1px solid ${panelBorder}`,

            display: "flex",
            flexDirection: {
              xs: "column",
              sm: "row"
            },

            gap: 1,
            alignItems: {
              xs: "stretch",
              sm: "flex-end"
            },

            flexWrap: {
              xs: "nowrap",
              sm: "wrap"
            }
          }}
        >
          <Box
            sx={{
              width: { xs: "100%", sm: 160 },
              minWidth: { xs: 0, sm: 160 }
            }}
          >
            <Typography sx={{ fontSize: 11, color: mutedText, mb: 0.35 }}>작업유형</Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={workType}
                onChange={(event) => {
                  setWorkType(event.target.value);
                  setPage(0);
                }}
                sx={controlSx}
                MenuProps={{ slotProps: { paper: { sx: menuPaperSx } } }}
              >
                <MenuItem value="all">전체</MenuItem>
                {workTypeOptions.map((item) => (
                  <MenuItem key={item.code} value={item.name}>
                    {item.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box
            sx={{
              width: { xs: "100%", sm: 160 },
              minWidth: { xs: 0, sm: 160 }
            }}
          >
            <Typography sx={{ fontSize: 11, color: mutedText, mb: 0.35 }}>위험등급</Typography>
            <FormControl size="small" fullWidth>
              <Select
                value={risk}
                onChange={(event) => {
                  setRisk(event.target.value);
                  setPage(0);
                }}
                sx={controlSx}
                MenuProps={{ slotProps: { paper: { sx: menuPaperSx } } }}
              >
                <MenuItem value="all">전체</MenuItem>
                {riskOptions.map((item) => (
                  <MenuItem key={item} value={item}>
                    {normalizeRiskLevel(item)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box
            sx={{
              width: { xs: "100%", sm: 220 },
              minWidth: { xs: 0, sm: 220 }
            }}
          >
            <Typography
              sx={{
                fontSize: 11,
                color: mutedText,
                mb: 0.35
              }}
            >
              작업장소
            </Typography>

            <FormControl size="small" fullWidth>
              <Select
                value={selectedSite}
                onChange={(event) => {
                  setSelectedSite(event.target.value);
                  setPage(0);
                }}
                sx={controlSx}
                MenuProps={{
                  slotProps: {
                    paper: {
                      sx: menuPaperSx
                    }
                  }
                }}
              >
                <MenuItem value="all">전체</MenuItem>

                {siteOptions.map((site) => (
                  <MenuItem
                    key={site.siteId}
                    value={site.siteName}
                  >
                    {site.siteName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshRoundedIcon sx={{ fontSize: 14 }} />}
            onClick={() => {
              setWorkType("all");
              setRisk("all");
              setSelectedSite("all");
              setPage(0);
            }}
            sx={{
              width: { xs: "100%", sm: "auto" },
              height: 32,
              borderColor: panelBorder,
              color: panelText,
              fontSize: 12,
              px: 1.1,
              borderRadius: 0,
              "&:hover": { borderColor: accentBlue, bgcolor: "#eff6ff" }
            }}
          >
            초기화
          </Button>
        </Box>

        <Box sx={{ px: 1.5, py: 0.75, borderBottom: `1px solid ${panelBorder}` }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: panelText }}>
            생성된 TBM 목록 {totalCount > 0 ? `(총 ${totalCount}건)` : ""}
          </Typography>
        </Box>

        {errorMessage ? (
          <Box sx={{ px: 1.5, py: 1 }}>
            <Typography sx={{ fontSize: 12, color: errorColor }}>{errorMessage}</Typography>
          </Box>
        ) : null}

        <TableContainer
          sx={{
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,

            overflowX: "auto",
            overflowY: "hidden",

            px: {
              xs: 0.75,
              sm: 1.5
            },
            py: 0.75,

            boxSizing: "border-box",
            WebkitOverflowScrolling: "touch"
          }}
        >
          <Paper
            elevation={0}
            sx={{
              borderRadius: 0,
              border: `1px solid ${panelBorder}`,
              bgcolor: tableBg,
              width: "max-content",
              minWidth: "100%"
            }}
          >
            <Table
              size="small"
              sx={{
                minWidth: 850
              }}
            >
              <TableHead>
                <TableRow>
                  {[
                    "생성일시",
                    "작업유형",
                    "허가유형",
                    "위험등급",
                    "작업장소",
                    "작업일",
                    "서명",
                    "작업"
                  ].map((col) => (
                    <TableCell key={col} sx={tableHeadCellSx}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => void handleView(row.id)}
                    sx={{
                      "&:hover": { bgcolor: rowHoverBg },
                      bgcolor: idx % 2 ? rowStripeBg : "transparent",
                      cursor: "pointer"
                    }}
                  >
                    <TableCell align="center" sx={tableBodyCellSx}>
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString("ko-KR") : "-"}
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      {row.workType}
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      {row.permitType}
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      <Chip
                        label={normalizeRiskLevel(row.risk)}
                        variant="outlined"
                        size="small"
                        sx={{ ...badgeChipSx, ...riskChipStyle[normalizeRiskLevel(row.risk)] }}
                      />
                    </TableCell>
                    <TableCell sx={tableBodyCellSx}>{row.location}</TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      {row.workDate}
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      <Chip
                        label={row.signed ? "서명됨" : "미서명"}
                        variant="outlined"
                        size="small"
                        sx={{
                          ...badgeChipSx,
                          minWidth: 58,
                          color: row.signed ? "#047857" : mutedText,
                          borderColor: row.signed ? "#a7f3d0" : panelBorder,
                          bgcolor: row.signed ? "#ecfdf5" : "#f8fbff"
                        }}
                      />
                    </TableCell>
                    <TableCell align="center" sx={tableBodyCellSx}>
                      <Box sx={{ display: "flex", justifyContent: "center", gap: 0.25 }}>
                        <IconButton
                          size="small"
                          sx={{ color: mutedText }}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleView(row.id);
                          }}
                          title="대본 보기"
                        >
                          <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: mutedText }}
                          disabled={downloadingId === row.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDownload(row.id, "pdf");
                          }}
                          title="PDF 다운로드"
                        >
                          <PictureAsPdfOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: mutedText }}
                          disabled={downloadingId === row.id}
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDownload(row.id, "docx");
                          }}
                          title="DOCX 다운로드"
                        >
                          <DescriptionOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          sx={{ color: errorColor }}
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteTargetId(row.id);
                          }}
                          title="삭제"
                        >
                          <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      align="center"
                      sx={{ ...tableBodyCellSx, py: 2, color: mutedText }}
                    >
                      {isLoadingRows ? "불러오는 중입니다..." : "생성된 TBM 이력이 없습니다."}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </Paper>
        </TableContainer>

        <Box
          sx={{
            borderTop: `1px solid ${panelBorder}`,
            px: { xs: 0.5, sm: 1.5 },
            py: 0.75,
            display: "flex",
            alignItems: "center",
            justifyContent: { xs: "center", sm: "space-between" },
            gap: 1,
            overflow: "hidden"
          }}>
          <Box sx={{
            width: 56,
            display: { xs: "none", sm: "block" }
          }} />
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.2,
              flexWrap: "nowrap",
              minWidth: 0
            }}
          >
            <IconButton
              size="small"
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
              sx={{ color: mutedText }}
            >
              <NavigateBeforeRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            {paginationItems.map((item) => {
              if (typeof item !== "number") {
                return (
                  <Typography
                    key={item}
                    sx={{
                      width: 28,
                      minWidth: 28,
                      height: 28,
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      color: mutedText
                    }}
                  >
                    ...
                  </Typography>
                );
              }

              const active = item - 1 === currentPage;

              return (
                <Button
                  key={item}
                  size="small"
                  onClick={() => setPage(item - 1)}
                  sx={{
                    width: 28,
                    minWidth: 28,
                    height: 28,
                    flexShrink: 0,
                    px: 0,
                    fontSize: 12,
                    color: active ? darkNavyText : mutedText,
                    bgcolor: active ? accentBlue : "transparent",
                    border: active
                      ? `1px solid ${accentBlueHover}`
                      : "1px solid transparent",
                    borderRadius: 0,
                    "&:hover": {
                      bgcolor: active ? accentBlueHover : "#eff6ff"
                    }
                  }}
                >
                  {item}
                </Button>
              );
            })}
            <IconButton
              size="small"
              onClick={() => setPage((prev) => Math.min(prev + 1, pageCount - 1))}
              disabled={currentPage >= pageCount - 1}
              sx={{ color: mutedText }}
            >
              <NavigateNextRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <Box
            sx={{
              display: {
                xs: "none",
                sm: "flex"
              },
              alignItems: "center",
              gap: 0.75
            }}
          >
            <FormControl size="small">
              <Select
                value={rowsPerPage}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(0);
                }}
                sx={{
                  height: 30,
                  bgcolor: inputBg,
                  color: panelText,
                  fontSize: 12,
                  minWidth: 80,
                  borderRadius: 0,
                  "& fieldset": { borderColor: panelBorder },
                  "&:hover fieldset": { borderColor: accentBlue },
                  "&.Mui-focused fieldset": { borderColor: accentBlue },
                  "& .MuiSvgIcon-root": { color: panelText }
                }}
                MenuProps={{ slotProps: { paper: { sx: menuPaperSx } } }}
              >
                {[10, 20, 50].map((size) => (
                  <MenuItem key={size} value={size}>
                    {size}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography sx={{ fontSize: 12, color: mutedText }}>/ 페이지</Typography>
          </Box>
        </Box>
      </Paper>

      <Dialog
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              bgcolor: panelBg,
              color: panelText,
              border: `1px solid ${panelBorder}`,
              borderRadius: 0
            }
          }
        }}
      >
        <DialogTitle
          sx={{ fontSize: 17, fontWeight: 700, borderBottom: `1px solid ${panelBorder}` }}
        >
          {viewTitle || "TBM 대본"}
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            borderColor: panelBorder,
            bgcolor: pageBg,

            p: {
              xs: 0,
              sm: 3
            }
          }}
        >
          {viewLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={24} sx={{ color: accentBlue }} />
            </Box>
          ) : (
            <Box
              sx={{
                bgcolor: panelBg,

                border: {
                  xs: "none",
                  sm: `1px solid ${panelBorder}`
                },

                color: panelText,

                p: {
                  xs: 2,
                  sm: 2
                }
              }}
            >
              <Typography
                sx={{
                  textAlign: "center",
                  fontSize: {
                    xs: 20,
                    sm: 24
                  },
                  fontWeight: 800,
                  mb: {
                    xs: 2,
                    sm: 1.25
                  },
                  color: panelText,
                  lineHeight: 1.3,
                  wordBreak: "keep-all"
                }}
              >
                TBM 실행 시나리오
              </Typography>

              <Box sx={{
                border: { xs: "none", sm: `1px solid ${panelBorder}` }
              }}>
                <Box
                  sx={{
                    display: {
                      xs: "none",
                      sm: "grid"
                    },
                    gridTemplateColumns: "180px 1fr",
                    bgcolor: tableHeaderBg,
                    borderBottom: `1px solid ${panelBorder}`
                  }}
                >
                  <Box
                    sx={{
                      p: 0.8,
                      fontSize: 13,
                      fontWeight: 700,
                      borderRight: `1px solid ${panelBorder}`,
                      textAlign: "center"
                    }}
                  >
                    구분
                  </Box>

                  <Box
                    sx={{
                      p: 0.8,
                      fontSize: 13,
                      fontWeight: 700,
                      textAlign: "center"
                    }}
                  >
                    T.B.M 리더 멘트 (수정 가능)
                  </Box>
                </Box>

                {viewSections.map((section, index, sections) => (
                  <Box
                    key={`${section.title}-${index}`}
                    sx={{
                      display: "grid",

                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "180px 1fr"
                      },

                      mb: {
                        xs: 1.5,
                        sm: 0
                      },

                      border: {
                        xs: `1px solid ${panelBorder}`,
                        sm: "none"
                      },

                      borderRadius: {
                        xs: 1,
                        sm: 0
                      },

                      overflow: {
                        xs: "hidden",
                        sm: "visible"
                      },

                      borderBottom: {
                        sm:
                          index === sections.length - 1
                            ? "none"
                            : `1px solid ${panelBorder}`
                      }
                    }}
                  >
                    <Box
                      sx={{
                        p: {
                          xs: 1.25,
                          sm: 0.8
                        },

                        fontSize: {
                          xs: 14,
                          sm: 12.5
                        },

                        fontWeight: 700,

                        borderRight: {
                          xs: "none",
                          sm: `1px solid ${panelBorder}`
                        },

                        borderBottom: {
                          xs: `1px solid ${panelBorder}`,
                          sm: "none"
                        },

                        bgcolor: tableHeaderBg,
                        color: panelText,

                        textAlign: {
                          xs: "left",
                          sm: "center"
                        },

                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: 0.25,

                        wordBreak: "keep-all"
                      }}
                    >
                      <span>{section.title}</span>

                      {section.subtitle ? (
                        <Typography
                          component="span"
                          sx={{
                            fontWeight: 500,
                            fontSize: {
                              xs: 12,
                              sm: "inherit"
                            }
                          }}
                        >
                          {section.subtitle}
                        </Typography>
                      ) : null}
                    </Box>

                    <Box
                      sx={{
                        px: {
                          xs: 0.5,
                          sm: 0.65
                        },
                        py: {
                          xs: 0.75,
                          sm: 0.45
                        },

                        display: "flex",
                        flexDirection: "column",
                        gap: 0.2,
                        bgcolor: inputBg,

                        minWidth: 0,
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box"
                      }}
                    >
                      {getSectionLines(section.content).map(
                        (line, lineIndex) => (
                          <TextField
                            key={`${section.title}-${lineIndex}`}
                            multiline
                            minRows={1}
                            fullWidth
                            value={line}
                            onChange={(event) =>
                              handleViewLineChange(
                                index,
                                lineIndex,
                                event.target.value
                              )
                            }
                            placeholder="AI 생성 멘트가 이 영역에 표시됩니다."
                            disabled={viewLoading || isSavingDraft}
                            sx={{
                              width: "100%",
                              minWidth: 0,
                              maxWidth: "100%",

                              "& .MuiInputBase-root": {
                                bgcolor: "transparent",
                                borderRadius: 1,
                                fontSize: 13,
                                color: panelText,
                                lineHeight: 1.38,
                                fontWeight: 500,
                                p: 0,
                                minWidth: 0,
                                width: "100%"
                              },

                              "& .MuiInputBase-input": {
                                py: 0.15,
                                px: 0,
                                minWidth: 0,
                                fontFamily: "inherit",
                                wordBreak: "keep-all",
                                overflowWrap: "break-word"
                              },

                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "transparent"
                              },

                              "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#bfdbfe"
                              },

                              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                borderColor: accentBlue
                              }
                            }}
                          />
                        )
                      )}
                    </Box>
                  </Box>
                ))}
              </Box>
              <Box sx={{ border: `1px solid ${panelBorder}`, mt: 2 }}>
                <Box
                  sx={{
                    p: 0.85,
                    bgcolor: tableHeaderBg,
                    borderBottom: `1px solid ${panelBorder}`,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 14,
                      fontWeight: 800,
                      color: panelText,
                      textAlign: "center",
                    }}
                  >
                    체크리스트/서명(PPE/LOTO)
                  </Typography>

                  {signatureSaveMessage ? (
                    <Typography
                      sx={{
                        mt: 0.5,
                        fontSize: 11,
                        fontWeight: 600,
                        color: mutedText,
                        textAlign: "center",
                      }}
                    >
                      {signatureSaveMessage}
                    </Typography>
                  ) : null}
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(3, minmax(0, 1fr))"
                    },
                    borderBottom: `1px solid ${panelBorder}`
                  }}
                >
                  {SIGNATURE_CHECKLIST_ITEMS.map((item, index) => (
                    <Box
                      key={item}
                      sx={{
                        p: {
                          xs: 0.75,
                          sm: 0.75
                        },

                        borderRight: {
                          xs: "none",
                          sm:
                            index === SIGNATURE_CHECKLIST_ITEMS.length - 1
                              ? "none"
                              : `1px solid ${panelBorder}`
                        },

                        borderBottom: {
                          xs:
                            index === SIGNATURE_CHECKLIST_ITEMS.length - 1
                              ? "none"
                              : `1px solid ${panelBorder}`,
                          sm: "none"
                        },

                        display: "flex",
                        alignItems: "center",

                        justifyContent: {
                          xs: "flex-start",
                          sm: "center"
                        }
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(signatureChecklistChecks[item])}
                            onChange={(event) =>
                              handleSignatureChecklistChange(item, event.target.checked)
                            }
                            size="small"
                            disabled={viewLoading || isSavingSignature}
                            sx={{
                              color: "#7fa0af",
                              "& .MuiSvgIcon-root": { fontSize: 21 },
                              "&.Mui-checked": { color: accentBlue }
                            }}
                          />
                        }
                        label={item}
                        sx={{
                          m: 0,
                          color: panelText,

                          "& .MuiFormControlLabel-label": {
                            fontSize: 13,
                            fontWeight: 700,
                            whiteSpace: "nowrap"
                          }
                        }}
                      />
                    </Box>
                  ))}
                </Box>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr 1fr"
                    }
                  }}
                >
                  {renderSignaturePad("worker", "작업자 서명")}
                  {renderSignaturePad("supervisor", "감독자 서명")}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: `1px solid ${panelBorder}`,
            px: 2,
            py: 1.25,
            justifyContent: "space-between"
          }}
        >
          <Typography
            sx={{
              fontSize: 12,
              color:
                draftSaveMessage === "수정 내용이 저장되었습니다."
                  ? "#047857"
                  : mutedText
            }}
          >
            {draftSaveMessage}
          </Typography>

          <Box
            sx={{
              display: "flex",
              gap: 1
            }}
          >
            <Button
              onClick={() => setViewOpen(false)}
              disabled={isSavingDraft}
              sx={{
                color: panelText
              }}
            >
              닫기
            </Button>

            <Button
              variant="contained"
              onClick={() => void handleSaveDraft()}
              disabled={
                viewLoading ||
                isSavingDraft ||
                viewSections.length === 0
              }
              sx={{
                bgcolor: accentBlue,
                color: "#ffffff",
                borderRadius: 0,
                boxShadow: "none",

                "&:hover": {
                  bgcolor: accentBlueHover,
                  boxShadow: "none"
                }
              }}
            >
              {isSavingDraft ? (
                <>
                  <CircularProgress
                    size={15}
                    sx={{
                      mr: 0.75,
                      color: "#ffffff"
                    }}
                  />
                  저장 중
                </>
              ) : (
                "수정 저장"
              )}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteTargetId !== null}
        onClose={() => setDeleteTargetId(null)}
        slotProps={{
          paper: {
            sx: {
              bgcolor: panelBg,
              color: panelText,
              border: `1px solid ${panelBorder}`,
              borderRadius: 0,

              width: {
                xs: "calc(100vw - 16px)",
                sm: "100%"
              },

              maxWidth: {
                xs: "calc(100vw - 16px)",
                sm: undefined
              },

              height: {
                xs: "calc(100dvh - 16px)",
                sm: "auto"
              },

              maxHeight: {
                xs: "calc(100dvh - 16px)",
                sm: "90vh"
              },

              m: {
                xs: 1,
                sm: 4
              }
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            fontSize: {
              xs: 16,
              sm: 17
            },
            fontWeight: 700,
            borderBottom: `1px solid ${panelBorder}`,
            px: {
              xs: 2,
              sm: 3
            },
            py: {
              xs: 1.5,
              sm: 2
            },
            lineHeight: 1.5,
            wordBreak: "keep-all"
          }}
        >
          TBM 이력 삭제
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13 }}>
            이 TBM 이력을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${panelBorder}` }}>
          <Button
            onClick={() => setDeleteTargetId(null)}
            disabled={isDeleting}
            sx={{ color: panelText }}
          >
            취소
          </Button>
          <Button
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            sx={{ color: errorColor }}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TbmHistoryPage;
