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
const pageGradient = "linear-gradient(180deg, #ffffff 0%, #fffaf7 100%)";
const panelBg = "#ffffff";
const panelBorder = "#ffb4a2";
const panelText = "#11344a";
const mutedText = "#5f7482";
const inputBg = "#fffaf7";
const tableBg = "#ffffff";
const tableHeaderBg = "#fff3e0";
const rowStripeBg = "#fffaf7";
const rowHoverBg = "#fff3e0";
const accentBlue = "#d32f2f";
const accentBlueHover = "#b71c1c";
const actionOrange = "#ef6c00";
const actionOrangeHover = "#e65100";
const errorColor = "#d32f2f";
const darkNavyText = "#ffffff";
const sectionHeaderBg = "#fff3e0";
const scriptPanelBg = "#fff8f2";
const scriptHeaderBg = "#fff3e0";
const scriptBorder = "#ffb74d";
const scriptAccent = "#d32f2f";

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

const parseWorkerSignatures = (value: string): string[] => {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    if (Array.isArray(parsed)) {
      // 빈 문자열도 유지해야 작업 인원 수만큼 칸이 표시됨
      return parsed.map((signature) =>
        typeof signature === "string"
          ? signature
          : ""
      );
    }
  } catch {
    // 과거 데이터는 단일 서명 이미지일 수 있음
  }

  return value.trim() ? [value] : [];
};

