import { useEffect, useRef, useState } from "react";
import { apiFetch } from "../utils/apiClient";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Checkbox from "@mui/material/Checkbox";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";

type TbmPreset = {
  workType: string;
  permitType: string;
  risk: string;
  shift: string;
  workDate: string;
  location: string;
};

type AdditionalTbmInputs = {
  workerCount: string;
  supervisorName: string;
  equipment: string;
  requiredPpe: string;
  detailedWork: string;
  siteHazards: string;
  safetyMeasures: string;
  emergencyNotes: string;
  specialNotes: string;
};

type FollowUpOtherInputs = Partial<
  Record<keyof Omit<AdditionalTbmInputs, "specialNotes">, string>
>;

type FollowUpQuestion = {
  key: keyof Omit<AdditionalTbmInputs, "specialNotes">;
  label: string;
  outputLabel: string;
  helperText: string;
  options: string[];
};

const MULTI_SELECT_QUESTION_KEYS = new Set<FollowUpQuestion["key"]>(["equipment", "requiredPpe",  "siteHazards", "safetyMeasures",  "emergencyNotes",]);
const MULTI_SELECT_SEPARATOR = ", ";

const isMultiSelectQuestion = (key: FollowUpQuestion["key"]): boolean =>
  MULTI_SELECT_QUESTION_KEYS.has(key);

const parseMultiSelectValue = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

type WorkTypeOption = {
  code: string;
  name: string;
  permitTypes: string[];
};

type WorkCategoryOption = {
  code: string;
  name: string;
  workTypes: WorkTypeOption[];
};

type CodeOptionsResponse = {
  ok?: boolean;
  workCategories?: WorkCategoryOption[];
  workTypes?: WorkTypeOption[];
  riskLevels?: string[];
  permitTypes?: string[];
  workShifts?: string[];
  tbmSurvey?: TbmSurveyConfig;
};

type TbmSurveyQuestionConfig = {
  key: keyof Omit<AdditionalTbmInputs, "specialNotes">;
  label: string;
  outputLabel: string;
  helperText: string;
};

type TbmSurveyOptionConfig = {
  questionKey: keyof Omit<AdditionalTbmInputs, "specialNotes">;
  driverType: "default" | "category" | "workType" | "risk" | "shift";
  driverValue: string;
  label: string;
};

type TbmSurveyConfig = {
  questions: TbmSurveyQuestionConfig[];
  options: TbmSurveyOptionConfig[];
};

type SiteOption = {
  siteId: number;
  siteName: string;
};

type SiteListResponse = {
  ok?: boolean;
  rows?: SiteOption[];
};

type CreateSiteResponse = {
  ok?: boolean;
  row?: SiteOption;
  message?: string;
};

type SiteSearchResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
};

type SiteSearchResponse = {
  ok?: boolean;
  rows?: SiteSearchResult[];
  message?: string;
};

type GenerateTbmResponse = {
  ok?: boolean;
  draft?: string;
  historyId?: number;
  message?: string;
};

type TbmSignatureData = {
  checklist: Record<string, boolean>;
  workerSignature: string;
  supervisorSignature: string;
  signedAt: string | null;
};

const pageBg = "#ffffff";
const pageGradient = "linear-gradient(180deg, #ffffff 0%, #ffffff 100%)";
const panelBg = "#ffffff";
const panelBorder = "#ffb4a2";
const panelText = "#11344a";
const mutedText = "#5f7482";
const accentBlue = "#d32f2f"; // 메인 빨강
const accentBlueHover = "#b71c1c";
const actionSky = "#ef6c00";        // 버튼은 주황
const actionSkyHover = "#e65100";
const inputBg = "#f7fdff";
const inputBorder = "#ffccbc";
const inputText = "#11344a";
const inputPlaceholder = "#7fa0af";
const previewPanelBg = "#fff8f2";
const previewSurfaceBg = "#ffffff";
const previewSurfaceBorder = "#ffcc80";
const previewScriptAccent = "#d32f2f";      // 제목 빨강
const previewScriptBorder = "#ffb74d";      // 테두리 주황
const previewScriptHeaderBg = "#fff3e0";    // 헤더 연주황
const cardGradientBorder = "#ffb74d";
const cardGradient =
  "linear-gradient(135deg, #ffffff 0%, #fff8f2 45%, #fff0eb 100%)";
const chipGradient =
  "linear-gradient(160deg, #ffffff 0%, #fff3e0 100%)";
const cardRadius = 2;
const chipRadius = 2;
const surveyCardAccents = [
  "#d32f2f",
  "#e53935",
  "#ef5350",
  "#f57c00",
  "#fb8c00",
  "#ff7043",
  "#bf360c",
];
const surveyCardTints = [
  "#ffebee",
  "#fff3e0",
  "#fff8e1",
  "#fbe9e7",
  "#fff5f5",
  "#fff8f2",
  "#fef2f2",
];
const selectionPalettes = [
  { solid: "#f9a825", light: "#fff8e1", shadow: "rgba(249,168,37,0.25)" }, // LOW
  { solid: "#fbc02d", light: "#fffde7", shadow: "rgba(251,192,45,0.25)" }, // MEDIUM
  { solid: "#ffa000", light: "#fff3e0", shadow: "rgba(255,160,0,0.25)" }, // HIGH
  { solid: "#d32f2f", light: "#ffebee", shadow: "rgba(211,47,47,0.25)" }, // CRITICAL
  { solid: "#c62828", light: "#fdecea", shadow: "rgba(198,40,40,0.25)" }, // 여분
];
const getTodayDate = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const TIME_STEP_MINUTES = 30;

const splitWorkTime = (shift: string): [string, string] => {
  const [startTime = "00:00", endTime = "00:00"] = shift
    .split("~")
    .map((value) => value.trim());

  return [startTime || "00:00", endTime || "00:00"];
};

const combineWorkTime = (startTime: string, endTime: string): string =>
  `${startTime} ~ ${endTime}`;

const changeTimeByMinutes = (time: string, amount: number): string => {
  const [hourText, minuteText] = time.split(":");

  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return "00:00";
  }

  const totalMinutes = hour * 60 + minute;
  const nextTotalMinutes =
    (totalMinutes + amount + 24 * 60) % (24 * 60);

  const nextHour = Math.floor(nextTotalMinutes / 60);
  const nextMinute = nextTotalMinutes % 60;

  return `${String(nextHour).padStart(2, "0")}:${String(
    nextMinute
  ).padStart(2, "0")}`;
};

const WORK_TYPE_DESCRIPTIONS: Record<string, string> = {
  //설비 작업
  "설비 정비": "설비의 성능 유지 및 고장 수리 작업",
  "배관 작업": "배관 설치·보수·교체 작업",
  "설비 설치": "신규 설비 설치 및 시운전 작업",
  "설비 철거": "기존 설비 해체 및 제거 작업",
  "설비 교체": "노후·고장 설비 교체 작업",
  "설비 점검": "설비 이상 여부 및 작동 상태 확인 작업",

  //전기 작업
  "전기설비 설치": "신규 전기설비 설치 및 시운전 작업",
  "정비": "전기설비의 성능 유지 및 고장 수리 작업",
  "점검": "전기설비 이상 여부 및 작동 상태 확인 작업",
  "배선·결선": "전선 포설 및 전기기기 연결 작업",
  "교체": "노후·고장 전기설비 교체 작업",
  "차단·복전": "전원 차단 및 안전한 전원 복구 작업",

  //화기 작업
  "용접": "금속을 용융하여 접합하는 작업",
  "용단": "화염 또는 열을 이용해 금속을 절단하는 작업",
  "연마": "연마 공구를 이용해 표면을 가공하거나 다듬는 작업",
  "가열": "열을 가해 재료를 가공하거나 성형하는 작업",
  "화염·스파크 발생 작업": "화염이나 불꽃이 발생하는 작업",

  //운반*양중 작업
  "중량물 취급": "중량물을 이동·취급하는 작업",
  "크레인": "크레인을 이용해 자재를 인양·이동하는 작업",
  "지게차": "지게차를 이용해 자재를 운반·적재하는 작업",
  "인양": "장비를 이용해 자재나 설비를 들어 올리는 작업",
  "상·하차": "자재를 차량에 싣거나 내리는 작업",
  "자재 운반": "자재를 작업 장소로 이동하는 작업",

  //고소 작업
  "설치 작업": "고소작업대 등을 이용해 설비·구조물을 설치하는 작업",
  "해체·철거 작업": "고소 작업 환경에서 설비·구조물을 해체하거나 철거하는 작업",
  "점검·검사 작업": "고소 작업 환경에서 설비 및 구조물의 이상 여부를 확인하는 작업",
  "정비·보수 작업": "고소 작업 환경에서 설비를 정비하거나 보수하는 작업",
  "도장·방수 작업": "고소 작업 환경에서 도장 및 방수 시공을 수행하는 작업",
  "지붕 작업": "지붕 위에서 설치·보수·점검 등을 수행하는 작업",

  //밀폐공간 작업
  "맨홀": "맨홀 내부에서 점검·보수 등을 수행하는 작업",
  "탱크": "탱크 내부에서 점검·청소·정비 등을 수행하는 작업",
  "용기(Vessel)": "용기 내부에서 점검·정비·세척 등을 수행하는 작업",
  "피트(Pit)": "피트 내부에서 점검·보수 등을 수행하는 작업",
  "배관 내부 출입": "배관 내부에 출입하여 점검·정비 등을 수행하는 작업",
  "덕트 내부 작업": "덕트 내부에서 점검·청소·보수 등을 수행하는 작업",
  "암거(지하 공동구)": "지하 공동구 내부에서 점검·설비 작업 등을 수행하는 작업",

  //굴착*토목 작업
  "굴착": "토사를 굴착하여 작업 공간을 확보하는 작업",
  "흙막이": "굴착면 붕괴 방지를 위해 흙막이 구조물을 설치하는 작업",
  "매설물 주변 작업": "지하 매설물 주변에서 안전하게 굴착·보수하는 작업",
  "되메우기": "굴착 후 토사를 되메워 원상 복구하는 작업",
  "지반 다짐": "지반을 다져 안정성과 지지력을 확보하는 작업",

  //화학물질 작업
  "유해화학물질 취급": "유해화학물질을 안전하게 취급·관리하는 작업",
  "주입·충전": "화학물질을 설비나 용기에 주입·충전하는 작업",
  "배출": "화학물질을 안전 절차에 따라 배출하는 작업",
  "세정": "화학물질을 이용하거나 제거하여 설비를 세척하는 작업",
  "샘플링": "화학물질 시료를 채취하여 분석하는 작업",
  "누출 대응": "화학물질 누출 발생 시 확산 방지 및 초기 조치를 수행하는 작업",

  //생산*공정 작업
  "공정 운전": "생산설비를 정상 운전하여 제품을 생산하는 작업",
  "공정 가동": "생산공정을 시작하고 설비를 가동하는 작업",
  "공정 정지": "생산공정을 안전 절차에 따라 정지하는 작업",
  "공정 전환": "생산 품목이나 운전 조건을 변경하는 작업",
  "이상상태 대응": "공정 이상 발생 시 안전하게 조치하는 작업",
  "공정 점검·순찰": "생산공정과 설비의 이상 여부를 점검하는 작업",

  //검사*계측 작업
  "비파괴검사": "설비를 손상시키지 않고 결함을 검사하는 작업",
  "계측기 점검": "계측기의 이상 여부와 작동 상태를 확인하는 작업",
  "압력·누설시험": "설비의 압력 유지 및 누설 여부를 확인하는 작업",
  "가스측정": "작업 환경의 가스 농도를 측정하는 작업",
  "계기 교정": "계측기의 측정 정확도를 보정하는 작업",
};

const DEFAULT_AUTO_PROMPT = `TBM 리더 멘트를 아래 9단계 현장 진행 형식으로 작성합니다.
### 인사
### 건강
### 작업
### 위험
### 조치
### 사례
### 의견
### 비상
### 지적확인
TBM 대본 어투는 아래 권장 표현을 기준으로 작성합니다.
- 인사: "안녕하십니까?"
- 지시: "확인해 주시기 바랍니다."
- 질문: "착용하셨습니까?"
- 마무리: "안전하게 작업하시기 바랍니다."
보고서체 표현인 "있음", "한다", "있다", "된다", "이다"로 문장을 끝내지 말고, 반드시 현장 리더가 말하는 존댓말인 "있습니다", "합니다", "됩니다", "입니다"로 작성합니다.
실제 리더가 현장에서 구두로 진행하는 멘트 어투로 작성하고, 오늘 작업종류/작업장소/위험요인/보호구 정보를 반영합니다.
"작업" 단계는 오늘 작업장소, 작업종류, 작업순서를 간단히 공유합니다.
"위험" 단계는 오늘 작업에서 가장 중요한 위험요인을 별도로 강조합니다.
"조치" 단계는 보호구, 작업허가, 통제구역, LOTO 등 필요한 조치를 확인합니다.
"사례" 단계는 오늘 작업과 유사한 사고사례와 교훈을 짧게 전달합니다.
"의견" 단계는 작업자가 의견이나 질문을 말할 수 있도록 진행합니다.
"지적확인" 단계는 선창-후창 구호 형식을 포함하되, 감탄 구호는 넣지 않습니다.`;
const INITIAL_PRESET: TbmPreset = {
  workType: "",
  permitType: "",
  risk: "",
  shift: "00:00 ~ 00:00",
  workDate: getTodayDate(),
  location: ""
};

const INITIAL_ADDITIONAL_INPUTS: AdditionalTbmInputs = {
  workerCount: "",
  supervisorName: "",
  equipment: "",
  requiredPpe: "",
  detailedWork: "",
  siteHazards: "",
  safetyMeasures: "",
  emergencyNotes: "",
  specialNotes: ""
};

const INITIAL_FOLLOW_UP_OTHER_INPUTS: FollowUpOtherInputs = {};

type ScriptTemplateItem = {
  title: string;
  subtitle?: string;
};

const SCRIPT_TEMPLATE: ScriptTemplateItem[] = [
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

const SIGNATURE_CHECKLIST_ITEMS = ["PPE 확인", "LOTO 확인", "위험요인 숙지"] as const;

const MINUTES_SECTION_LABELS = [
  "잠재위험요인",
  "중점위험요인",
  "대책",
  "작업 전 안전조치 확인",
  "작업 후 종료 미팅",
  "참석자 확인"
] as const;

const SCRIPT_SECTION_ALIAS_MAP: Record<string, string[]> = {
  인사: [
    "1. 작업장소 이동",
    "1. 작업장소 이동(인사/체조)",
    "작업장소 이동(인사/체조)",
    "작업장소 이동 (인사/체조)",
    "작업장소 이동",
    "인사",
    "1. 인사"
  ],
  건강: ["2. 건강상태 확인", "건강상태 확인", "건강", "2. 건강"],
  작업: [
    "3. 작업내용 공유",
    "작업내용",
    "3. 작업",
    "작업",
    "작업내용, 위험요인, 작업절차 확인"
  ],
  위험: ["4. 핵심 위험요인", "핵심 위험요인", "위험", "4. 위험", "잠재위험요인"],
  조치: ["5. 안전조치 확인", "안전조치 확인", "조치", "5. 조치", "보호구 착용상태 확인", "보호구", "PPE"],
  사례: [
    "6. 유사 사고사례",
    "유사 사고 사례",
    "유사 사고사례",
    "사례",
    "6. 사례",
    "사고사례",
    "중점위험요인"
  ],
  의견: [
    "7. 의견 및 질의응답",
    "의견 및 질의응답",
    "의견",
    "7. 의견",
    "질의응답",
    "질의 응답",
    "Q&A",
    "작업 후 종료 미팅"
  ],
  비상: ["8. 비상대피요령", "비상대피요령", "비상대피", "비상 시 대피요령", "비상", "8. 비상", "대피"],
  지적확인: ["9. 지적확인", "숙지여부 확인", "속지여부 확인", "참석자 확인"]
};

const MINUTES_SECTION_ALIAS_MAP: Record<string, string[]> = {
  잠재위험요인: ["위험", "4. 위험", "핵심 위험요인", "잠재위험요인"],
  중점위험요인: ["사례", "6. 사례", "사고사례", "중점위험요인"],
  대책: ["조치", "5. 조치", "통제조치", "대책"],
  "작업 전 안전조치 확인": ["체크리스트/서명", "작업 전 안전조치 확인", "PPE", "LOTO"],
  "작업 후 종료 미팅": ["의견", "7. 의견", "작업 후 종료 미팅"],
  "참석자 확인": ["지적확인", "9. 지적확인", "참석자 확인"]
};

const KOREAN_WEEKDAYS_FE = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

const formatWorkDateForGreetingFE = (workDate: string): string | null => {
  if (!workDate) return null;
  const parsed = new Date(`${workDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getMonth() + 1}월 ${parsed.getDate()}일 ${KOREAN_WEEKDAYS_FE[parsed.getDay()]}`;
};

const WORK_PROCEDURE_STEPS_BY_KEYWORD: Array<{ keywords: string[]; steps: string[] }> = [
  {
    keywords: ["화기", "용접", "절단"],
    steps: [
      "① 화재감시자를 배치하고 소화기, 방화포 등 화재 대비 장비를 비치합니다.",
      "② 주변 가연물을 제거하고 가스농도를 측정한 후 화기작업허가서에 따라 작업을 개시합니다.",
      "③ 작업 중 불꽃이나 스파크가 주변으로 튀지 않도록 통제하고 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
      "④ 작업 종료 후 잔불감시를 실시하여 방치된 불씨가 없는지 확인하고 정리 상태를 확인한 뒤 철수합니다."
    ]
  },
  {
    keywords: ["전기", "계장", "수배전"],
    steps: [
      "① 작업 전 차단기를 개방하고 잠금(LOTO) 조치 후 검전기로 무전압 상태를 확인합니다.",
      "② 접지를 설치하고 절연 보호구 착용상태를 상호 점검합니다.",
      "③ 단계별 작업을 순서대로 진행하며 활선 접근 등 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
      "④ 작업 종료 후 잠금장치를 해제하고 전원 투입 전 최종 점검을 실시한 뒤 철수합니다."
    ]
  },
  {
    keywords: ["운반", "크레인", "지게차", "중량물"],
    steps: [
      "① 인양·운반 장비와 줄걸이 상태를 점검하고 신호수를 배치합니다.",
      "② 작업반경 내 통제구역을 설정하고 통행자 접근을 차단합니다.",
      "③ 신호수의 유도에 따라 서서히 이동하며 흔들림, 전복 등 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
      "④ 작업 종료 후 장비를 정위치에 거치하고 결속 상태를 확인한 뒤 철수합니다."
    ]
  },
  {
    keywords: ["밀폐", "고소", "굴착", "화학물질", "방사선", "복합"],
    steps: [
      "① 작업허가서와 작업별 특수조건(산소농도 측정, 추락방지, 지반 상태 등)을 확인합니다.",
      "② 작업반경 내 위험요인을 제거하고 보호구 착용상태를 상호 점검합니다.",
      "③ 단계별 작업을 순서대로 진행하며 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
      "④ 작업 종료 후 잔존 위험요인을 재점검하고 정리 상태를 확인한 뒤 철수합니다."
    ]
  }
];

const DEFAULT_WORK_PROCEDURE_STEPS_FE = [
  "① 설비 정지 및 LOTO 상태를 확인하고 잔류 압력·온도·유체를 제거합니다.",
  "② 작업반경 내 위험요인을 제거하고 보호구 착용상태를 상호 점검합니다.",
  "③ 단계별 작업을 순서대로 진행하며 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
  "④ 작업 종료 후 복구 상태와 잔존 위험요인을 재점검하고 정리 상태를 확인한 뒤 철수합니다."
];

const pickWorkProcedureStepsFE = (workType: string): string[] => {
  const matched = WORK_PROCEDURE_STEPS_BY_KEYWORD.find((entry) =>
    entry.keywords.some((keyword) => workType.includes(keyword))
  );
  return matched ? matched.steps : DEFAULT_WORK_PROCEDURE_STEPS_FE;
};

const normalizeRiskKey = (risk: string): string => {
  if (risk.includes("CRITICAL")) return "CRITICAL";
  if (risk.includes("HIGH")) return "HIGH";
  if (risk.includes("MEDIUM")) return "MEDIUM";
  return "LOW";
};

const getWorkShiftDriverValue = (shift: string): string => {
  const [startTime] = splitWorkTime(shift);
  const startHour = Number(startTime.split(":")[0]);

  if (Number.isNaN(startHour)) {
    return "주간";
  }

  return startHour >= 18 || startHour < 6
    ? "야간"
    : "주간";
};

const fillSurveyHelperText = (template: string, preset: TbmPreset): string =>
  template
    .replace(/\{workType\}/g, preset.workType || "작업종류")
    .replace(/\{risk\}/g, preset.risk || "위험등급")
    .replace(/\{shift\}/g, preset.shift || "작업시간");

const pickSurveyDriverCandidates = (
  questionKey: FollowUpQuestion["key"],
  preset: TbmPreset,
  categoryCode: string,
  workTypeCode: string
): Array<{ driverType: TbmSurveyOptionConfig["driverType"]; driverValue: string }> => {
  const workTypeDriver = workTypeCode
    ? [{ driverType: "workType" as const, driverValue: workTypeCode }]
    : [];

  if (["equipment", "requiredPpe", "detailedWork", "siteHazards"].includes(questionKey)) {
    return [...workTypeDriver, { driverType: "category", driverValue: categoryCode }];
  }
  if (questionKey === "safetyMeasures") {
    return [...workTypeDriver, { driverType: "risk", driverValue: normalizeRiskKey(preset.risk) }];
  }
  if (questionKey === "emergencyNotes") {
    return [
      {
        driverType: "shift",
        driverValue: getWorkShiftDriverValue(
          preset.shift
        )
      }
    ];
  }
  return [{ driverType: "default", driverValue: "default" }];
};

const buildFollowUpQuestions = (
  preset: TbmPreset,
  categoryCode: string,
  workTypeCode: string,
  surveyConfig: TbmSurveyConfig | null
): FollowUpQuestion[] =>
  (surveyConfig?.questions ?? []).map((question) => {
    const driverCandidates = pickSurveyDriverCandidates(
      question.key,
      preset,
      categoryCode,
      workTypeCode
    );
    const options =
      driverCandidates
        .map((driver) =>
          (surveyConfig?.options ?? [])
            .filter(
              (option) =>
                option.questionKey === question.key &&
                option.driverType === driver.driverType &&
                option.driverValue === driver.driverValue
            )
            .map((option) => option.label)
        )
        .find((items) => items.length > 0) ?? [];

    return {
      key: question.key,
      label: question.label,
      outputLabel: question.outputLabel,
      helperText: fillSurveyHelperText(question.helperText, preset),
      options
    };
  });

const getShiftLabelFE = (shift: string): string => {
  if (!shift) return "작업 전";

  if (shift.includes("~")) {
    return `${shift} 작업 전`;
  }

  if (shift === "야간") return "야간";
  if (shift === "주간") return "주간";

  return shift;
};

const buildScriptSectionFallback = (title: string, preset: TbmPreset): string => {
  const location = preset.location || "현장";
  const workType = preset.workType || "해당 작업";

  switch (title) {
    case "인사": {
      const datePart = formatWorkDateForGreetingFE(preset.workDate);
      const shiftLabel = getShiftLabelFE(preset.shift);

      const greeting = datePart
        ? `안녕하십니까? ${datePart} ${location} ${shiftLabel} TBM을 시작하겠습니다.`
        : `안녕하십니까? ${location} ${shiftLabel} TBM을 시작하겠습니다.`;

      return `${greeting}
    간단한 스트레칭으로 굳은 몸을 풀어 주시기 바랍니다.
    목 돌리기부터 시작하겠습니다. 어깨, 허리, 무릎, 손목 및 발목 순으로 크게 따라 해 주시기 바랍니다.`;
    }
    case "건강":
      return `체조 중 몸에 이상이 느껴지는 분 있으십니까? 어제 늦게까지 술을 드신 분은 없으십니까?\n열이 나거나 평소와 달리 몸 상태가 좋지 않은 분은 지금 말씀해 주시기 바랍니다.`;
    case "작업": {
      const procedureSteps = pickWorkProcedureStepsFE(workType).join("\n");
      return `다음은 오늘 작업내용을 공유하겠습니다.\n오늘 작업은 ${location}에서 진행하는 ${workType} 작업입니다.\n작업순서는 다음과 같습니다.\n${procedureSteps}\n각 단계별 담당자와 신호체계를 확인하고, 변경사항이 있으면 즉시 공유해 주시기 바랍니다.`;
    }
    case "위험":
      return `다음은 핵심 위험요인을 확인하겠습니다.\n오늘 작업의 핵심 위험요인은 협착, 추락, 화재 등 ${workType} 작업 중 발생할 수 있는 중대 위험입니다.\n위험징후가 보이면 즉시 작업을 멈추고 주변 작업자에게 알려 주시기 바랍니다.`;
    case "조치":
      return `다음은 안전조치 사항을 확인하겠습니다.\n작업허가서, 통제구역, 작업 전 점검 상태를 확인해 주시기 바랍니다.\n안전모, 안전화, 장갑 등 보호구를 모두 착용하셨습니까?\nLOTO, 소화기, 신호수 배치 등 해당 작업에 필요한 안전조치가 완료되었는지 다시 한 번 확인해 주시기 바랍니다.`;
    case "사례":
      return `유사 사고사례를 공유하겠습니다.\n유사한 ${workType} 작업에서 작업 전 확인이 부족해 협착, 추락, 화재 등의 사고가 발생한 사례가 있습니다.\n사고의 공통 원인은 위험요인 확인 부족과 안전조치 미준수였습니다.\n오늘 작업에서는 같은 실수가 반복되지 않도록 작업 전 확인과 상호 점검을 철저히 해 주시기 바랍니다.`;
    case "의견":
      return `다음은 의견 및 질의응답 시간입니다.\n오늘 작업내용, 위험요인, 안전조치 중 이해가 되지 않거나 추가로 확인할 사항이 있으면 말씀해 주시기 바랍니다.\n작업 중에도 의문사항이나 위험요인을 발견하면 즉시 반장에게 공유해 주시기 바랍니다.`;
    case "비상":
      return `다음은 비상대피요령을 확인하겠습니다. 비상 대피로는 현장에 사전 지정된 비상계단을 이용해 주시기 바랍니다.\n밖으로 대피 후에는 지정된 비상집결지로 모여 주시기 바랍니다.\n그리고 현재 작업 위치 인근의 소화기 위치도 작업 전 반드시 확인해 주시기 바랍니다.\n작업 전 대피로와 집결지, 소화기 위치를 반드시 확인해 주시기 바랍니다.`;
    case "지적확인": {
      const chant = `${workType} 안전수칙 준수하겠습니다!`;
      return `오늘 가장 중요한 위험 포인트를 다시 한 번 확인하겠습니다.\n오늘 작업의 핵심 위험요인과 안전대책을 다시 한 번 상기하는 의미에서 지적확인은 "${chant}"로 진행하겠습니다.\n지적확인을 준비해 주시기 바랍니다.\n"${chant}" (선창 1회)\n"${chant}" (후창 x 3회)`;
    }
    default:
      return "";
  }
};

const splitDraftBlocks = (draft: string): string[] =>
  draft
    .split(/\n\s*\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

const extractPrimaryScriptText = (draft: string): string => {
  const startMarker = "## 2. TBM 대본(생성 결과)";
  const fallbackEndMarkers = [
    "\n=== 구분선 ===",
    "\n# TBM 회의록",
    "\n## 1. 회의 개요",
    "### Safety Logic Check",
    "### 기상 특보 대응",
    "### PPE 체크리스트",
    "### 체크리스트/서명"
  ];

  let body = draft;
  const startIndex = draft.indexOf(startMarker);
  if (startIndex >= 0) {
    body = draft.slice(startIndex + startMarker.length).trim();
  }

  let endIndex = body.length;
  for (const marker of fallbackEndMarkers) {
    const idx = body.indexOf(marker);
    if (idx >= 0 && idx < endIndex) {
      endIndex = idx;
    }
  }

  return body.slice(0, endIndex).trim();
};

const normalizeDedupKey = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[.,!?~:;"'`“”‘’()\[\]{}<>|/\\\-_=+*]/g, "")
    .replace(/\s+/g, "")
    .trim();

const toNgramSet = (value: string, n = 3): Set<string> => {
  if (value.length <= n) return new Set([value]);
  const grams = new Set<string>();
  for (let index = 0; index <= value.length - n; index += 1) {
    grams.add(value.slice(index, index + n));
  }
  return grams;
};

const isLikelyDuplicateLine = (left: string, right: string): boolean => {
  const leftKey = normalizeDedupKey(left);
  const rightKey = normalizeDedupKey(right);
  if (!leftKey || !rightKey) return false;
  if (leftKey === rightKey) return true;

  const minLength = Math.min(leftKey.length, rightKey.length);
  if (minLength >= 10 && (leftKey.includes(rightKey) || rightKey.includes(leftKey))) {
    return true;
  }

  const leftSet = toNgramSet(leftKey, 3);
  const rightSet = toNgramSet(rightKey, 3);
  let intersection = 0;
  leftSet.forEach((gram) => {
    if (rightSet.has(gram)) intersection += 1;
  });
  const union = leftSet.size + rightSet.size - intersection;
  const jaccard = union === 0 ? 0 : intersection / union;
  const lengthRatio = minLength / Math.max(leftKey.length, rightKey.length);
  return jaccard >= 0.82 && lengthRatio >= 0.75;
};

const dedupeLinesBySimilarity = (lines: string[]): string[] => {
  const kept: string[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const duplicated = kept.some((existing) => isLikelyDuplicateLine(existing, trimmed));
    if (!duplicated) {
      kept.push(trimmed);
    }
  });
  return kept;
};

const mergeUniqueLines = (base: string, addition: string): string => {
  const baseLines = base
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const additionLines = addition
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return dedupeLinesBySimilarity([...baseLines, ...additionLines])
    .join("\n")
    .trim();
};

const collapseContextRestatements = (content: string, preset: TbmPreset): string => {
  const location = preset.location.trim();
  const workType = preset.workType.trim();
  if (!content || !location || !workType) return content;

  let keptCombinedMention = false;
  const lines = content.split("\n").filter((line) => {
    const mentionsBoth = line.includes(location) && line.includes(workType);
    if (!mentionsBoth) return true;
    if (keptCombinedMention) return false;
    keptCombinedMention = true;
    return true;
  });
  return lines.join("\n");
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
    .replace(/준수해야 한다/g, "준수해야 합니다")
    .replace(/착용해야 한다/g, "착용해야 합니다")
    .replace(/확인해야 한다/g, "확인해야 합니다")
    .replace(/진입시켜야 한다/g, "진입시켜야 합니다")
    .replace(/([가-힣]+)한다(?=[.!?]|$)/g, "$1합니다")
    .replace(/있다(?=[.!?]|$)/g, "있습니다")
    .replace(/된다(?=[.!?]|$)/g, "됩니다")
    .replace(/이다(?=[.!?]|$)/g, "입니다");

const cleanPreviewContent = (value: string): string => {
  const cleaned = value
    .split("\n")
    .map((line) =>
      line
        .replace(/^>+\s*/, "")
        .replace(/^#{1,6}\s*/, "")
        .replace(/^\*+\s*/, "")
        .replace(/^-\s*/, "")
        .replace(/^\[\s*[xX ]?\s*\]\s*/, "")
        .replace(/^\[[^\]]+\]\s*/, "")
        .replace(/^\d+\.\s*/, "")
        .replace(/\*+/g, "")
        .replace(/["“”]/g, "")
        .replace(/[^\S\r\n]{2,}/g, " ")
        .trimEnd()
    )
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return true;
      if (/^#{1,6}\s*(tbm|tool\s*box|회의록|대본)/i.test(trimmed)) return false;
      if (/^(tbm\s*대본|tbm\s*회의록|tool\s*box\s*meeting)$/i.test(trimmed)) return false;
      if (/^safety logic check$/i.test(trimmed)) return false;
      return true;
    })
    .join("\n")
    .trim();

  const paragraphSeen = new Set<string>();
  const dedupedParagraphs = cleaned
    .split(/\n\s*\n+/)
    .map((paragraph) =>
      (() => {
        const lines = paragraph
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean);
        return dedupeLinesBySimilarity(lines).join("\n").trim();
      })()
    )
    .filter((paragraph) => {
      if (!paragraph) return false;
      const normalized = normalizeDedupKey(paragraph);
      if (paragraphSeen.has(normalized)) return false;
      paragraphSeen.add(normalized);
      return true;
    });

  const globalKeptLines: string[] = [];
  const globallyDedupedParagraphs = dedupedParagraphs
    .map((paragraph) => {
      const localLines = dedupeLinesBySimilarity(
        paragraph
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
      );
      const filteredLines = localLines.filter((line) => {
        const duplicated = globalKeptLines.some((existing) =>
          isLikelyDuplicateLine(existing, line)
        );
        if (duplicated) return false;
        globalKeptLines.push(line);
        return true;
      });
      return filteredLines.join("\n").trim();
    })
    .filter(Boolean);

  return normalizeTbmSpeechTone(globallyDedupedParagraphs.join("\n\n")).trim();
};

// 한 줄에 여러 문장이 붙어 나오는 경우, 문장부호(./!/?) 뒤에서 줄바꿈해 한 줄에 한 문장만 보이게 한다.
// 소수점(27.9°C)이나 말줄임표(...)는 문장 경계로 보지 않는다.
const splitSentencesIntoLines = (content: string): string =>
  content
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;

      let result = "";
      for (let i = 0; i < trimmed.length; i += 1) {
        const ch = trimmed[i];
        result += ch;
        if (ch === "." || ch === "!" || ch === "?") {
          const prevChar = trimmed[i - 1] ?? "";
          const nextChar = trimmed[i + 1] ?? "";
          const isDecimalPoint = ch === "." && /\d/.test(prevChar) && /\d/.test(nextChar);
          const nextIsPunct = nextChar === "." || nextChar === "!" || nextChar === "?";
          const restHasContent = /\S/.test(trimmed.slice(i + 1));
          if (!isDecimalPoint && !nextIsPunct && restHasContent) {
            result += "\n";
            while (trimmed[i + 1] === " ") {
              i += 1;
            }
          }
        }
      }
      return result.trim();
    })
    .join("\n");

// 체크박스 표기(- [ ])는 허용하되, 견본 대괄호("[배관 용접]" 등), 영어 단어 잔존(today, scheduled 등),
// 키릴 문자(로컬 LLM이 드물게 흘리는 러시아어 등) 잔존이 남아있으면 신뢰할 수 없는 문장으로 보고
// 결정론적 폴백으로 교체한다.
const ALLOWED_ENGLISH_TERMS = /\b(PPE|LOTO|TBM|KOSHA|MSDS|PTW|HIGH|MEDIUM|LOW)\b/gi;
// "KOSHA-MIA-201702" 같은 공식 사고사례 코드는 영어 대문자+숫자 조합이라 오탐 대상이 되기 쉬우므로
// 통째로 예외 처리한다.
const CASE_CODE_PATTERN = /\b[A-Z]{2,8}(?:-[A-Z0-9]{1,10}){1,3}\b/g;
const containsForeignArtifact = (content: string): boolean => {
  const withoutCheckboxes = content.replace(/[-*]\s*\[[ xX]?\]/g, "");
  if (/\[[^[\]]*[가-힣][^[\]]*\]/.test(withoutCheckboxes)) return true;
  if (/\p{Script=Cyrillic}/u.test(content)) return true;
  // 한자(중국어)와 히라가나/가타카나(일본어)가 섞여 나오는 경우도 신뢰할 수 없는 문장으로 간주한다.
  if (/\p{Script=Han}/u.test(content)) return true;
  if (/\p{Script=Hiragana}/u.test(content)) return true;
  if (/\p{Script=Katakana}/u.test(content)) return true;
  const withoutCaseCodes = content.replace(CASE_CODE_PATTERN, "");
  const withoutAllowedTerms = withoutCaseCodes.replace(ALLOWED_ENGLISH_TERMS, "");
  return /[A-Za-z]{3,}/.test(withoutAllowedTerms);
};

const normalizeScenarioSectionContent = (
  title: string,
  content: string,
  preset: TbmPreset
): string => {
  const fallback = buildScriptSectionFallback(title, preset);
  if (!content) return fallback;
  if (containsForeignArtifact(content)) return fallback;

  if (title === "건강") {
    const containsCoreMeaning = /건강|컨디션|음주|수면|두통|어지럼|이상.?증상|몸\s*상태|체조/i.test(
      content
    );
    if (!containsCoreMeaning || content.replace(/\s+/g, "").length < 20) {
      return fallback;
    }
    return content;
  }

  if (title === "작업") {
    // 특정 키워드 포함 여부보다는 최소 분량만 확인한다. 작업순서, 담당자, 작업범위 등
    // 표현 방식이 다양할 수 있어 내용 자체의 유무만 확인한다.
    if (content.replace(/\s+/g, "").length < 30) {
      return fallback;
    }
    return content;
  }

  if (title === "위험") {
    const containsCoreMeaning = /위험|협착|추락|화재|감전|질식|전도|낙하|끼임|중대/i.test(content);
    if (!containsCoreMeaning) {
      return fallback;
    }
    return content;
  }

  if (title === "조치") {
    const containsCoreMeaning =
      /안전조치|보호구|착용|안전모|안전화|장갑|보안경|마스크|loto|ppe|허가서|통제구역|소화기/i.test(
        content
      );
    if (!containsCoreMeaning) {
      return fallback;
    }
    return content;
  }

  if (title === "사례") {
    const containsCoreMeaning = /사고|사례|재해|교훈|원인|유사/i.test(content);
    if (!containsCoreMeaning) {
      return fallback;
    }
    return content;
  }

  if (title === "의견") {
    const containsCoreMeaning = /의견|질문|질의|응답|확인|말씀|공유/i.test(content);
    if (!containsCoreMeaning || content.replace(/\s+/g, "").length < 15) {
      return fallback;
    }
    return content;
  }

  if (title === "비상") {
    const containsCoreMeaning = /비상|대피|집결|소화기|신고|보고|작업\s*중지/i.test(content);
    if (!containsCoreMeaning) {
      return fallback;
    }
    return content;
  }

  if (title === "지적확인") {
    if (content.replace(/\s+/g, "").length < 15) {
      return fallback;
    }
    return content;
  }

  return content;
};

const normalizeSectionLabel = (value: string): string =>
  value
    .replace(/\(.*?\)/g, "")
    .replace(/[\[\]【】]/g, "")
    .replace(/[：:]/g, "")
    .replace(/\s+/g, "")
    .trim();

const normalizeHeadingLine = (line: string): string =>
  line
    .replace(/^>+\s*/, "")
    .replace(/^#{1,6}\s*/, "")
    .replace(/^\d+\s*[.)]\s*/, "")
    .replace(/^[\-*•]\s*/, "")
    .trim();

// "작업", "위험", "조치"처럼 9단계 제목이 흔한 한 단어라 본문 문장 첫머리와 우연히 겹칠 수 있다.
// 실제 마크다운 헤더(### ...)로 쓰인 줄만 섹션 헤더 후보로 인정해 오탐을 막는다.
const isMarkdownHeadingLine = (line: string): boolean =>
  /^#{1,6}\s/.test(line.replace(/^>+\s*/, ""));

const detectSectionFromAliasMap = (
  line: string,
  aliasMap: Record<string, string[]>
): string | null => {
  if (!isMarkdownHeadingLine(line)) return null;
  const normalizedLine = normalizeSectionLabel(normalizeHeadingLine(line));
  if (!normalizedLine) return null;

  for (const [canonical, aliases] of Object.entries(aliasMap)) {
    const candidates = [canonical, ...aliases];
    const matched = candidates.some((candidate) => {
      const normalizedCandidate = normalizeSectionLabel(candidate);
      return (
        normalizedLine === normalizedCandidate || normalizedLine.startsWith(normalizedCandidate)
      );
    });
    if (matched) {
      return canonical;
    }
  }
  return null;
};

// LLM이 15개 헤더 순서를 뒤섞어 쓰는 경우(예: "작업" 다음에 회의록용 "대책" 헤더가 먼저 나오는 경우),
// 자기 그룹(대본/회의록) 헤더가 아니어도 "다른 쪽" 헤더를 만나면 경계로 인식해 내용이 섞이지 않게 한다.
const extractSectionMapByAliases = (
  draft: string,
  aliasMap: Record<string, string[]>
): Record<string, string> => {
  const labels = Object.keys(aliasMap);
  const boundaryMap = { ...SCRIPT_SECTION_ALIAS_MAP, ...MINUTES_SECTION_ALIAS_MAP };
  const map = Object.fromEntries(labels.map((label) => [label, ""])) as Record<string, string>;
  const buckets = Object.fromEntries(labels.map((label) => [label, [] as string[]])) as Record<
    string,
    string[]
  >;

  let activeLabel: string | null = null;
  draft.split("\n").forEach((rawLine) => {
    const line = rawLine.trim();
    const detected = detectSectionFromAliasMap(line, boundaryMap);
    if (detected) {
      activeLabel = labels.includes(detected) ? detected : null;
      return;
    }
    if (activeLabel) {
      buckets[activeLabel].push(rawLine.trimEnd());
    }
  });

  labels.forEach((label) => {
    map[label] = buckets[label]
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  });

  return map;
};

const PRODUCTION_PLACEHOLDER = "생성 중입니다.";
// 요청에 따라 회의록 화면은 일단 숨김 처리. 다시 노출하려면 true로 변경.
const SHOW_MINUTES = false;

const darkInputSx = {
  "& .MuiInputBase-root": {
    bgcolor: inputBg,
    color: inputText,
    borderRadius: cardRadius
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: inputBorder
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: accentBlue
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: accentBlue
  },
  "& .MuiInputBase-input::placeholder": {
    color: inputPlaceholder,
    opacity: 1
  },
  "& .MuiInputLabel-root": {
    color: inputPlaceholder
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: accentBlue
  },
  "& .MuiSvgIcon-root": {
    color: mutedText
  }
};

const locationSelectSx = {
  ...darkInputSx,
  "& .MuiInputBase-root": {
    bgcolor: "#ffffff",
    color: panelText,
    borderRadius: cardRadius
  },
  "& .MuiSelect-select": {
    color: panelText,
    fontWeight: 700,
    textShadow: "none"
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: inputBorder
  },
  "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: accentBlue
  },
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: accentBlue
  },
  "& .MuiSvgIcon-root": {
    color: panelText,
    filter: "none"
  }
};