const parseWorkerCountFromDraft = (draftText: string): number => {
  const patterns = [
    /작업\s*인원\s*[:：]\s*(\d+)\s*명?/i,
    /작업\s*인원\s*(\d+)\s*명/i,
    /작업자\s*수\s*[:：]\s*(\d+)\s*명?/i,
    /작업인원\s*[:：]?\s*(\d+)\s*명?/i
  ];

  for (const pattern of patterns) {
    const match = draftText.match(pattern);

    if (match) {
      const count = Number(match[1]);

      if (
        Number.isInteger(count) &&
        count >= 1 &&
        count <= 100
      ) {
        return count;
      }
    }
  }

  return 0;
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
  "& .MuiMenuItem-root:hover": { bgcolor: "#fff3e0" }
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
    .replace(/^>+\s*/, "")                    // 인용 표시 제거
    .replace(/^#{1,6}\s*/, "")                // ##, ### 제거
    .replace(/^\d+[.)]\s*/, "")               // 앞의 1. 또는 1) 제거
    .replace(/^\d+\s*단계\s*[:：.)-]?\s*/, "") // 1단계:, 1 단계: 제거
    .replace(/^[-*•■▪▶]+\s*/, "")             // 글머리 기호 제거
    .replace(/[：:]\s*$/, "")                  // 마지막 콜론 제거
    .replace(/\s+/g, "")
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
  const draftLineInputRefs = useRef<
    Record<string, HTMLInputElement | HTMLTextAreaElement | null>
  >({});

  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewHistoryId, setViewHistoryId] = useState<number | null>(null);
  const [viewTitle, setViewTitle] = useState("");
  const [viewText, setViewText] = useState("");

  const [viewSections, setViewSections] = useState<PreviewSection[]>([]);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftSaveMessage, setDraftSaveMessage] = useState("");

  const [signatureChecklistChecks, setSignatureChecklistChecks] = useState<Record<string, boolean>>(
    {}
  );
  const [isEditingChecklist, setIsEditingChecklist] =
    useState(false);

  const [checklistEditValue, setChecklistEditValue] =
    useState<Record<string, boolean>>({});
  const [workerSignatures, setWorkerSignatures] = useState<string[]>([]);
  const [historyWorkerCount, setHistoryWorkerCount] = useState(0);
  const [workerSignature, setWorkerSignature] = useState("");
  const [supervisorSignature, setSupervisorSignature] = useState("");
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [signatureSaveMessage, setSignatureSaveMessage] = useState("");
  const workerSignatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerSignatureCanvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const [editingWorkerSignatures, setEditingWorkerSignatures] = useState<Record<number, boolean>>({});
  const activeWorkerSignatureIndexRef = useRef<number | null>(null);
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

  const buildSignaturePayload = (
    override: Partial<TbmSignatureData> = {}
  ): TbmSignatureData => ({
    checklist:
      override.checklist ??
      signatureChecklistChecks,

    workerSignature:
      override.workerSignature ??
      (
        workerSignatures.length > 0
          ? JSON.stringify(workerSignatures)
          : workerSignature
      ),

    supervisorSignature:
      override.supervisorSignature ??
      supervisorSignature,

    signedAt:
      override.signedAt ??
      new Date().toISOString()
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

  const handleChecklistChange = (
    item: string,
    checked: boolean
  ) => {
    setChecklistEditValue((prev) => ({
      ...prev,
      [item]: checked
    }));

    setSignatureSaveMessage("");
  };

  const handleCancelChecklistEdit = () => {
    setChecklistEditValue({
      ...signatureChecklistChecks
    });

    setIsEditingChecklist(false);
    setSignatureSaveMessage("");
  };

  const handleSaveChecklist = async () => {
    const saved = await saveSignaturePayload(
      buildSignaturePayload({
        checklist: checklistEditValue
      })
    );

    if (!saved) {
      return;
    }

    setSignatureChecklistChecks({
      ...checklistEditValue
    });

    setIsEditingChecklist(false);
  };

  const prepareSignatureCanvas = (
    kind: SignatureKind,
    value = getSignatureValue(kind)
  ) => {
    const canvas = getSignatureCanvas(kind);

    if (!canvas) return;

    const rect =
      canvas.getBoundingClientRect();

    const cssWidth = Math.max(
      1,
      Math.floor(rect.width)
    );

    const cssHeight = Math.max(
      1,
      Math.floor(rect.height)
    );

    const dpr =
      window.devicePixelRatio || 1;

    const pixelWidth = Math.floor(
      cssWidth * dpr
    );

    const pixelHeight = Math.floor(
      cssHeight * dpr
    );

    const ctx =
      canvas.getContext("2d");

    if (!ctx) return;

    if (
      canvas.width !== pixelWidth ||
      canvas.height !== pixelHeight
    ) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = panelText;

    ctx.clearRect(
      0,
      0,
      cssWidth,
      cssHeight
    );

    if (!value) {
      return;
    }

    const image = new Image();

    image.onload = () => {
      const restoreCtx =
        canvas.getContext("2d");

      if (!restoreCtx) return;

      restoreCtx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      restoreCtx.clearRect(
        0,
        0,
        cssWidth,
        cssHeight
      );

      restoreCtx.drawImage(
        image,
        0,
        0,
        cssWidth,
        cssHeight
      );
    };

    image.src = value;
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

  const setWorkerSignatureAt = (
    workerIndex: number,
    value: string
  ) => {
    setWorkerSignatures((prev) => {
      const nextSignatures = Array.from(
        {
          length: Math.max(
            historyWorkerCount,
            prev.length,
            workerIndex + 1
          )
        },
        (_, index) => prev[index] ?? ""
      );

      nextSignatures[workerIndex] = value;

      return nextSignatures;
    });
  };

  const prepareWorkerSignatureCanvas = (
    workerIndex: number,
    value = workerSignatures[workerIndex] ?? ""
  ) => {
    const canvas =
      workerSignatureCanvasRefs.current[workerIndex];

    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const cssWidth = Math.max(
      1,
      Math.floor(rect.width)
    );

    const cssHeight = Math.max(
      1,
      Math.floor(rect.height)
    );

    const dpr = window.devicePixelRatio || 1;

    const pixelWidth = Math.floor(
      cssWidth * dpr
    );

    const pixelHeight = Math.floor(
      cssHeight * dpr
    );

    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    if (
      canvas.width !== pixelWidth ||
      canvas.height !== pixelHeight
    ) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = panelText;

    // 기존 canvas를 먼저 초기화
    ctx.clearRect(
      0,
      0,
      cssWidth,
      cssHeight
    );

    if (!value) {
      return;
    }

    // 크기 변경 여부와 관계없이 항상 저장된 서명 복원
    const image = new Image();

    image.onload = () => {
      const restoreCtx =
        canvas.getContext("2d");

      if (!restoreCtx) return;

      restoreCtx.setTransform(
        dpr,
        0,
        0,
        dpr,
        0,
        0
      );

      restoreCtx.clearRect(
        0,
        0,
        cssWidth,
        cssHeight
      );

      restoreCtx.drawImage(
        image,
        0,
        0,
        cssWidth,
        cssHeight
      );
    };

    image.src = value;
  };

  const handleWorkerSignaturePointerDown = (
    workerIndex: number,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (
      viewLoading ||
      isSavingSignature ||
      !editingWorkerSignatures[workerIndex]
    ) {
      return;
    }

    const canvas =
      workerSignatureCanvasRefs.current[workerIndex];

    if (!canvas) return;

    prepareWorkerSignatureCanvas(workerIndex);

    canvas.setPointerCapture(event.pointerId);

    activeWorkerSignatureIndexRef.current =
      workerIndex;

    lastSignaturePointRef.current =
      getSignaturePoint(canvas, event);

    event.preventDefault();
  };

  const handleWorkerSignaturePointerMove = (
    workerIndex: number,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (
      activeWorkerSignatureIndexRef.current !==
      workerIndex ||
      viewLoading ||
      isSavingSignature ||
      !editingWorkerSignatures[workerIndex]
    ) {
      return;
    }

    const canvas =
      workerSignatureCanvasRefs.current[workerIndex];

    const previousPoint =
      lastSignaturePointRef.current;

    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx || !previousPoint) {
      return;
    }

    const nextPoint =
      getSignaturePoint(canvas, event);

    ctx.beginPath();
    ctx.moveTo(
      previousPoint.x,
      previousPoint.y
    );
    ctx.lineTo(nextPoint.x, nextPoint.y);
    ctx.stroke();

    lastSignaturePointRef.current = nextPoint;

    event.preventDefault();
  };

  const handleWorkerSignaturePointerUp = (
    workerIndex: number,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (
      activeWorkerSignatureIndexRef.current !==
      workerIndex
    ) {
      return;
    }

    const canvas =
      workerSignatureCanvasRefs.current[workerIndex];

    if (canvas) {
      if (
        canvas.hasPointerCapture(event.pointerId)
      ) {
        canvas.releasePointerCapture(
          event.pointerId
        );
      }

      const signatureImage =
        canvas.toDataURL("image/png");

      setWorkerSignatureAt(
        workerIndex,
        signatureImage
      );
    }

    activeWorkerSignatureIndexRef.current =
      null;

    lastSignaturePointRef.current = null;

    event.preventDefault();
  };

  const handleEditWorkerSignature = (
    workerIndex: number
  ) => {
    setEditingWorkerSignatures((prev) => ({
      ...prev,
      [workerIndex]: true
    }));

    setSignatureSaveMessage("");

    window.requestAnimationFrame(() => {
      prepareWorkerSignatureCanvas(
        workerIndex,
        workerSignatures[workerIndex] ?? ""
      );
    });
  };

  const handleCancelWorkerSignature = (
    workerIndex: number
  ) => {
    setEditingWorkerSignatures((prev) => ({
      ...prev,
      [workerIndex]: false
    }));

    setSignatureSaveMessage("");

    window.requestAnimationFrame(() => {
      prepareWorkerSignatureCanvas(
        workerIndex,
        workerSignatures[workerIndex] ?? ""
      );
    });
  };

  const clearWorkerSignature = (
    workerIndex: number
  ) => {
    const canvas =
      workerSignatureCanvasRefs.current[workerIndex];

    const ctx = canvas?.getContext("2d");

    if (canvas && ctx) {
      const rect =
        canvas.getBoundingClientRect();

      ctx.clearRect(
        0,
        0,
        rect.width,
        rect.height
      );
    }

    setWorkerSignatureAt(workerIndex, "");
    setSignatureSaveMessage("");
  };

  const handleSaveWorkerSignature = async (
    workerIndex: number
  ) => {
    const signatureValue =
      workerSignatures[workerIndex] ?? "";

    if (!signatureValue) {
      setSignatureSaveMessage(
        `작업자 ${workerIndex + 1}의 서명을 입력해 주세요.`
      );

      return;
    }

    const nextSignatures = Array.from(
      {
        length: Math.max(
          historyWorkerCount,
          workerSignatures.length
        )
      },
      (_, index) =>
        workerSignatures[index] ?? ""
    );

    nextSignatures[workerIndex] =
      signatureValue;

    const saved = await saveSignaturePayload(
      buildSignaturePayload({
        workerSignature:
          JSON.stringify(nextSignatures)
      })
    );

    if (!saved) return;

    setWorkerSignatures(nextSignatures);

    setEditingWorkerSignatures((prev) => ({
      ...prev,
      [workerIndex]: false
    }));
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
      workerSignatureCanvasRefs.current.forEach(
        (_, workerIndex) => {
          prepareWorkerSignatureCanvas(
            workerIndex,
            workerSignatures[workerIndex] ?? ""
          );
        }
      );
      prepareSignatureCanvas("supervisor", supervisorSignature);
    };

    const animationFrameId = window.requestAnimationFrame(prepareCanvases);
    window.addEventListener("resize", prepareCanvases);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", prepareCanvases);
    };
  }, [viewOpen, viewLoading, workerSignatures, supervisorSignature, editingWorkerSignatures]);

  const handleView = async (id: number) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewHistoryId(id);
    setViewTitle("");
    setViewText("");
    setViewSections([]);
    setIsEditingDraft(false);
    setDraftSaveMessage("");
    setSignatureChecklistChecks({});
    setChecklistEditValue({});
    setIsEditingChecklist(false);
    setWorkerSignatures([]);
    setEditingWorkerSignatures({});
    setHistoryWorkerCount(0);
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
      const workerCount = parseWorkerCountFromDraft(result.row.draftText);
      setHistoryWorkerCount(workerCount);
      setViewSections(buildPreviewSections(result.row.draftText));
      const signature = result.row.signature ?? EMPTY_SIGNATURE;
      const loadedChecklist = signature.checklist ?? {};
      setSignatureChecklistChecks(loadedChecklist);
      setChecklistEditValue(loadedChecklist);

      setIsEditingChecklist(false);
      const loadedWorkerSignature = signature.workerSignature ?? "";
      const loadedWorkerSignatures =
        parseWorkerSignatures(loadedWorkerSignature);

      const loadedSupervisorSignature =
        signature.supervisorSignature ?? "";

      const normalizedWorkerSignatures =
        workerCount > 0
          ? Array.from(
            { length: workerCount },
            (_, index) =>
              loadedWorkerSignatures[index] ?? ""
          )
          : loadedWorkerSignatures;

      setWorkerSignatures(normalizedWorkerSignatures);
      setEditingWorkerSignatures(
        Object.fromEntries(
          normalizedWorkerSignatures.map(
            (_, workerIndex) => [
              workerIndex,
              false
            ]
          )
        )
      );

      // 기존 작업자 서명 편집 기능 호환용
      setWorkerSignature(
        normalizedWorkerSignatures[0] ?? ""
      );

      setSupervisorSignature(loadedSupervisorSignature);

      setEditingSignatures({
        worker:
          normalizedWorkerSignatures.every(
            (signature) => !signature
          ),
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
    const lines = content.split("\n");

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

  const handleViewLineKeyDown = (
    sectionIndex: number,
    lineIndex: number,
    event: React.KeyboardEvent<HTMLDivElement>
  ) => {
    if (!isEditingDraft) {
      return;
    }

    // 한글 입력 조합 중 키 이벤트 중복 방지
    if (event.nativeEvent.isComposing) {
      return;
    }

    /*
     * Enter
     * 현재 줄 아래에 새로운 입력칸 생성
     */
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();

      setViewSections((prev) =>
        prev.map((section, index) => {
          if (index !== sectionIndex) {
            return section;
          }

          const lines = getSectionLines(section.content);

          lines.splice(lineIndex + 1, 0, "");

          return {
            ...section,
            content: lines.join("\n")
          };
        })
      );

      setDraftSaveMessage("");

      window.requestAnimationFrame(() => {
        const nextInputKey = `${sectionIndex}-${lineIndex + 1}`;
        draftLineInputRefs.current[nextInputKey]?.focus();
      });

      return;
    }

    /*
     * Backspace
     * 현재 입력칸이 이미 비어 있는 상태에서 한 번 더 누르면
     * 현재 입력칸 삭제 후 이전 입력칸으로 이동
     */
    if (event.key === "Backspace") {
      const currentLine = getSectionLines(
        viewSections[sectionIndex]?.content ?? ""
      )[lineIndex];

      // 내용이 있으면 일반적인 글자 삭제로 처리
      if (currentLine !== "") {
        return;
      }

      const lines = getSectionLines(
        viewSections[sectionIndex]?.content ?? ""
      );

      // 해당 구역에 입력칸이 하나밖에 없으면 삭제하지 않음
      if (lines.length <= 1) {
        return;
      }

      event.preventDefault();

      const previousLineIndex = Math.max(0, lineIndex - 1);

      setViewSections((prev) =>
        prev.map((section, index) => {
          if (index !== sectionIndex) {
            return section;
          }

          const nextLines = getSectionLines(section.content);

          nextLines.splice(lineIndex, 1);

          return {
            ...section,
            content: nextLines.join("\n")
          };
        })
      );

      setDraftSaveMessage("");

      window.requestAnimationFrame(() => {
        const previousInputKey =
          `${sectionIndex}-${previousLineIndex}`;

        const previousInput =
          draftLineInputRefs.current[previousInputKey];

        previousInput?.focus();

        // 이전 문장 맨 끝으로 커서 이동
        if (previousInput) {
          const cursorPosition = previousInput.value.length;

          previousInput.setSelectionRange(
            cursorPosition,
            cursorPosition
          );
        }
      });
    }
  };

  const handleCancelDraftEdit = () => {
    setViewSections(buildPreviewSections(viewText));
    setIsEditingDraft(false);
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
      setIsEditingDraft(false);
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
                    bgcolor: "#fff3e0"
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
                  bgcolor: "#fff3e0"
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

  const displayedWorkerCount = Math.max(
    historyWorkerCount,
    workerSignatures.length
  );

  const displayedWorkerSignatures =
    Array.from(
      { length: displayedWorkerCount },
      (_, index) =>
        workerSignatures[index] ?? ""
    );

  const renderWorkerSignatureList = () => {
    if (displayedWorkerCount === 0) {
      return null;
    }

    return (
      <Box
        sx={{
          p: {
            xs: 1,
            sm: 0.9
          }
        }}
      >
        <Typography
          sx={{
            mb: 1,
            fontSize: 13,
            fontWeight: 700,
            color: panelText
          }}
        >
          작업자 서명 ({displayedWorkerCount}명)
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))"
            },
            gap: 1
          }}
        >
          {displayedWorkerSignatures.map(
            (signature, workerIndex) => {
              const isEditing =
                Boolean(
                  editingWorkerSignatures[
                  workerIndex
                  ]
                );

              return (
                <Box
                  key={`worker-signature-${workerIndex}`}
                  sx={{
                    p: 0.9,
                    border:
                      `1px solid ${panelBorder}`,
                    bgcolor: "#ffffff"
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "space-between",
                      gap: 1,
                      mb: 0.7
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: panelText,
                        whiteSpace: "nowrap"
                      }}
                    >
                      작업자 {workerIndex + 1} 서명
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        gap: 0.5
                      }}
                    >
                      {isEditing ? (
                        <>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              clearWorkerSignature(
                                workerIndex
                              )
                            }
                            disabled={
                              viewLoading ||
                              isSavingSignature ||
                              !signature
                            }
                            sx={{
                              minWidth: 46,
                              px: 0.7,
                              py: 0.2,
                              fontSize: 11,
                              color: panelText,
                              borderColor:
                                panelBorder,
                              borderRadius: 0,
                              textTransform: "none"
                            }}
                          >
                            지우기
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() =>
                              handleCancelWorkerSignature(
                                workerIndex
                              )
                            }
                            disabled={
                              viewLoading ||
                              isSavingSignature
                            }
                            sx={{
                              minWidth: 46,
                              px: 0.7,
                              py: 0.2,
                              fontSize: 11,
                              color: panelText,
                              borderColor:
                                panelBorder,
                              borderRadius: 0,
                              textTransform: "none"
                            }}
                          >
                            취소
                          </Button>

                          <Button
                            size="small"
                            variant="contained"
                            onClick={() =>
                              void handleSaveWorkerSignature(
                                workerIndex
                              )
                            }
                            disabled={
                              viewLoading ||
                              isSavingSignature ||
                              !signature
                            }
                            sx={{
                              minWidth: 46,
                              px: 0.7,
                              py: 0.2,
                              fontSize: 11,
                              bgcolor: accentBlue,
                              borderRadius: 0,
                              textTransform: "none",
                              "&:hover": {
                                bgcolor:
                                  accentBlueHover
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
                          onClick={() =>
                            handleEditWorkerSignature(
                              workerIndex
                            )
                          }
                          disabled={
                            viewLoading ||
                            isSavingSignature
                          }
                          sx={{
                            minWidth: 64,
                            px: 0.8,
                            py: 0.2,
                            fontSize: 11,
                            color: panelText,
                            borderColor:
                              panelBorder,
                            borderRadius: 0,
                            textTransform: "none",
                            "&:hover": {
                              borderColor:
                                accentBlue,
                              bgcolor: "#fff3e0"
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
                      border:
                        `1px solid ${panelBorder}`,
                      bgcolor: inputBg,
                      overflow: "hidden"
                    }}
                  >
                    {!signature && (
                      <Typography
                        sx={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent:
                            "center",
                          color: mutedText,
                          fontSize: 12,
                          pointerEvents: "none"
                        }}
                      >
                        이 영역에 직접 서명해 주세요.
                      </Typography>
                    )}

                    <canvas
                      ref={(canvas) => {
                        workerSignatureCanvasRefs.current[
                          workerIndex
                        ] = canvas;
                      }}
                      onPointerDown={(event) =>
                        handleWorkerSignaturePointerDown(
                          workerIndex,
                          event
                        )
                      }
                      onPointerMove={(event) =>
                        handleWorkerSignaturePointerMove(
                          workerIndex,
                          event
                        )
                      }
                      onPointerUp={(event) =>
                        handleWorkerSignaturePointerUp(
                          workerIndex,
                          event
                        )
                      }
                      onPointerCancel={(event) =>
                        handleWorkerSignaturePointerUp(
                          workerIndex,
                          event
                        )
                      }
                      style={{
                        position: "relative",
                        width: "100%",
                        height: "112px",
                        display: "block",
                        cursor:
                          viewLoading ||
                            isSavingSignature ||
                            !isEditing
                            ? "default"
                            : "crosshair",
                        touchAction: "none"
                      }}
                    />
                  </Box>
                </Box>
              );
            }
          )}
        </Box>
      </Box>
    );
  };

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
            bgcolor: "#fff8f2",
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
              "&:hover": { borderColor: actionOrange, bgcolor: "#fff3e0" }
            }}
          >
            초기화
          </Button>
        </Box>

        <Box
          sx={{ px: 1.5, py: 0.9, bgcolor: "#fff3e0", borderBottom: `1px solid ${panelBorder}` }}
        >
          <Typography
            sx={{ fontSize: 15, fontWeight: 800, color: panelText }}
          >
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
                      bgcolor: active ? accentBlueHover : "#fff3e0"
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
              borderRadius: 0,

              "@media (max-width: 599.95px)": {
                width: "calc(100vw - 24px)",
                maxWidth: "calc(100vw - 24px)",
                margin: "12px"
              }
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
              xs: 1.5,
              sm: 3
            },

            pb: {
              xs: 1.5,
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
                  xs: 0,
                  sm: 2
                }
              }}
            >
              <Typography
                sx={{
                  textAlign: {
                    xs: "center",
                    sm: "center"
                  },

                  fontSize: {
                    xs: 19,
                    sm: 24
                  },

                  fontWeight: {
                    xs: 800,
                    sm: 800
                  },

                  mb: {
                    xs: 0,
                    sm: 1.25
                  },

                  px: {
                    xs: 1.75,
                    sm: 0
                  },

                  py: {
                    xs: 1.0,
                    sm: 0
                  },

                  bgcolor: {
                    xs: "transparent",
                    sm: "transparent"
                  },

                  borderBottom: {
                    xs: `1px solid ${panelBorder}`,
                    sm: "none"
                  },

                  color: {
                    xs: "#174a8b",
                    sm: panelText
                  },

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
                    T.B.M 리더 멘트
                    {isEditingDraft ? " (수정 중)" : ""}
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
                        xs: 0,
                        sm: 0
                      },

                      border: {
                        xs: "none",
                        sm: "none"
                      },

                      borderRadius: {
                        xs: 0,
                        sm: 0
                      },

                      overflow: {
                        xs: "visible",
                        sm: "visible"
                      },

                      borderBottom: {
                        xs: "none",
                        sm:
                          index === sections.length - 1
                            ? "none"
                            : `1px solid ${panelBorder}`
                      }
                    }}
                  >
                    <Box
                      sx={{
                        position: "relative",

                        p: {
                          xs: 0,
                          sm: 0.8
                        },

                        mt: {
                          xs: index === 0 ? 0 : 0.5,
                          sm: 0
                        },

                        py: {
                          xs: 1.5,
                          sm: 0.8
                        },

                        fontSize: {
                          xs: 15,
                          sm: 12.5
                        },

                        fontWeight: {
                          xs: 800,
                          sm: 700
                        },

                        borderRight: {
                          xs: "none",
                          sm: `1px solid ${panelBorder}`
                        },

                        borderBottom: {
                          xs: "none",
                          sm: "none"
                        },

                        bgcolor: {
                          xs: tableHeaderBg,
                          sm: tableHeaderBg
                        },

                        color: {
                          xs: "#0f2f46",
                          sm: panelText
                        },

                        textAlign: {
                          xs: "center",
                          sm: "center"
                        },

                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: 0.25,

                        wordBreak: "keep-all",

                        "&::before": {
                          content: '""',
                          display: "none"
                        }
                      }}
                    >
                      <span>{`${index + 1}단계: ${section.title}`}</span>

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
                          xs: 1.1,
                          sm: 0.65
                        },

                        pt: {
                          xs: 0.35,
                          sm: 0.45
                        },

                        pb: {
                          xs: 0.5,
                          sm: 0.45
                        },

                        display: "flex",
                        flexDirection: "column",

                        gap: {
                          xs: 0.35,
                          sm: 0.2
                        },

                        bgcolor: {
                          xs: "#ffffff",
                          sm: inputBg
                        },

                        borderBottom: {
                          xs: `1px solid ${panelBorder}`,
                          sm: "none"
                        },

                        minWidth: 0,
                        width: "100%",
                        maxWidth: "100%",
                        boxSizing: "border-box"
                      }}
                    >
                      {getSectionLines(section.content).map(
                        (line, lineIndex) =>
                          isEditingDraft ? (
                            <TextField
                              key={`${section.title}-${lineIndex}`}
                              multiline
                              minRows={1}
                              fullWidth

                              inputRef={(element) => {
                                const inputKey = `${index}-${lineIndex}`;

                                if (element) {
                                  draftLineInputRefs.current[inputKey] = element;
                                } else {
                                  delete draftLineInputRefs.current[inputKey];
                                }
                              }}

                              value={line}

                              onChange={(event) =>
                                handleViewLineChange(
                                  index,
                                  lineIndex,
                                  event.target.value
                                )
                              }

                              onKeyDown={(event) =>
                                handleViewLineKeyDown(
                                  index,
                                  lineIndex,
                                  event
                                )
                              }

                              placeholder=""

                              disabled={viewLoading || isSavingDraft}

                              sx={{
                                width: "100%",
                                minWidth: 0,
                                maxWidth: "100%",

                                borderBottom: {
                                  xs:
                                    lineIndex ===
                                      getSectionLines(section.content).length - 1
                                      ? "none"
                                      : "1px solid #edf2f6",
                                  sm: "none"
                                },

                                "& .MuiInputBase-root": {
                                  bgcolor: "transparent",
                                  borderRadius: 1,

                                  fontSize: {
                                    xs: 14,
                                    sm: 13
                                  },

                                  color: panelText,

                                  lineHeight: {
                                    xs: 1.6,
                                    sm: 1.38
                                  },

                                  fontWeight: {
                                    xs: 400,
                                    sm: 500
                                  },

                                  letterSpacing: {
                                    xs: "-0.01em",
                                    sm: "normal"
                                  },

                                  p: 0,
                                  minWidth: 0,
                                  width: "100%"
                                },

                                "& .MuiInputBase-input": {
                                  py: {
                                    xs: 0.05,
                                    sm: 0.15
                                  },

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
                                  borderColor: "#ffcc80"
                                },

                                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                  borderColor: accentBlue
                                }
                              }}
                            />
                          ) : (
                            <Typography
                              key={`${section.title}-${lineIndex}`}
                              component="p"

                              sx={{
                                width: "100%",
                                m: 0,

                                py: {
                                  xs: 0.05,
                                  sm: 0.15
                                },

                                fontSize: {
                                  xs: 14,
                                  sm: 13
                                },

                                color: panelText,

                                lineHeight: {
                                  xs: 1.6,
                                  sm: 1.38
                                },

                                fontWeight: {
                                  xs: 400,
                                  sm: 500
                                },

                                letterSpacing: {
                                  xs: "-0.01em",
                                  sm: "normal"
                                },

                                wordBreak: "keep-all",
                                overflowWrap: "break-word",

                                userSelect: "none",
                                WebkitUserSelect: "none",

                                borderBottom: {
                                  xs:
                                    lineIndex ===
                                      getSectionLines(section.content).length - 1
                                      ? "none"
                                      : "1px solid #edf2f6",
                                  sm: "none"
                                }
                              }}
                            >
                              {line}
                            </Typography>
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
                            checked={Boolean(
                              isEditingChecklist
                                ? checklistEditValue[item]
                                : signatureChecklistChecks[item]
                            )}

                            onChange={(event) =>
                              handleChecklistChange(
                                item,
                                event.target.checked
                              )
                            }

                            size="small"

                            disabled={
                              viewLoading ||
                              isSavingSignature ||
                              !isEditingChecklist
                            }

                            sx={{
                              color: "#7fa0af",

                              "& .MuiSvgIcon-root": {
                                fontSize: 21
                              },

                              "&.Mui-checked": {
                                color: accentBlue
                              },

                              "&.Mui-disabled": {
                                color: "#7fa0af"
                              },

                              "&.Mui-checked.Mui-disabled": {
                                color: accentBlue
                              }
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
                <Box>
                  {renderWorkerSignatureList()}

                  <Box
                    sx={{
                      mt: 1,
                      borderTop: `1px solid ${panelBorder}`
                    }}
                  >
                    {renderSignaturePad(
                      "supervisor",
                      "감독자 서명"
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            position: "relative",

            borderTop: `1px solid ${panelBorder}`,

            px: {
              xs: 2,
              sm: 2
            },

            py: {
              xs: 1.25,
              sm: 1.25
            },

            minHeight: {
              xs: 64,
              sm: "auto"
            },

            justifyContent: {
              xs: "flex-end",
              sm: "space-between"
            },

            overflow: "visible"
          }}
        >
          <Typography
            sx={{
              position: {
                xs: "absolute",
                sm: "static"
              },

              left: {
                xs: 12,
                sm: "auto"
              },

              right: {
                xs: 12,
                sm: "auto"
              },

              top: {
                xs: -46,
                sm: "auto"
              },

              minHeight: {
                xs: draftSaveMessage ? 36 : 0,
                sm: "auto"
              },

              px: {
                xs: draftSaveMessage ? 1.5 : 0,
                sm: 0
              },

              py: {
                xs: draftSaveMessage ? 0.85 : 0,
                sm: 0
              },

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              bgcolor: {
                xs:
                  draftSaveMessage === "수정 내용이 저장되었습니다."
                    ? "#dcfce7"
                    : draftSaveMessage
                      ? "#f8fafc"
                      : "transparent",
                sm: "transparent"
              },

              border: {
                xs:
                  draftSaveMessage === "수정 내용이 저장되었습니다."
                    ? "1px solid #4ade80"
                    : draftSaveMessage
                      ? "1px solid #94a3b8"
                      : "none",
                sm: "none"
              },

              borderRadius: {
                xs: 1,
                sm: 0
              },

              boxShadow: {
                xs: draftSaveMessage
                  ? "0 6px 16px rgba(15, 23, 42, 0.16)"
                  : "none",
                sm: "none"
              },

              fontSize: {
                xs: 12.5,
                sm: 12
              },

              fontWeight: {
                xs: 700,
                sm: 400
              },

              lineHeight: 1.4,

              whiteSpace: {
                xs: "nowrap",
                sm: "normal"
              },

              color:
                draftSaveMessage === "수정 내용이 저장되었습니다."
                  ? "#047857"
                  : mutedText,

              pointerEvents: "none",
              zIndex: 10
            }}
          >
            {draftSaveMessage}
          </Typography>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: {
                xs: 1,
                sm: 1
              },
              flexShrink: 0
            }}
          >
            {!isEditingDraft ? (
              <>
                <Button
                  onClick={() => setViewOpen(false)}
                  disabled={isSavingDraft}
                  sx={{
                    minWidth: {
                      xs: 60,
                      sm: 64
                    },

                    height: {
                      xs: 40,
                      sm: "auto"
                    },

                    px: {
                      xs: 1.5,
                      sm: 1
                    },

                    color: panelText,

                    fontSize: {
                      xs: 14,
                      sm: 14
                    },

                    fontWeight: {
                      xs: 700,
                      sm: 500
                    },

                    borderRadius: 0
                  }}
                >
                  닫기
                </Button>

                <Button
                  variant="contained"
                  onClick={() => {
                    setIsEditingDraft(true);

                    // 체크리스트도 수정 모드로 변경
                    setChecklistEditValue({
                      ...signatureChecklistChecks,
                    });
                    setIsEditingChecklist(true);

                    setDraftSaveMessage("");
                    setSignatureSaveMessage("");
                  }}
                  disabled={
                    viewLoading ||
                    isSavingDraft ||
                    isSavingSignature ||
                    viewSections.length === 0
                  }
                  sx={{
                    minWidth: {
                      xs: 76,
                      sm: "auto"
                    },
                    height: {
                      xs: 40,
                      sm: "auto"
                    },
                    px: {
                      xs: 1.5,
                      sm: 2
                    },
                    bgcolor: accentBlue,
                    color: "#ffffff",
                    borderRadius: 0,
                    boxShadow: "none",
                    fontSize: {
                      xs: 14,
                      sm: 14
                    },
                    fontWeight: {
                      xs: 700,
                      sm: 500
                    },
                    whiteSpace: "nowrap",
                    "&:hover": {
                      bgcolor: accentBlueHover,
                      boxShadow: "none"
                    }
                  }}
                >
                  수정하기
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => {
                    handleCancelDraftEdit();
                    handleCancelChecklistEdit();
                  }}
                  disabled={isSavingDraft || isSavingSignature}
                  sx={{
                    minWidth: {
                      xs: 60,
                      sm: 64
                    },

                    height: {
                      xs: 40,
                      sm: "auto"
                    },

                    px: {
                      xs: 1.5,
                      sm: 1
                    },

                    color: panelText,

                    fontSize: {
                      xs: 14,
                      sm: 14
                    },

                    fontWeight: {
                      xs: 700,
                      sm: 500
                    },

                    borderRadius: 0
                  }}
                >
                  취소
                </Button>

                <Button
                  variant="contained"
                  onClick={() => {
                    void (async () => {
                      await handleSaveDraft();
                      await handleSaveChecklist();
                    })();
                  }}
                  disabled={
                    viewLoading ||
                    isSavingDraft ||
                    isSavingSignature ||
                    viewSections.length === 0
                  }
                  sx={{
                    minWidth: {
                      xs: 76,
                      sm: "auto"
                    },

                    height: {
                      xs: 40,
                      sm: "auto"
                    },

                    px: {
                      xs: 1.5,
                      sm: 2
                    },

                    bgcolor: accentBlue,
                    color: "#ffffff",

                    borderRadius: 0,
                    boxShadow: "none",

                    fontSize: {
                      xs: 14,
                      sm: 14
                    },

                    fontWeight: {
                      xs: 700,
                      sm: 500
                    },

                    whiteSpace: "nowrap",

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
              </>
            )}
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteTargetId !== null}
        onClose={() => {
          if (!isDeleting) {
            setDeleteTargetId(null);
          }
        }}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              width: "calc(100% - 32px)",
              maxWidth: 380,
              m: 2,
              bgcolor: panelBg,
              color: panelText,
              border: `1px solid ${panelBorder}`,
              borderRadius: 2,
              boxShadow: "0 18px 48px rgba(15, 23, 42, 0.18)",
              overflow: "hidden"
            }
          }
        }}
      >
        <DialogTitle
          sx={{
            px: 2.5,
            pt: 2.25,
            pb: 0.75,
            fontSize: 17,
            fontWeight: 800,
            color: panelText,
            lineHeight: 1.4
          }}
        >
          TBM 이력 삭제
        </DialogTitle>

        <DialogContent
          sx={{
            px: 2.5,
            pt: "4px !important",
            pb: 1.5
          }}
        >
          <Typography
            sx={{
              fontSize: 13,
              color: mutedText,
              lineHeight: 1.65,
              wordBreak: "keep-all"
            }}
          >
            이 TBM 이력을 삭제하시겠습니까?<br />
            삭제 후에는 복구할 수 없습니다.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            pb: 2.25,
            pt: 0.5,
            gap: 1
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setDeleteTargetId(null)}
            disabled={isDeleting}
            sx={{
              minWidth: 76,
              height: 34,
              color: panelText,
              borderColor: panelBorder,
              borderRadius: 1.5,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "none",
              "&:hover": {
                borderColor: accentBlue,
                bgcolor: rowHoverBg
              }
            }}
          >
            취소
          </Button>

          <Button
            variant="contained"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
            sx={{
              minWidth: 76,
              height: 34,
              bgcolor: errorColor,
              color: "#ffffff",
              borderRadius: 1.5,
              fontSize: 12,
              fontWeight: 800,
              boxShadow: "none",
              textTransform: "none",
              "&:hover": {
                bgcolor: "#b91c1c",
                boxShadow: "none"
              }
            }}
          >
            {isDeleting ? "삭제 중..." : "삭제"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TbmHistoryPage;