type SelectionChipRowProps = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
  emptyMessage?: string;
  descriptions?: Record<string, string>;
};

function SelectionChipRow({
  options,
  value,
  onChange,
  multiple = false,
  emptyMessage,
  descriptions = {}
}: SelectionChipRowProps) {
  if (options.length === 0) {
    return (
      <Typography sx={{ fontSize: 12, color: mutedText }}>
        {emptyMessage ?? "선택 가능한 항목이 없습니다."}
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 0.9,
        overflowX: "visible",
        pb: 0.25,
        "@media (max-width: 425px)": {
          gap: 0.7
        }
      }}
    >
      {options.map((item, index) => {
        const selectedValues = multiple ? parseMultiSelectValue(value) : [];
        const checked = multiple ? selectedValues.includes(item) : value === item;
        const palette = selectionPalettes[index % selectionPalettes.length];
        const nextValue = () => {
          if (!multiple) {
            return checked ? "" : item;
          }

          const nextValues = checked
            ? selectedValues.filter((selected) => selected !== item)
            : [...selectedValues, item];
          return nextValues.join(MULTI_SELECT_SEPARATOR);
        };

        return (
          <Tooltip
            key={item}
            title={descriptions[item] ?? ""}
            arrow
            placement="top"
            disableHoverListener={!descriptions[item]}
          >
            <Button
              type="button"
              aria-pressed={checked}
              onClick={() => onChange(nextValue())}
              disableRipple
              sx={{
                m: 0,
                px: 1.45,
                py: 0.8,
                minWidth: "fit-content",
                minHeight: 40,
                borderRadius: chipRadius,
                border: `1px solid ${checked ? palette.solid : `${palette.solid}55`}`,
                background: checked
                  ? `linear-gradient(145deg, ${palette.solid} 0%, ${palette.solid}d9 100%)`
                  : `linear-gradient(145deg, #ffffff 0%, ${palette.light} 100%)`,
                boxShadow: checked
                  ? `0 10px 22px ${palette.shadow}, inset 0 1px 0 rgba(255, 255, 255, 0.35)`
                  : "0 4px 12px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
                transition: "all 0.18s ease",
                flexShrink: 0,

                "&:hover": {
                  borderColor: palette.solid,
                  boxShadow: `0 8px 18px ${palette.shadow}`,
                  transform: "translateY(-1px)"
                },

                fontSize: 14,
                fontWeight: checked ? 700 : 600,
                color: checked ? "#ffffff" : panelText,
                whiteSpace: "nowrap",
                textTransform: "none",

                "@media (max-width: 425px)": {
                  px: 1.05,
                  py: 0.7,
                  fontSize: 13
                }
              }}
            >
              {item}
            </Button>
          </Tooltip>
        );
      })}
    </Box>
  );
}

type SurveyFieldHeaderProps = {
  index: number;
  label: string;
};

function SurveyFieldHeader({ index, label }: SurveyFieldHeaderProps) {
  const riskGuide =
    "• LOW: 경미한 부상   • MEDIUM: 부상 가능   • HIGH: 중대재해   • CRITICAL: 치명적 사고";

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        mb: 1,
      }}
    >
      <Typography
        sx={{
          fontSize: 13.5,
          fontWeight: 800,
          color: panelText,
          letterSpacing: "-0.01em",
        }}
      >
        {index}. {label}
      </Typography>

      {label === "위험등급" && (
        <Typography
          sx={{
            mt: 0.3,
            fontSize: 11.5,
            color: mutedText,
            fontWeight: 500,
            lineHeight: 1.4,
          }}
        >
          {riskGuide}
        </Typography>
      )}
    </Box>
  );
}

type SurveyCardProps = {
  index: number;
  label: string;
  children: React.ReactNode;
};

function SurveyCard({ index, label, children }: SurveyCardProps) {
  return (
    <Paper elevation={0} sx={getSurveyFieldPaperSx(index)}>
      <SurveyFieldHeader index={index} label={label} />
      {children}
    </Paper>
  );
}

const surveyFieldPaperSx = {
  borderRadius: cardRadius,
  border: `1px solid ${cardGradientBorder}`,
  background: cardGradient,
  boxShadow:
    "0 12px 24px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.95)",
  p: 1.5,

  "@media (max-width: 425px)": {
    p: 1.15
  }
};

const getSurveyFieldPaperSx = (index: number) => {
  const accent = surveyCardAccents[(index - 1) % surveyCardAccents.length];
  const tint = surveyCardTints[(index - 1) % surveyCardTints.length];

  return {
    ...surveyFieldPaperSx,
    borderLeft: `6px solid ${accent}`,
    background: `linear-gradient(135deg, #ffffff 0%, ${tint} 100%)`,

    "@media (max-width: 425px)": {
      ...surveyFieldPaperSx["@media (max-width: 425px)"],
      borderLeft: `4px solid ${accent}`
    }
  };
};

type SurveyCheckboxFieldProps = {
  index: number;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  emptyMessage?: string;
};

function SurveyCheckboxField({
  index,
  label,
  value,
  onChange,
  options,
  emptyMessage
}: SurveyCheckboxFieldProps) {
  return (
    <SurveyCard index={index} label={label}>
      <SelectionChipRow
        options={options}
        value={value}
        onChange={onChange}
        emptyMessage={emptyMessage}
      />
    </SurveyCard>
  );
}

type WorkTypeCategoryFieldProps = {
  index: number;
  label: string;
  categories: WorkCategoryOption[];
  selectedCategoryCode: string;
  onCategoryChange: (categoryCode: string) => void;
  selectedWorkType: string;
  onWorkTypeChange: (value: string) => void;
};

// 작업종류는 대분류(설비/전기/화기/운반/특수 작업)를 먼저 고르면 그 아래 세부 작업종류가 나타나는
// 2단계 선택 구조로 구성한다. 대분류는 항상 보이고, 소분류는 대분류를 고른 뒤에만 나타난다.
function WorkTypeCategoryField({
  index,
  label,
  categories,
  selectedCategoryCode,
  onCategoryChange,
  selectedWorkType,
  onWorkTypeChange
}: WorkTypeCategoryFieldProps) {
  const selectedCategory = categories.find((category) => category.code === selectedCategoryCode);
  const subOptions = selectedCategory?.workTypes.map((workType) => workType.name) ?? [];

  return (
    <SurveyCard index={index} label={label}>
      <SelectionChipRow
        options={categories.map((category) => category.name)}
        value={selectedCategory?.name ?? ""}
        onChange={(name) => {
          const category = categories.find((item) => item.name === name);
          onCategoryChange(category ? category.code : "");
        }}
        emptyMessage="분류를 불러오는 중입니다."
      />
      {selectedCategory ? (
        <Box sx={{ mt: 1.1, pt: 1.1, borderTop: `1px dashed ${panelBorder}` }}>
          <Typography sx={{ fontSize: 12, fontWeight: 700, color: mutedText, mb: 0.6 }}>
            {selectedCategory.name} 세부 작업종류
          </Typography>
          <SelectionChipRow
            options={subOptions}
            value={selectedWorkType}
            onChange={onWorkTypeChange}
            descriptions={WORK_TYPE_DESCRIPTIONS}
            emptyMessage="등록된 세부 작업종류가 없습니다."
          />
        </Box>
      ) : null}
    </SurveyCard>
  );
}

function TbmGeneratePage() {
  const [workCategoryOptions, setWorkCategoryOptions] = useState<WorkCategoryOption[]>([]);
  const [selectedWorkCategoryCode, setSelectedWorkCategoryCode] = useState("");
  const [riskOptions, setRiskOptions] = useState<string[]>([]);
  const [workShiftOptions, setWorkShiftOptions] = useState<string[]>([]);
  const [tbmSurveyConfig, setTbmSurveyConfig] = useState<TbmSurveyConfig | null>(null);
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);

  const [preset, setPreset] = useState<TbmPreset>(INITIAL_PRESET);
  const [additionalInputs, setAdditionalInputs] =
    useState<AdditionalTbmInputs>(INITIAL_ADDITIONAL_INPUTS);
  const [followUpOtherInputs, setFollowUpOtherInputs] =
    useState<FollowUpOtherInputs>(INITIAL_FOLLOW_UP_OTHER_INPUTS);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [currentHistoryId, setCurrentHistoryId] = useState<number | null>(null);
  const [hasRequestedPreview, setHasRequestedPreview] = useState(false);
  const [scriptDrafts, setScriptDrafts] = useState<Record<string, string>>({});
  const [minutesDrafts, setMinutesDrafts] = useState<Record<string, string>>({});
  const [scriptSentenceChecks, setScriptSentenceChecks] = useState<Record<string, boolean>>({});
  const [minutesChecks, setMinutesChecks] = useState<Record<string, boolean>>({});
  const [signatureChecklistChecks, setSignatureChecklistChecks] = useState<Record<string, boolean>>(
    {}
  );
  const [workerSignatures, setWorkerSignatures] = useState<string[]>([]);
  const [supervisorSignature, setSupervisorSignature] = useState("");
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [signatureSaveMessage, setSignatureSaveMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const workerSignatureCanvasRefs = useRef<Array<HTMLCanvasElement | null>>([]);
  const supervisorSignatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeSignatureRef = useRef<string | null>(null);
  const lastSignaturePointRef = useRef<{ x: number; y: number } | null>(null);
  const lastSyncedDraftRef = useRef("");

  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [newSiteName, setNewSiteName] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<SiteSearchResult[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<SiteSearchResult | null>(null);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isAddingSite, setIsAddingSite] = useState(false);
  const [siteDialogError, setSiteDialogError] = useState("");

  const presetReady =
    preset.workType.trim() !== "" &&
    preset.permitType.trim() !== "" &&
    preset.risk.trim() !== "" &&
    preset.shift.trim() !== "" &&
    preset.workDate.trim() !== "" &&
    preset.location.trim() !== "";

  const workTypeOptions = workCategoryOptions.flatMap((category) => category.workTypes);
  const selectedWorkTypeCode =
    workTypeOptions.find((workType) => workType.name === preset.workType)?.code ?? "";
  const followUpQuestions = selectedWorkTypeCode
    ? buildFollowUpQuestions(preset, selectedWorkCategoryCode, selectedWorkTypeCode, tbmSurveyConfig)
    : [];
  const followUpReady =
    presetReady &&
    followUpQuestions.length > 0 &&
    followUpQuestions.every((question) => {
      const selectedValue = additionalInputs[question.key].trim();
      const otherValue = (followUpOtherInputs[question.key] ?? "").trim();

      if (question.key === "workerCount") {
        const count = Number(selectedValue);
        return Number.isInteger(count) && count >= 1 && count <= 100;
      }

      return selectedValue.length > 0 || otherValue.length > 0;
    });

  const readyToGenerate = followUpReady;
  const workerCount = Math.max(
    0,
    Math.min(100, Number(additionalInputs.workerCount) || 0)
  );

  const primaryScriptText = extractPrimaryScriptText(generatedText);
  const scriptSectionMap = extractSectionMapByAliases(primaryScriptText, SCRIPT_SECTION_ALIAS_MAP);
  const minutesSectionMap = extractSectionMapByAliases(
    primaryScriptText,
    MINUTES_SECTION_ALIAS_MAP
  );
  const draftBlocks = splitDraftBlocks(primaryScriptText).map((block) =>
    cleanPreviewContent(block)
  );
  const isPreviewProducing = hasRequestedPreview && isGenerating;
  const scriptSections = SCRIPT_TEMPLATE.map((section) => ({
    ...section,
    content: (() => {
      if (isPreviewProducing) return PRODUCTION_PLACEHOLDER;
      const baseContent =
        cleanPreviewContent(scriptSectionMap[section.title] || "") ||
        draftBlocks[SCRIPT_TEMPLATE.findIndex((item) => item.title === section.title)] ||
        "";
      const fallbackContent = buildScriptSectionFallback(section.title, preset);
      let enrichedContent = baseContent;
      if (!enrichedContent) {
        enrichedContent = fallbackContent;
      } else if (enrichedContent.replace(/\s+/g, "").length < 80 && fallbackContent) {
        enrichedContent = mergeUniqueLines(enrichedContent, fallbackContent);
      }
      const normalized = normalizeScenarioSectionContent(section.title, enrichedContent, preset);
      const deduped = cleanPreviewContent(collapseContextRestatements(normalized, preset));
      return splitSentencesIntoLines(deduped);
    })()
  }));
  const scriptSentenceKeys = scriptSections.flatMap((section) =>
    (scriptDrafts[section.title] ?? section.content)
      .split("\n")
      .map((line, index) => ({ key: `${section.title}:${index}`, text: line.trim() }))
      .filter((line) => line.text.length > 0)
      .map((line) => line.key)
  );
  const allScriptSentencesChecked =
    scriptSentenceKeys.length > 0 &&
    scriptSentenceKeys.every((key) => Boolean(scriptSentenceChecks[key]));
  const allSignatureChecklistChecked = SIGNATURE_CHECKLIST_ITEMS.every((item) =>
    Boolean(signatureChecklistChecks[item])
  );
  const allWorkerSignaturesCompleted =
    workerCount > 0 &&
    workerSignatures.length === workerCount &&
    workerSignatures.every((signature) => Boolean(signature));

  const signatureSubmitReady =
    allScriptSentencesChecked &&
    allSignatureChecklistChecked &&
    allWorkerSignaturesCompleted &&
    Boolean(supervisorSignature) &&
    !isPreviewProducing;
  const previewWorkDate = isPreviewProducing
    ? PRODUCTION_PLACEHOLDER
    : preset.workDate || "____년 __월 __일";
  const previewShift = isPreviewProducing
    ? PRODUCTION_PLACEHOLDER
    : preset.shift || "작업시간 미입력";
  const previewWorkName = isPreviewProducing
    ? PRODUCTION_PLACEHOLDER
    : (preset.workType || "작업종류 미선택") + " / " + (preset.permitType || "허가유형 미선택");
  const previewLocation = isPreviewProducing
    ? PRODUCTION_PLACEHOLDER
    : preset.location || "작업장소 미선택";
  const previewRisk = isPreviewProducing
    ? PRODUCTION_PLACEHOLDER
    : preset.risk || "위험등급 미선택";
  const minutesSectionRows = MINUTES_SECTION_LABELS.map((label) => ({
    label,
    content: isPreviewProducing
      ? PRODUCTION_PLACEHOLDER
      : cleanPreviewContent(minutesSectionMap[label] || "") ||
      draftBlocks[SCRIPT_TEMPLATE.length + MINUTES_SECTION_LABELS.indexOf(label)] ||
      ""
  }));

  const additionalOptionLines = [
    ...followUpQuestions.flatMap((question) => {
      const selectedValue = additionalInputs[question.key].trim();
      const otherValue =
        question.key === "workerCount"
          ? ""
          : (followUpOtherInputs[question.key] ?? "").trim();

      const lines: Array<readonly [string, string]> = [];

      if (selectedValue) {
        lines.push([question.outputLabel, selectedValue] as const);
      }

      if (otherValue) {
        lines.push([`${question.outputLabel} 기타`, otherValue] as const);
      }

      return lines;
    }),

    ["특이사항", additionalInputs.specialNotes] as const
  ]
    .map(([label, value]) => [label, value.trim()] as const)
    .filter(([, value]) => value.length > 0)
    .map(([label, value]) => `${label}: ${value}`);

  const buildScenarioDraftText = (drafts: Record<string, string> = scriptDrafts): string =>
    scriptSections
      .map((section, index) => {
        const subtitle = section.subtitle ? ` ${section.subtitle}` : "";
        const content = (drafts[section.title] ?? section.content).trim();
        return `### ${index + 1}. ${section.title}${subtitle}\n${content}`;
      })
      .join("\n\n")
      .trim();

  useEffect(() => {
    if (!hasRequestedPreview || isPreviewProducing) return;

    setScriptDrafts(
      Object.fromEntries(scriptSections.map((section) => [section.title, section.content]))
    );
    setMinutesDrafts(Object.fromEntries(minutesSectionRows.map((row) => [row.label, row.content])));
    setScriptSentenceChecks(
      Object.fromEntries(
        scriptSections.flatMap((section) =>
          section.content
            .split("\n")
            .map((line, index) => ({ key: `${section.title}:${index}`, text: line.trim() }))
            .filter((line) => line.text.length > 0)
            .map((line) => [line.key, false] as const)
        )
      )
    );
    setMinutesChecks(Object.fromEntries(minutesSectionRows.map((row) => [row.label, false])));
    setSignatureChecklistChecks(
      Object.fromEntries(SIGNATURE_CHECKLIST_ITEMS.map((item) => [item, false]))
    );
    setWorkerSignatures(Array.from({ length: workerCount }, () => ""));
    setSupervisorSignature("");
    setSignatureSaveMessage("");
  }, [generatedText, hasRequestedPreview, isPreviewProducing, workerCount]);

  useEffect(() => {
    if (
      !currentHistoryId ||
      !hasRequestedPreview ||
      isPreviewProducing ||
      Object.keys(scriptDrafts).length === 0
    )
      return;

    const draftText = buildScenarioDraftText();
    if (!draftText || draftText === lastSyncedDraftRef.current) return;

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await apiFetch(`/tbm/history/${currentHistoryId}/draft`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ draftText })
          });
          const result = (await response.json().catch(() => ({}))) as {
            ok?: boolean;
            message?: string;
          };
          if (!response.ok || !result.ok) {
            throw new Error(result.message ?? "TBM 시나리오 저장에 실패했습니다.");
          }
          lastSyncedDraftRef.current = draftText;
        } catch (error) {
          setErrorMessage((error as Error).message);
        }
      })();
    }, 500);

    return () => window.clearTimeout(timeoutId);
  }, [currentHistoryId, hasRequestedPreview, isPreviewProducing, scriptDrafts]);

  useEffect(() => {
    if (
      !currentHistoryId ||
      !hasRequestedPreview ||
      workerCount <= 0
    ) {
      return;
    }

    // 이미 입력한 서명이 있으면 초기화하지 않음
    if (
      workerSignatures.length === workerCount &&
      workerSignatures.some(Boolean)
    ) {
      return;
    }

    const initialWorkerSignatures = Array.from(
      { length: workerCount },
      (_, index) => workerSignatures[index] ?? ""
    );

    setWorkerSignatures(initialWorkerSignatures);
  }, [
    currentHistoryId,
    hasRequestedPreview,
    workerCount
  ]);

  const encodeWorkerSignatures = (signatures: string[]): string =>
    JSON.stringify(signatures);

  const buildSignaturePayload = (override: Partial<TbmSignatureData> = {}): TbmSignatureData => ({
    checklist: override.checklist ?? signatureChecklistChecks,
    workerSignature: override.workerSignature ?? encodeWorkerSignatures(workerSignatures),
    supervisorSignature: override.supervisorSignature ?? supervisorSignature,
    signedAt: override.signedAt ?? new Date().toISOString()
  });

  const saveSignaturePayload = async (payload: TbmSignatureData): Promise<boolean> => {
    if (!currentHistoryId) {
      setSignatureSaveMessage("TBM 생성 후 서명 저장 가능");
      return false;
    }

    setIsSavingSignature(true);
    setSignatureSaveMessage("서명 저장 중...");
    try {
      const response = await apiFetch(`/tbm/history/${currentHistoryId}/signature`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        message?: string;
      };
      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "서명 저장에 실패했습니다.");
      }
      setSignatureSaveMessage("서명 저장됨");
      return true;
    } catch (error) {
      setSignatureSaveMessage("");
      setErrorMessage((error as Error).message);
      return false;
    } finally {
      setIsSavingSignature(false);
    }
  };

  const handleSignatureChecklistChange = (
    item: string,
    checked: boolean
  ) => {
    setSignatureChecklistChecks((prev) => ({
      ...prev,
      [item]: checked
    }));

    setSignatureSaveMessage("");
  };

  const handleManualSignatureSave = () => {
    void saveSignaturePayload(buildSignaturePayload());
  };

  const updateScriptDraftLine = (sectionTitle: string, lineIndex: number, value: string) => {
    const currentDraft =
      scriptDrafts[sectionTitle] ??
      scriptSections.find((section) => section.title === sectionTitle)?.content ??
      "";
    const lines = currentDraft.split("\n");
    lines[lineIndex] = value;
    setScriptDrafts((prev) => ({ ...prev, [sectionTitle]: lines.join("\n") }));
  };

  const resetToInitialGenerateScreen = () => {
    setSelectedWorkCategoryCode("");
    setPreset(INITIAL_PRESET);
    setAdditionalInputs(INITIAL_ADDITIONAL_INPUTS);
    setGeneratedText("");
    setCurrentHistoryId(null);
    lastSyncedDraftRef.current = "";
    setHasRequestedPreview(false);
    setScriptDrafts({});
    setMinutesDrafts({});
    setScriptSentenceChecks({});
    setMinutesChecks({});
    setSignatureChecklistChecks({});
    setWorkerSignatures([]);
    setSupervisorSignature("");
    setSignatureSaveMessage("");
    setErrorMessage("");
    setSiteDialogOpen(false);
    setNewSiteName("");
    setAddressQuery("");
    setAddressResults([]);
    setSelectedAddress(null);
    setSiteDialogError("");
  };

  const handleSignatureSubmit = async () => {
    if (!signatureSubmitReady || isSavingSignature) return;

    setErrorMessage("");

    const saved = await saveSignaturePayload({
      checklist: signatureChecklistChecks,
      workerSignature: encodeWorkerSignatures(
        Array.from(
          { length: workerCount },
          (_, index) => workerSignatures[index] ?? ""
        )
      ),
      supervisorSignature,
      signedAt: new Date().toISOString()
    });

    if (!saved) return;

    resetToInitialGenerateScreen();
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

  const prepareCanvas = (canvas: HTMLCanvasElement, value: string) => {
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

  const prepareWorkerSignatureCanvas = (workerIndex: number) => {
    const canvas = workerSignatureCanvasRefs.current[workerIndex];
    if (!canvas) return;
    prepareCanvas(canvas, workerSignatures[workerIndex] ?? "");
  };

  const prepareSupervisorSignatureCanvas = () => {
    const canvas = supervisorSignatureCanvasRef.current;
    if (!canvas) return;
    prepareCanvas(canvas, supervisorSignature);
  };

  const handleWorkerSignaturePointerDown = (
    workerIndex: number,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (isPreviewProducing || isSavingSignature) return;
    const canvas = workerSignatureCanvasRefs.current[workerIndex];
    if (!canvas) return;

    prepareWorkerSignatureCanvas(workerIndex);
    canvas.setPointerCapture(event.pointerId);
    activeSignatureRef.current = `worker-${workerIndex}`;
    lastSignaturePointRef.current = getSignaturePoint(canvas, event);
    event.preventDefault();
  };

  const handleWorkerSignaturePointerMove = (
    workerIndex: number,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (
      activeSignatureRef.current !== `worker-${workerIndex}` ||
      isPreviewProducing ||
      isSavingSignature
    )
      return;

    const canvas = workerSignatureCanvasRefs.current[workerIndex];
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

  const handleWorkerSignaturePointerUp = (
    workerIndex: number,
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (activeSignatureRef.current !== `worker-${workerIndex}`) return;
    const canvas = workerSignatureCanvasRefs.current[workerIndex];

    if (canvas) {
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      const signatureImage = canvas.toDataURL("image/png");
      const nextWorkerSignatures = Array.from(
        { length: workerCount },
        (_, index) => (index === workerIndex ? signatureImage : workerSignatures[index] ?? "")
      );

      setWorkerSignatures(nextWorkerSignatures);
      setSignatureSaveMessage("");
    }

    activeSignatureRef.current = null;
    lastSignaturePointRef.current = null;
    event.preventDefault();
  };

  const clearWorkerSignature = (workerIndex: number) => {
    const canvas = workerSignatureCanvasRefs.current[workerIndex];
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }

    const nextWorkerSignatures = Array.from(
      { length: workerCount },
      (_, index) => (index === workerIndex ? "" : workerSignatures[index] ?? "")
    );

    setWorkerSignatures(nextWorkerSignatures);
    void saveSignaturePayload(
      buildSignaturePayload({
        workerSignature: encodeWorkerSignatures(nextWorkerSignatures)
      })
    );
  };

  const handleSupervisorSignaturePointerDown = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (isPreviewProducing || isSavingSignature) return;
    const canvas = supervisorSignatureCanvasRef.current;
    if (!canvas) return;

    prepareSupervisorSignatureCanvas();
    canvas.setPointerCapture(event.pointerId);
    activeSignatureRef.current = "supervisor";
    lastSignaturePointRef.current = getSignaturePoint(canvas, event);
    event.preventDefault();
  };

  const handleSupervisorSignaturePointerMove = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (
      activeSignatureRef.current !== "supervisor" ||
      isPreviewProducing ||
      isSavingSignature
    )
      return;

    const canvas = supervisorSignatureCanvasRef.current;
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

  const handleSupervisorSignaturePointerUp = (
    event: React.PointerEvent<HTMLCanvasElement>
  ) => {
    if (activeSignatureRef.current !== "supervisor") return;
    const canvas = supervisorSignatureCanvasRef.current;

    if (canvas) {
      if (canvas.hasPointerCapture(event.pointerId)) {
        canvas.releasePointerCapture(event.pointerId);
      }

      const signatureImage = canvas.toDataURL("image/png");
      setSupervisorSignature(signatureImage);
      void saveSignaturePayload(
        buildSignaturePayload({ supervisorSignature: signatureImage })
      );
    }

    activeSignatureRef.current = null;
    lastSignaturePointRef.current = null;
    event.preventDefault();
  };

  const clearSupervisorSignature = () => {
    const canvas = supervisorSignatureCanvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (canvas && ctx) {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
    }

    setSupervisorSignature("");
    void saveSignaturePayload(
      buildSignaturePayload({ supervisorSignature: "" })
    );
  };

  useEffect(() => {
    setWorkerSignatures((previousSignatures) =>
      Array.from(
        { length: workerCount },
        (_, index) => previousSignatures[index] ?? ""
      )
    );
    workerSignatureCanvasRefs.current = workerSignatureCanvasRefs.current.slice(0, workerCount);
  }, [workerCount]);

  useEffect(() => {
    if (!hasRequestedPreview) return;

    const prepareCanvases = () => {
      workerSignatureCanvasRefs.current.forEach((canvas, index) => {
        if (canvas) prepareCanvas(canvas, workerSignatures[index] ?? "");
      });
      prepareSupervisorSignatureCanvas();
    };

    const animationFrameId = window.requestAnimationFrame(prepareCanvases);
    window.addEventListener("resize", prepareCanvases);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", prepareCanvases);
    };
  }, [hasRequestedPreview, workerSignatures, supervisorSignature, workerCount]);

  const locationMenuOptions = preset.location.trim()
    ? siteOptions.some((item) => item.siteName === preset.location.trim())
      ? siteOptions
      : [{ siteId: -1, siteName: preset.location.trim() }, ...siteOptions]
    : siteOptions;

  const loadSiteOptions = async () => {
    try {
      const response = await apiFetch(`/sites`);
      const result = (await response.json().catch(() => ({}))) as SiteListResponse;
      if (!response.ok || !result.ok || !Array.isArray(result.rows)) {
        setSiteOptions([]);
        return;
      }
      setSiteOptions(result.rows);
    } catch {
      setSiteOptions([]);
    }
  };

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const response = await apiFetch(`/code/options`);
        const result = (await response.json().catch(() => ({}))) as CodeOptionsResponse;
        if (!response.ok || !result.ok) {
          setWorkCategoryOptions([]);
          setRiskOptions([]);
          setWorkShiftOptions([]);
          setTbmSurveyConfig(null);
          return;
        }
        setWorkCategoryOptions(Array.isArray(result.workCategories) ? result.workCategories : []);
        setRiskOptions(Array.isArray(result.riskLevels) ? result.riskLevels : []);
        setWorkShiftOptions(Array.isArray(result.workShifts) ? result.workShifts : []);
        setTbmSurveyConfig(
          result.tbmSurvey &&
            Array.isArray(result.tbmSurvey.questions) &&
            Array.isArray(result.tbmSurvey.options)
            ? result.tbmSurvey
            : null
        );
      } catch {
        setWorkCategoryOptions([]);
        setRiskOptions([]);
        setWorkShiftOptions([]);
        setTbmSurveyConfig(null);
      }
    };

    void loadOptions();
    void loadSiteOptions();
  }, []);

  useEffect(() => {
    if (!preset.workType || selectedWorkCategoryCode) return;
    const owningCategory = workCategoryOptions.find((category) =>
      category.workTypes.some((workType) => workType.name === preset.workType)
    );
    if (owningCategory) {
      setSelectedWorkCategoryCode(owningCategory.code);
    }
  }, [workCategoryOptions, preset.workType, selectedWorkCategoryCode]);

  useEffect(() => {
    setAdditionalInputs((prev) => {
      let changed = false;
      const next = { ...prev };

      for (const question of followUpQuestions) {
        const selectedValue = next[question.key].trim();
        if (selectedValue && !question.options.includes(selectedValue)) {
          next[question.key] = "";
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [preset.workType, preset.risk, preset.shift, selectedWorkCategoryCode, tbmSurveyConfig]);

  const handleSearchAddress = async () => {
    const query = addressQuery.trim();
    if (!query || isSearchingAddress) return;

    setIsSearchingAddress(true);
    setSiteDialogError("");
    try {
      const response = await apiFetch(`/sites/search?query=${encodeURIComponent(query)}`);
      const result = (await response.json().catch(() => ({}))) as SiteSearchResponse;
      if (!response.ok || !result.ok) {
        throw new Error(result.message ?? "주소 검색에 실패했습니다.");
      }
      const rows = Array.isArray(result.rows) ? result.rows : [];
      setAddressResults(rows);
      setSelectedAddress(null);
      if (rows.length === 0) {
        setSiteDialogError("주소 검색 결과가 없습니다. 다른 검색어로 시도해 주세요.");
      }
    } catch (error) {
      setSiteDialogError((error as Error).message);
      setAddressResults([]);
      setSelectedAddress(null);
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleAddSite = async () => {
    const normalized = newSiteName.trim();
    if (!normalized || isAddingSite) return;
    if (!selectedAddress) {
      setSiteDialogError("주소를 검색하고 목록에서 선택해 주세요.");
      return;
    }

    setIsAddingSite(true);
    setSiteDialogError("");
    try {
      const response = await apiFetch(`/sites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: normalized,
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longitude
        })
      });
      const result = (await response.json().catch(() => ({}))) as CreateSiteResponse;
      if (!response.ok || !result.ok || !result.row) {
        throw new Error(result.message ?? "작업장소 추가에 실패했습니다.");
      }

      await loadSiteOptions();
      setPreset((prev) => ({ ...prev, location: result.row?.siteName ?? normalized }));
      setSiteDialogOpen(false);
      setNewSiteName("");
      setAddressQuery("");
      setAddressResults([]);
      setSelectedAddress(null);
      setSiteDialogError("");
    } catch (error) {
      setSiteDialogError((error as Error).message);
    } finally {
      setIsAddingSite(false);
    }
  };

  const handleGenerate = async () => {
    if (!readyToGenerate || isGenerating) return;

    setHasRequestedPreview(true);
    setIsGenerating(true);
    setErrorMessage("");
    try {
      const response = await apiFetch(`/tbm/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            additionalOptionLines.length > 0
              ? `${DEFAULT_AUTO_PROMPT}\n\n추가 현장 입력:\n${additionalOptionLines.join("\n")}`
              : DEFAULT_AUTO_PROMPT,
          preset,
          options: additionalOptionLines
        })
      });

      const result = (await response.json().catch(() => ({}))) as GenerateTbmResponse;
      if (!response.ok || !result.ok || !result.draft) {
        throw new Error(result.message ?? "TBM 생성 요청에 실패했습니다.");
      }

      setGeneratedText(result.draft);
      setCurrentHistoryId(typeof result.historyId === "number" ? result.historyId : null);
      lastSyncedDraftRef.current = "";
    } catch (error) {
      setGeneratedText("");
      setCurrentHistoryId(null);
      lastSyncedDraftRef.current = "";
      setErrorMessage((error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const renderWorkerSignaturePad = (workerIndex: number) => {
    const signatureValue = workerSignatures[workerIndex] ?? "";

    return (
      <Box
        key={`worker-signature-${workerIndex}`}
        sx={{
          p: 0.9,
          border: `1px solid ${previewSurfaceBorder}`,
          borderRadius: chipRadius,
          bgcolor: "#ffffff"
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
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: panelText }}>
            작업자 {workerIndex + 1} 서명
          </Typography>

          <Button
            size="small"
            variant="outlined"
            onClick={() => clearWorkerSignature(workerIndex)}
            disabled={
              isPreviewProducing ||
              isSavingSignature ||
              !signatureValue
            }
            sx={{
              minWidth: 54,
              px: 0.8,
              py: 0.2,
              fontSize: 11,
              color: panelText,
              borderColor: inputBorder,
              borderRadius: chipRadius,
              textTransform: "none",
              "&:hover": {
                borderColor: accentBlue,
                bgcolor: "#eef7ff"
              }
            }}
          >
            지우기
          </Button>

        </Box>

        <Box
          sx={{
            position: "relative",
            height: 112,
            border: `1px solid ${inputBorder}`,
            bgcolor: inputBg,
            overflow: "hidden"
          }}
        >
          {!signatureValue ? (
            <Typography
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: inputPlaceholder,
                fontSize: 12,
                pointerEvents: "none"
              }}
            >
              작업자 {workerIndex + 1}이 서명해 주세요.
            </Typography>
          ) : null}

          <canvas
            ref={(canvas) => {
              workerSignatureCanvasRefs.current[workerIndex] = canvas;
            }}
            onPointerDown={(event) =>
              handleWorkerSignaturePointerDown(workerIndex, event)
            }
            onPointerMove={(event) =>
              handleWorkerSignaturePointerMove(workerIndex, event)
            }
            onPointerUp={(event) =>
              handleWorkerSignaturePointerUp(workerIndex, event)
            }
            onPointerCancel={(event) =>
              handleWorkerSignaturePointerUp(workerIndex, event)
            }
            style={{
              position: "relative",
              width: "100%",
              height: "112px",
              display: "block",
              cursor: isPreviewProducing || isSavingSignature ? "not-allowed" : "crosshair",
              touchAction: "none"
            }}
          />
        </Box>
      </Box>
    );
  };

  const renderSupervisorSignaturePad = () => (
    <Box
      sx={{
        p: 0.9,
        border: `1px solid ${previewSurfaceBorder}`,
        borderRadius: chipRadius,
        bgcolor: "#ffffff"
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
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: panelText }}>
          감독자 서명
        </Typography>

        <Button
          size="small"
          variant="outlined"
          onClick={clearSupervisorSignature}
          disabled={isPreviewProducing || isSavingSignature || !supervisorSignature}
          sx={{
            minWidth: 54,
            px: 0.8,
            py: 0.2,
            fontSize: 11,
            color: panelText,
            borderColor: inputBorder,
            borderRadius: chipRadius,
            textTransform: "none",
            "&:hover": { borderColor: accentBlue, bgcolor: "#eef7ff" }
          }}
        >
          지우기
        </Button>
      </Box>

      <Box
        sx={{
          position: "relative",
          height: 112,
          border: `1px solid ${inputBorder}`,
          bgcolor: inputBg,
          overflow: "hidden"
        }}
      >
        {!supervisorSignature ? (
          <Typography
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: inputPlaceholder,
              fontSize: 12,
              pointerEvents: "none"
            }}
          >
            감독자가 서명해 주세요.
          </Typography>
        ) : null}

        <canvas
          ref={supervisorSignatureCanvasRef}
          onPointerDown={handleSupervisorSignaturePointerDown}
          onPointerMove={handleSupervisorSignaturePointerMove}
          onPointerUp={handleSupervisorSignaturePointerUp}
          onPointerCancel={handleSupervisorSignaturePointerUp}
          style={{
            position: "relative",
            width: "100%",
            height: "112px",
            display: "block",
            cursor: isPreviewProducing || isSavingSignature ? "not-allowed" : "crosshair",
            touchAction: "none"
          }}
        />
      </Box>
    </Box>
  );

  const renderFollowUpQuestionCard = (
    index: number,
    question: FollowUpQuestion
  ) => {
    const value = additionalInputs[question.key];
    const otherValue = followUpOtherInputs[question.key] ?? "";
    const multiple = isMultiSelectQuestion(question.key);

    return (
      <SurveyCard index={index} label={question.label}>
        <Typography sx={{ fontSize: 12, color: mutedText, mb: 0.8 }}>
          {question.helperText}
          {multiple ? " 여러 개 선택할 수 있습니다." : ""}
        </Typography>

        {question.key === "workerCount" ? (
          <TextField
            type="text"
            size="small"
            fullWidth
            value={value}
            onWheel={(event) => {
              event.currentTarget.querySelector("input")?.blur();
            }}
            onChange={(event) => {
              const nextValue = event.target.value.replace(/\D/g, "");

              if (nextValue === "") {
                setAdditionalInputs((prev) => ({
                  ...prev,
                  workerCount: ""
                }));
                return;
              }

              const numericValue = Number(nextValue);
              if (!Number.isFinite(numericValue)) return;

              const normalizedValue = Math.min(
                100,
                Math.max(1, Math.floor(numericValue))
              );

              setAdditionalInputs((prev) => ({
                ...prev,
                workerCount: String(normalizedValue)
              }));
            }}
            slotProps={{
              htmlInput: {
                inputMode: "numeric",
                pattern: "[0-9]*",
                autoComplete: "off"
              }
            }}
            placeholder="작업 인원을 숫자로 입력하세요."
            sx={{
              ...darkInputSx,

              "& .MuiInputBase-root": {
                bgcolor: "#ffffff",
                color: inputText,
                borderRadius: cardRadius
              }
            }}
          />
        ) : (
          <SelectionChipRow
            options={question.options}
            value={value}
            multiple={multiple}
            onChange={(nextValue) => {
              setAdditionalInputs((prev) => ({
                ...prev,
                [question.key]: nextValue
              }));
            }}
          />
        )}

        {question.key !== "workerCount" && (
          <Box
            sx={{
              mt: 1.2,
              pt: 1.2,
              borderTop: `1px dashed ${panelBorder}`
            }}
          >
            <Typography
              sx={{
                fontSize: 12,
                fontWeight: 700,
                color: mutedText,
                mb: 0.7
              }}
            >
              기타(직접 입력)
            </Typography>

            <TextField
              size="small"
              fullWidth
              multiline
              minRows={3}
              maxRows={8}
              value={otherValue}
              onChange={(event) => {
                const nextValue = event.target.value;

                setFollowUpOtherInputs((prev) => ({
                  ...prev,
                  [question.key]: nextValue
                }));
              }}
              placeholder={`${question.label}에 해당하는 기타 내용을 입력하세요.
  여러 줄로 작성할 수 있습니다.`}
              sx={{
                ...darkInputSx,

                "& .MuiInputBase-root": {
                  bgcolor: "#ffffff",
                  color: inputText,
                  borderRadius: cardRadius,
                  alignItems: "flex-start"
                },

                "& textarea": {
                  lineHeight: 1.6
                }
              }}
            />
          </Box>
        )}
      </SurveyCard>
    );
  };

  const renderSpecialNotesCard = (index: number) => (
    <Paper elevation={0} sx={getSurveyFieldPaperSx(index)}>
      <Typography
        sx={{
          fontSize: 13,
          fontWeight: 700,
          color: panelText,
          mb: 0.75
        }}
      >
        {index}. 특이사항
      </Typography>
      <Typography sx={{ fontSize: 12, color: mutedText, mb: 0.8 }}>
        현장 특이사항, 추가 위험요인, 전달사항이 있으면 작성해 주세요. 작성하지 않아도 TBM
        생성이 가능합니다.
      </Typography>

      <TextField
        size="small"
        fullWidth
        multiline
        minRows={3}
        value={additionalInputs.specialNotes}
        onChange={(event) =>
          setAdditionalInputs((prev) => ({
            ...prev,
            specialNotes: event.target.value
          }))
        }
        placeholder="예: 작업구역 주변에 타 공정 작업자가 함께 작업 중이며, 자재 적치로 이동통로가 좁아져 있습니다."
        sx={{
          ...darkInputSx,

          "@media (max-width: 425px)": {
            "& .MuiInputBase-input": {
              fontSize: 13
            },

            "& .MuiInputBase-input::placeholder": {
              fontSize: 12,
              lineHeight: 1.5,
              color: inputPlaceholder,
              opacity: 1
            }
          }
        }}
      />
    </Paper>
  );

  const specialNotesIndex = 6 + followUpQuestions.length;
  const generateButtonIndex = specialNotesIndex + 1;

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "auto",
        bgcolor: pageBg,
        backgroundImage: pageGradient
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 980,
          boxSizing: "border-box",
          mx: "auto",
          px: { xs: 1, md: 1.5 },
          py: 2
        }}
      >
        <Typography
          sx={{
            fontSize: 30,
            fontWeight: 900,
            color: panelText,
            mb: 0.5,
            textAlign: "center",

            "@media (max-width: 425px)": {
              fontSize: 24,
              lineHeight: 1.25,
              mb: 0.7
            }
          }}
        >
          AI 세이프톡
        </Typography>
        <Typography
          sx={{
            fontSize: 14,
            color: mutedText,
            mb: 2,
            textAlign: "center",

            "@media (max-width: 425px)": {
              fontSize: 13.5,
              lineHeight: 1.55,
              px: 1
            }
          }}
        >
          작업 조건을 선택한 뒤, TBM 생성을 누르면 TBM이 생성됩니다.
        </Typography>

        {errorMessage ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {errorMessage}
          </Alert>
        ) : null}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr",
            columnGap: 1.25,
            rowGap: 1.25,
            alignItems: "stretch"
          }}
        >
          {!hasRequestedPreview ? (
            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                minWidth: 0,
                width: "100%",
                maxWidth: "100%",
                mx: 0,
                overflow: "hidden"
              }}
            >
              <WorkTypeCategoryField
                index={1}
                label="작업종류"
                categories={workCategoryOptions}
                selectedCategoryCode={selectedWorkCategoryCode}
                onCategoryChange={(categoryCode) => {
                  setSelectedWorkCategoryCode(categoryCode);
                  setPreset((prev) => ({ ...prev, workType: "", permitType: "" }));
                }}
                selectedWorkType={preset.workType}
                onWorkTypeChange={(value) => {
                  setPreset((prev) => {
                    const nextPermitTypes =
                      workTypeOptions.find((item) => item.name === value)?.permitTypes ?? [];
                    // 허가유형이 1개뿐이면(대부분의 경우) 바로 자동 선택해 한 번 더 클릭하지 않아도 되게 한다.
                    const keepPermitType = nextPermitTypes.includes(prev.permitType);
                    const nextPermitType = keepPermitType
                      ? prev.permitType
                      : nextPermitTypes.length === 1
                        ? nextPermitTypes[0]
                        : "";
                    return { ...prev, workType: value, permitType: nextPermitType };
                  });
                }}
              />

              <SurveyCheckboxField
                index={2}
                label="위험등급"
                value={preset.risk}
                onChange={(value) => {
                  setPreset((prev) => ({
                    ...prev,
                    risk: value
                  }));
                }}
                options={riskOptions}
              />

              <SurveyCard index={3} label="작업시간">
                {(() => {
                  const [startTime, endTime] = splitWorkTime(preset.shift);

                  const updateWorkTime = (
                    type: "start" | "end",
                    value: string
                  ) => {
                    const nextStartTime =
                      type === "start" ? value : startTime;

                    const nextEndTime =
                      type === "end" ? value : endTime;

                    setPreset((prev) => ({
                      ...prev,
                      shift: combineWorkTime(
                        nextStartTime,
                        nextEndTime
                      )
                    }));
                  };

                  const handleTimeWheel = (
                    event: React.WheelEvent<HTMLDivElement>,
                    type: "start" | "end"
                  ) => {
                    event.preventDefault();

                    const currentTime =
                      type === "start" ? startTime : endTime;

                    const amount =
                      event.deltaY < 0
                        ? TIME_STEP_MINUTES
                        : -TIME_STEP_MINUTES;

                    updateWorkTime(
                      type,
                      changeTimeByMinutes(currentTime, amount)
                    );
                  };

                  return (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,

                        "@media (max-width: 425px)": {
                          gap: 0.7
                        }
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            mb: 0.5,
                            fontSize: 12,
                            fontWeight: 700,
                            color: mutedText
                          }}
                        >
                          시작 시간
                        </Typography>

                        <TextField
                          size="small"
                          type="time"
                          value={startTime}
                          onChange={(event) => {
                            updateWorkTime(
                              "start",
                              event.target.value
                            );
                          }}
                          onWheel={(event) => {
                            handleTimeWheel(event, "start");
                          }}
                          slotProps={{
                            htmlInput: {
                              step: TIME_STEP_MINUTES * 60
                            }
                          }}
                          fullWidth
                          sx={darkInputSx}
                        />
                      </Box>

                      <Typography
                        sx={{
                          mt: 2.7,
                          fontSize: 17,
                          fontWeight: 800,
                          color: panelText,
                          flexShrink: 0
                        }}
                      >
                        ~
                      </Typography>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            mb: 0.5,
                            fontSize: 12,
                            fontWeight: 700,
                            color: mutedText
                          }}
                        >
                          종료 시간
                        </Typography>

                        <TextField
                          size="small"
                          type="time"
                          value={endTime}
                          onChange={(event) => {
                            updateWorkTime(
                              "end",
                              event.target.value
                            );
                          }}
                          onWheel={(event) => {
                            handleTimeWheel(event, "end");
                          }}
                          slotProps={{
                            htmlInput: {
                              step: TIME_STEP_MINUTES * 60
                            }
                          }}
                          fullWidth
                          sx={darkInputSx}
                        />
                      </Box>
                    </Box>
                  );
                })()}
              </SurveyCard>

              <SurveyCard index={4} label="작업일자">
                <TextField
                  size="small"
                  type="date"
                  value={preset.workDate}
                  onChange={(event) => {
                    const value = event.target.value;

                    setPreset((prev) => ({
                      ...prev,
                      workDate: value
                    }));
                  }}
                  fullWidth
                  sx={darkInputSx}
                />
              </SurveyCard>

              <SurveyCard index={5} label="작업장소">
                <Box sx={{ display: "flex", gap: 1, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                  <FormControl fullWidth size="small" sx={{ minWidth: 0 }}>
                    <Select
                      displayEmpty
                      value={preset.location}
                      onChange={(event) => {
                        const value = event.target.value;

                        setPreset((prev) => ({
                          ...prev,
                          location: value
                        }));
                      }}
                      sx={locationSelectSx}
                      MenuProps={{
                        slotProps: {
                          paper: {
                            sx: {
                              bgcolor: panelBg,
                              color: panelText,
                              border: `1px solid ${panelBorder}`,
                              maxHeight: 34 * 5 + 16,
                              overflowY: "auto",
                              "& .MuiMenuItem-root": {
                                color: panelText
                              },
                              "& .MuiMenuItem-root.Mui-selected": {
                                bgcolor: "#e8f4ff"
                              },
                              "& .MuiMenuItem-root:hover": {
                                bgcolor: "#f1f8ff"
                              }
                            }
                          }
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        작업장소 선택
                      </MenuItem>
                      {locationMenuOptions.map((item) => (
                        <MenuItem key={`${item.siteId}-${item.siteName}`} value={item.siteName}>
                          {item.siteName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSiteDialogError("");
                      setNewSiteName("");
                      setAddressQuery("");
                      setAddressResults([]);
                      setSelectedAddress(null);
                      setSiteDialogOpen(true);
                    }}
                    sx={{
                      minWidth: 96,
                      textTransform: "none",
                      flexShrink: 0,
                      color: panelText,
                      borderColor: cardGradientBorder,
                      background: chipGradient,
                      "&:hover": {
                        borderColor: accentBlue,
                        background: "linear-gradient(165deg, #e5f6fd 0%, #dff3fb 100%)"
                      }
                    }}
                  >
                    장소 추가
                  </Button>
                </Box>
              </SurveyCard>

              {followUpQuestions.map((question, index) =>
                renderFollowUpQuestionCard(index + 6, question)
              )}
              {renderSpecialNotesCard(specialNotesIndex)}

              <Paper elevation={0} sx={getSurveyFieldPaperSx(generateButtonIndex)}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => void handleGenerate()}
                  disabled={!readyToGenerate || isGenerating}
                  sx={{
                    py: 1.2,
                    fontSize: 16,
                    fontWeight: 700,
                    borderRadius: chipRadius,
                    textTransform: "none",

                    background:
                      "linear-gradient(100deg, #f57c00 0%, #ef6c00 48%, #d32f2f 100%)",
                    color: "#ffffff",
                    boxShadow: "0 14px 28px rgba(239, 108, 0, 0.28)",

                    "&:hover": {
                      background:
                        "linear-gradient(100deg, #e65100 0%, #d84315 48%, #b71c1c 100%)",
                      boxShadow: "0 16px 32px rgba(211, 47, 47, 0.3)"
                    },

                    "&.Mui-disabled": {
                      background:
                        "linear-gradient(100deg, #ffe0b2 0%, #ffccbc 52%, #ffcdd2 100%)",
                      color: "rgba(255,255,255,0.9)"
                    }
                  }}
                >
                  {isGenerating ? (
                    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                      <CircularProgress size={18} sx={{ color: "#ffffff" }} />
                      생성 중...
                    </Box>
                  ) : (
                    "TBM 생성"
                  )}
                </Button>
              </Paper>
            </Box>
          ) : null}

          {hasRequestedPreview ? (
            <Paper
              elevation={0}
              sx={{
                borderRadius: cardRadius,
                border: `1px solid ${panelBorder}`,
                bgcolor: panelBg,
                boxShadow: "0 18px 40px rgba(15, 23, 42, 0.1)",
                p: 1,
                minWidth: 0,
                width: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                height: "100%"
              }}
            >
              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  maxHeight: "calc(100vh - 260px)",
                  border: `1px solid ${previewSurfaceBorder}`,
                  borderRadius: cardRadius,
                  bgcolor: previewPanelBg,
                  p: 1.25,
                  overflowY: "auto"
                }}
              >
                <Box
                  sx={{
                    width: "min(100%, 820px)",
                    minHeight: "100%",
                    mx: "auto",
                    bgcolor: previewSurfaceBg,
                    border: `1px solid ${previewSurfaceBorder}`,
                    borderRadius: cardRadius,
                    boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
                    p: 2
                  }}
                >
                  <Typography
                    sx={{
                      textAlign: "center",
                      fontSize: 24,
                      fontWeight: 800,
                      mb: 1.25,
                      color: previewScriptAccent
                    }}
                  >
                    TBM 실행 시나리오
                  </Typography>

                  <Box
                    sx={{
                      border: `1px solid ${previewScriptBorder}`,
                      mb: 2.5,
                      width: "100%",
                      minWidth: 0,
                      boxSizing: "border-box"
                    }}
                  >
                    {/* 태블릿·웹에서만 기존 표 헤더 표시 */}
                    <Box
                      sx={{
                        display: {
                          xs: "none",
                          sm: "grid"
                        },
                        gridTemplateColumns: "190px 1fr",
                        borderBottom: `1px solid ${previewScriptBorder}`,
                        bgcolor: previewScriptHeaderBg
                      }}
                    >
                      <Box
                        sx={{
                          p: 0.8,
                          fontSize: 13,
                          fontWeight: 700,
                          borderRight: `1px solid ${previewScriptBorder}`,
                          textAlign: "center",
                          color: panelText
                        }}
                      >
                        구분
                      </Box>

                      <Box
                        sx={{
                          p: 0.8,
                          fontSize: 13,
                          fontWeight: 700,
                          textAlign: "center",
                          color: panelText
                        }}
                      >
                        T.B.M 리더 멘트 (수정 가능)
                      </Box>
                    </Box>

                    {scriptSections.map((section, index) => (
                      <Box
                        key={section.title}
                        sx={{
                          display: "grid",

                          // 모바일만 1열
                          // 태블릿·웹은 기존 190px + 나머지 영역 유지
                          gridTemplateColumns: {
                            xs: "minmax(0, 1fr)",
                            sm: "190px minmax(0, 1fr)"
                          },

                          borderBottom:
                            index === scriptSections.length - 1
                              ? "none"
                              : `1px solid ${previewScriptBorder}`,

                          minWidth: 0,
                          width: "100%"
                        }}
                      >
                        {/* 구분 제목 영역 */}
                        <Box
                          sx={{
                            p: {
                              xs: 1,
                              sm: 0.8
                            },

                            fontSize: 12.5,
                            fontWeight: 700,

                            // 모바일은 제목이 위에 위치하므로 오른쪽 선 제거
                            borderRight: {
                              xs: "none",
                              sm: `1px solid ${previewScriptBorder}`
                            },

                            // 모바일에서 제목과 멘트 사이 구분선
                            borderBottom: {
                              xs: `1px solid ${previewScriptBorder}`,
                              sm: "none"
                            },

                            textAlign: "center",
                            bgcolor: previewScriptHeaderBg,
                            color: panelText,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            gap: 0.25,
                            minWidth: 0
                          }}
                        >
                          <span>{section.title}</span>

                          {section.subtitle ? (
                            <span style={{ fontWeight: 500 }}>
                              {section.subtitle}
                            </span>
                          ) : null}
                        </Box>

                        {/* 체크박스 및 멘트 영역 */}
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
                          {(isPreviewProducing
                            ? PRODUCTION_PLACEHOLDER
                            : (scriptDrafts[section.title] ?? section.content)
                          )
                            .split("\n")
                            .map((line, lineIndex) => {
                              const sentenceKey = `${section.title}:${lineIndex}`;
                              const checked = Boolean(
                                scriptSentenceChecks[sentenceKey]
                              );

                              return (
                                <Box
                                  key={sentenceKey}
                                  sx={{
                                    display: "grid",
                                    gridTemplateColumns: "28px minmax(0, 1fr)",
                                    alignItems: "flex-start",
                                    gap: 0.25,

                                    minWidth: 0,
                                    width: "100%",
                                    maxWidth: "100%",
                                    boxSizing: "border-box",

                                    borderRadius: 1,
                                    bgcolor: checked
                                      ? "#eef6ff"
                                      : "transparent",
                                    transition: "background-color 0.16s ease"
                                  }}
                                >
                                  <Checkbox
                                    checked={checked}
                                    onChange={(event) =>
                                      setScriptSentenceChecks((prev) => ({
                                        ...prev,
                                        [sentenceKey]: event.target.checked
                                      }))
                                    }
                                    size="small"
                                    disabled={
                                      isPreviewProducing ||
                                      line.trim().length === 0
                                    }
                                    sx={{
                                      mt: 0.05,
                                      p: 0.25,
                                      color: "#7aa7d8",
                                      "& .MuiSvgIcon-root": {
                                        fontSize: 20
                                      },
                                      "&.Mui-checked": {
                                        color: accentBlue
                                      }
                                    }}
                                  />

                                  <TextField
                                    multiline
                                    minRows={1}
                                    value={line}
                                    onChange={(event) =>
                                      updateScriptDraftLine(
                                        section.title,
                                        lineIndex,
                                        event.target.value
                                      )
                                    }
                                    placeholder="AI 생성 멘트가 이 영역에 표시됩니다."
                                    disabled={isPreviewProducing}
                                    sx={{
                                      ...darkInputSx,

                                      width: "100%",
                                      minWidth: 0,
                                      maxWidth: "100%",

                                      "& .MuiInputBase-root": {
                                        bgcolor: "transparent",
                                        borderRadius: 1,
                                        fontSize: 13,
                                        color: checked
                                          ? accentBlue
                                          : panelText,
                                        lineHeight: 1.38,
                                        fontWeight: checked ? 700 : 500,
                                        p: 0,
                                        minWidth: 0,
                                        width: "100%"
                                      },

                                      "& .MuiInputBase-input": {
                                        py: 0.15,
                                        px: 0,
                                        minWidth: 0
                                      },

                                      "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "transparent"
                                      },

                                      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                                      {
                                        borderColor: "#bfdbfe"
                                      },

                                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                      {
                                        borderColor: accentBlue
                                      }
                                    }}
                                  />
                                </Box>
                              );
                            })}
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  <Box sx={{ border: `1px solid ${previewSurfaceBorder}`, mb: 2.5 }}>
                    <Box
                      sx={{
                        p: 0.85,
                        bgcolor: previewScriptHeaderBg,
                        borderBottom: `1px solid ${previewSurfaceBorder}`,
                        color: panelText,

                        display: "flex",
                        flexDirection: {
                          xs: "column",
                          sm: "row"
                        },

                        alignItems: {
                          xs: "stretch",
                          sm: "center"
                        },

                        justifyContent: "space-between",
                        gap: {
                          xs: 0.75,
                          sm: 1
                        }
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          display: {
                            xs: "none",
                            sm: "block"
                          }
                        }}
                      />
                      <Box
                        sx={{
                          flex: 2,
                          textAlign: "center",
                          width: {
                            xs: "100%",
                            sm: "auto"
                          }
                        }}
                      >
                        <Typography
                          component="div"
                          sx={{
                            fontSize: 14,
                            fontWeight: 800,
                            lineHeight: 1.45
                          }}
                        >
                          체크리스트/서명
                          <Box
                            component="span"
                            sx={{
                              display: {
                                xs: "block",
                                sm: "inline"
                              },
                              ml: {
                                xs: 0,
                                sm: 0.4
                              }
                            }}
                          >
                            (PPE/LOTO)
                          </Box>
                        </Typography>
                        {signatureSaveMessage ? (
                          <Typography
                            component="span"
                            sx={{ ml: 1, fontSize: 11, fontWeight: 600, color: mutedText }}
                          >
                            {signatureSaveMessage}
                          </Typography>
                        ) : null}
                      </Box>
                      <Box
                        sx={{
                          flex: 1,
                          display: "flex",
                          justifyContent: {
                            xs: "stretch",
                            sm: "flex-end"
                          },
                          width: {
                            xs: "100%",
                            sm: "auto"
                          }
                        }}
                      >
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleManualSignatureSave}
                          disabled={isPreviewProducing || isSavingSignature || !currentHistoryId}
                          sx={{
                            width: {
                              xs: "100%",
                              sm: "auto"
                            },
                            minWidth: 76,
                            px: 1,
                            py: {
                              xs: 0.65,
                              sm: 0.25
                            },
                            fontSize: 11,
                            color: panelText,
                            borderColor: inputBorder,
                            borderRadius: chipRadius,
                            textTransform: "none",
                            "&:hover": { borderColor: accentBlue, bgcolor: "#eef7ff" }
                          }}
                        >
                          {isSavingSignature ? "저장 중..." : "서명 저장"}
                        </Button>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(3, minmax(0, 1fr))"
                        },
                        borderBottom: `1px solid ${previewSurfaceBorder}`
                      }}
                    >
                      {SIGNATURE_CHECKLIST_ITEMS.map((item, index) => (
                        <Box
                          key={item}
                          sx={{
                            p: 0.75,
                            borderRight: {
                              xs: "none",
                              sm:
                                index === SIGNATURE_CHECKLIST_ITEMS.length - 1
                                  ? "none"
                                  : `1px solid ${previewSurfaceBorder}`
                            },

                            borderBottom: {
                              xs:
                                index === SIGNATURE_CHECKLIST_ITEMS.length - 1
                                  ? "none"
                                  : `1px solid ${previewSurfaceBorder}`,
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
                                disabled={isPreviewProducing || isSavingSignature}
                                sx={{
                                  color: "#7aa7d8",
                                  "& .MuiSvgIcon-root": { fontSize: 21 },
                                  "&.Mui-checked": { color: accentBlue }
                                }}
                              />
                            }
                            label={item}
                            sx={{
                              m: 0,
                              color: panelText,
                              "& .MuiFormControlLabel-label": { fontSize: 13, fontWeight: 700 }
                            }}
                          />
                        </Box>
                      ))}
                    </Box>
                    <Box sx={{ p: 1 }}>
                      <Typography
                        sx={{
                          mb: 1,
                          fontSize: 14,
                          fontWeight: 800,
                          color: panelText
                        }}
                      >
                        작업자 서명 ({workerCount}명)
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
                        {Array.from({ length: workerCount }, (_, workerIndex) =>
                          renderWorkerSignaturePad(workerIndex)
                        )}
                      </Box>

                      <Box sx={{ mt: 1 }}>
                        {renderSupervisorSignaturePad()}
                      </Box>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
                    <Button
                      variant="contained"
                      onClick={() => void handleSignatureSubmit()}
                      disabled={!signatureSubmitReady || isSavingSignature}
                      sx={{
                        minWidth: 180,
                        py: 1,
                        px: 3,
                        fontSize: 15,
                        fontWeight: 800,
                        borderRadius: chipRadius,
                        textTransform: "none",

                        background:
                          "linear-gradient(100deg, #f57c00 0%, #ef6c00 48%, #d32f2f 100%)",
                        color: "#ffffff",
                        boxShadow: "0 12px 24px rgba(239, 108, 0, 0.24)",

                        "&:hover": {
                          background:
                            "linear-gradient(100deg, #e65100 0%, #d84315 48%, #b71c1c 100%)",
                          boxShadow: "0 14px 28px rgba(211, 47, 47, 0.28)"
                        },

                        "&.Mui-disabled": {
                          background:
                            "linear-gradient(100deg, #ffe0b2 0%, #ffccbc 52%, #ffcdd2 100%)",
                          color: "rgba(255,255,255,0.9)"
                        }
                      }}
                    >
                      {isSavingSignature ? "제출 중..." : "제출하기"}
                    </Button>
                  </Box>

                  {SHOW_MINUTES ? (
                    <>
                      <Typography
                        sx={{
                          textAlign: "center",
                          fontSize: 27,
                          fontWeight: 800,
                          mb: 1.5,
                          color: panelText
                        }}
                      >
                        Tool Box Meeting 회의록
                      </Typography>
                      <Box sx={{ border: `1px solid ${previewSurfaceBorder}` }}>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr",
                            borderBottom: `1px solid ${previewSurfaceBorder}`
                          }}
                        >
                          <Box
                            sx={{
                              p: 0.75,
                              fontSize: 13,
                              fontWeight: 700,
                              borderRight: `1px solid ${previewSurfaceBorder}`,
                              bgcolor: previewScriptHeaderBg,
                              color: panelText
                            }}
                          >
                            TBM 일시
                          </Box>
                          <Box sx={{ p: 0.75, fontSize: 13, color: panelText }}>
                            {previewWorkDate} / {previewShift}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr",
                            borderBottom: `1px solid ${previewSurfaceBorder}`
                          }}
                        >
                          <Box
                            sx={{
                              p: 0.75,
                              fontSize: 13,
                              fontWeight: 700,
                              borderRight: `1px solid ${previewSurfaceBorder}`,
                              bgcolor: previewScriptHeaderBg,
                              color: panelText
                            }}
                          >
                            작 업 명
                          </Box>
                          <Box sx={{ p: 0.75, fontSize: 13, color: panelText }}>
                            {previewWorkName}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr",
                            borderBottom: `1px solid ${previewSurfaceBorder}`
                          }}
                        >
                          <Box
                            sx={{
                              p: 0.75,
                              fontSize: 13,
                              fontWeight: 700,
                              borderRight: `1px solid ${previewSurfaceBorder}`,
                              bgcolor: previewScriptHeaderBg,
                              color: panelText
                            }}
                          >
                            작업장소
                          </Box>
                          <Box sx={{ p: 0.75, fontSize: 13, color: panelText }}>
                            {previewLocation}
                          </Box>
                        </Box>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "120px 1fr",
                            borderBottom: `1px solid ${previewSurfaceBorder}`
                          }}
                        >
                          <Box
                            sx={{
                              p: 0.75,
                              fontSize: 13,
                              fontWeight: 700,
                              borderRight: `1px solid ${previewSurfaceBorder}`,
                              bgcolor: previewScriptHeaderBg,
                              color: panelText
                            }}
                          >
                            위험등급
                          </Box>
                          <Box sx={{ p: 0.75, fontSize: 13, color: panelText }}>{previewRisk}</Box>
                        </Box>
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "64px 120px 1fr",
                            borderBottom: `1px solid ${previewSurfaceBorder}`,
                            bgcolor: previewScriptHeaderBg
                          }}
                        >
                          <Box
                            sx={{
                              p: 0.75,
                              fontSize: 13,
                              fontWeight: 700,
                              borderRight: `1px solid ${previewSurfaceBorder}`,
                              textAlign: "center",
                              color: panelText
                            }}
                          >
                            확인
                          </Box>
                          <Box
                            sx={{
                              p: 0.75,
                              fontSize: 13,
                              fontWeight: 700,
                              borderRight: `1px solid ${previewSurfaceBorder}`,
                              textAlign: "center",
                              color: panelText
                            }}
                          >
                            항목
                          </Box>
                          <Box
                            sx={{
                              p: 0.75,
                              fontSize: 13,
                              fontWeight: 700,
                              textAlign: "center",
                              color: panelText
                            }}
                          >
                            회의록 내용 (수정 가능)
                          </Box>
                        </Box>
                        {minutesSectionRows.map((row, index) => (
                          <Box
                            key={row.label}
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "64px 120px 1fr",
                              borderBottom:
                                index === minutesSectionRows.length - 1
                                  ? "none"
                                  : `1px solid ${previewSurfaceBorder}`
                            }}
                          >
                            <Box
                              sx={{
                                p: 0.4,
                                borderRight: `1px solid ${previewSurfaceBorder}`,
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center"
                              }}
                            >
                              <Checkbox
                                checked={Boolean(minutesChecks[row.label])}
                                onChange={(event) =>
                                  setMinutesChecks((prev) => ({
                                    ...prev,
                                    [row.label]: event.target.checked
                                  }))
                                }
                                size="small"
                                disabled={isPreviewProducing}
                                sx={{
                                  color: "#7aa7d8",
                                  "& .MuiSvgIcon-root": { fontSize: 21 },
                                  "&.Mui-checked": { color: accentBlue }
                                }}
                              />
                            </Box>
                            <Box
                              sx={{
                                p: 0.75,
                                fontSize: 13,
                                fontWeight: 700,
                                borderRight: `1px solid ${previewSurfaceBorder}`,
                                bgcolor: previewScriptHeaderBg,
                                color: panelText
                              }}
                            >
                              {row.label}
                            </Box>
                            <TextField
                              multiline
                              minRows={3}
                              value={
                                isPreviewProducing
                                  ? PRODUCTION_PLACEHOLDER
                                  : (minutesDrafts[row.label] ?? row.content)
                              }
                              onChange={(event) =>
                                setMinutesDrafts((prev) => ({
                                  ...prev,
                                  [row.label]: event.target.value
                                }))
                              }
                              placeholder="해당 회의록 내용이 여기에 표시됩니다."
                              disabled={isPreviewProducing}
                              sx={{
                                ...darkInputSx,
                                "& .MuiInputBase-root": {
                                  bgcolor: inputBg,
                                  borderRadius: cardRadius,
                                  fontSize: 13,
                                  color: panelText,
                                  lineHeight: 1.65
                                }
                              }}
                            />
                          </Box>
                        ))}
                      </Box>
                    </>
                  ) : null}
                </Box>
              </Box>
            </Paper>
          ) : null}
        </Box>
      </Box>

      <Dialog
        open={siteDialogOpen}
        onClose={() => {
          if (!isAddingSite) {
            setSiteDialogOpen(false);
          }
        }}
        slotProps={{
          paper: {
            sx: {
              width: 680,
              maxWidth: "96vw",
              borderRadius: cardRadius,
              bgcolor: panelBg,
              color: panelText,
              border: `1px solid ${panelBorder}`
            }
          }
        }}
      >
        <DialogTitle sx={{ pb: 0.5, fontSize: 20, fontWeight: 700 }}>작업장소 추가</DialogTitle>
        <DialogContent sx={{ pt: "4px !important", pb: 1 }}>
          <Typography sx={{ fontSize: 13, color: mutedText, mb: 1 }}>
            주소를 검색해 위치를 선택한 뒤, 사용할 장소명을 지정해 등록합니다.
          </Typography>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            <Box sx={{ display: "flex", gap: 0.75 }}>
              <TextField
                size="small"
                fullWidth
                autoFocus
                placeholder="주소 검색"
                value={addressQuery}
                onChange={(event) => setAddressQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSearchAddress();
                  }
                }}
                sx={darkInputSx}
              />
              <Button
                variant="outlined"
                onClick={() => void handleSearchAddress()}
                disabled={isSearchingAddress || addressQuery.trim().length === 0}
                sx={{
                  minWidth: 88,
                  textTransform: "none",
                  color: panelText,
                  borderColor: inputBorder,
                  borderRadius: chipRadius,
                  "&:hover": { borderColor: accentBlue, bgcolor: "#eef7ff" }
                }}
              >
                {isSearchingAddress ? "검색 중..." : "주소 검색"}
              </Button>
            </Box>

            <Box
              sx={{
                maxHeight: 160,
                overflowY: "auto",
                border: `1px solid ${inputBorder}`,
                borderRadius: cardRadius,
                p: 0.5,
                bgcolor: inputBg
              }}
            >
              {addressResults.length === 0 ? (
                <Typography sx={{ px: 0.5, py: 0.5, fontSize: 12, color: mutedText }}>
                  주소를 검색하면 선택 가능한 목록이 표시됩니다.
                </Typography>
              ) : (
                addressResults.map((item) => {
                  const selected = selectedAddress?.id === item.id;
                  return (
                    <Button
                      key={item.id}
                      onClick={() => setSelectedAddress(item)}
                      sx={{
                        width: "100%",
                        justifyContent: "flex-start",
                        textTransform: "none",
                        fontSize: 12,
                        color: selected ? accentBlue : panelText,
                        bgcolor: selected ? "#eef7ff" : "transparent",
                        border: selected ? `1px solid ${accentBlue}` : "1px solid transparent",
                        mb: 0.4,
                        px: 0.75,
                        py: 0.5
                      }}
                    >
                      {item.label}
                    </Button>
                  );
                })
              )}
            </Box>

            <Typography sx={{ fontSize: 12, color: mutedText }}>
              선택된 주소: {selectedAddress ? selectedAddress.label : "미선택"}
            </Typography>

            <TextField
              size="small"
              fullWidth
              placeholder="표시할 장소명"
              value={newSiteName}
              onChange={(event) => setNewSiteName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleAddSite();
                }
              }}
              sx={darkInputSx}
            />

            {siteDialogError ? (
              <Typography sx={{ mt: 0.5, fontSize: 12, color: "#dc2626", whiteSpace: "pre-line" }}>
                {siteDialogError}
              </Typography>
            ) : null}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={() => {
              if (!isAddingSite) {
                setSiteDialogOpen(false);
              }
            }}
            disabled={isAddingSite}
            variant="outlined"
            sx={{
              textTransform: "none",
              minWidth: 72,
              color: panelText,
              borderColor: inputBorder,
              borderRadius: chipRadius,
              "&:hover": { borderColor: accentBlue, bgcolor: "#eef7ff" }
            }}
          >
            취소
          </Button>
          <Button
            onClick={() => void handleAddSite()}
            disabled={isAddingSite || newSiteName.trim().length === 0 || selectedAddress === null}
            variant="contained"
            sx={{
              textTransform: "none",
              minWidth: 88,
              bgcolor: actionSky,
              color: "#ffffff",
              borderRadius: chipRadius,
              "&:hover": { bgcolor: actionSkyHover }
            }}
          >
            {isAddingSite ? "추가 중..." : "추가"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TbmGeneratePage;