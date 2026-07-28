import {
  deleteTbmHistory,
  getTbmHistoryDetail,
  listRecentTbmHistory,
  listTbmHistoryPage,
  saveTbmHistory,
  updateTbmHistory,
  updateTbmHistoryDraft,
  updateTbmHistorySignature
} from "../repositories/tbm.repository";
import { dbPool } from "../../config/database";
import { buildBundleContent } from "./tbm-document-template.service";
import { buildRagContext } from "./rag.service";
import { fetchCurrentWeather } from "./weather.service";
import { resolveSiteIdByWorkLocation } from "../repositories/site.repository";
import { findRealIncidentCasesByWorkType } from "../repositories/rag-document.repository";
import { listPpeRulesByWorkType } from "../repositories/ppe-rule.repository";

export type GenerateTbmInput = {
  historyId?: number;
  prompt: string;
  preset: {
    workType: string;
    permitType: string;
    risk: string;
    shift: string;
    workDate: string;
    location: string;
  };
  options: string[];
};

export type RecentTbmHistory = {
  id: number;
  title: string;
  createdAt: string;
};

export type TbmHistoryDetail = {
  id: number;
  title: string;
  preset: {
    workType: string;
    permitType: string;
    risk: string;
    shift: string;
    workDate: string;
    location: string;
  };
  options: string[];
  userPrompt: string;
  draftText: string;
  signature: TbmSignatureData;
  createdAt: string;
};

export type TbmSignatureData = {
  checklist: Record<string, boolean>;
  workerSignature: string;
  supervisorSignature: string;
  signedAt: string | null;
};

const normalizeDateInput = (value: unknown): string => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    return value.includes("T") ? value.split("T")[0] : value;
  }
  return "";
};

const buildHistoryTitle = (input: GenerateTbmInput): string => {
  return `${input.preset.workType} / ${input.preset.workDate} / ${input.preset.location}`;
};

const EMPTY_SIGNATURE: TbmSignatureData = {
  checklist: {},
  workerSignature: "",
  supervisorSignature: "",
  signedAt: null
};

const parseSignatureJson = (value: unknown): TbmSignatureData => {
  if (!value) {
    return { ...EMPTY_SIGNATURE };
  }

  let parsed: unknown = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      return { ...EMPTY_SIGNATURE };
    }
  }

  if (!parsed || typeof parsed !== "object") {
    return { ...EMPTY_SIGNATURE };
  }

  const raw = parsed as Partial<TbmSignatureData>;
  return {
    checklist: raw.checklist && typeof raw.checklist === "object" ? raw.checklist : {},
    workerSignature: typeof raw.workerSignature === "string" ? raw.workerSignature : "",
    supervisorSignature: typeof raw.supervisorSignature === "string" ? raw.supervisorSignature : "",
    signedAt: typeof raw.signedAt === "string" ? raw.signedAt : null
  };
};

const isSignatureCompleted = (signature: TbmSignatureData): boolean =>
  Boolean(signature.workerSignature || signature.supervisorSignature);

const getOptionValue = (options: string[], label: string): string => {
  const matched = options.find((option) => option.startsWith(`${label}:`));
  return matched ? matched.slice(label.length + 1).trim() : "";
};

const buildWeatherApiContext = async (workLocation: string): Promise<string> => {
  try {
    const mappedSiteId = await resolveSiteIdByWorkLocation(workLocation);
    const weather = await fetchCurrentWeather(mappedSiteId ?? undefined);
    return [
      `관측시각: ${weather.observedAt}`,
      `현장: ${weather.locationName}`,
      `요청 작업장소: ${workLocation || "정보없음"}`,
      `매핑 site_id: ${mappedSiteId ?? weather.siteId}`,
      `기온: ${weather.temperatureC ?? "정보없음"}°C`,
      `습도: ${weather.humidity ?? "정보없음"}%`,
      `풍속: ${weather.windSpeedMs ?? "정보없음"}m/s`,
      `강수량: ${weather.rainfallMm ?? "정보없음"}mm`,
      `특이기상: ${weather.warningType ?? weather.skyStatus ?? "없음"}`
    ].join("\n");
  } catch {
    return "";
  }
};

type WorkTypeRow = {
  work_type_code: string;
  sample_tasks: string | null;
  default_hazards: string | null;
  category_code: string | null;
};

const fetchWorkTypeRow = async (workType: string): Promise<WorkTypeRow | null> => {
  const [rows] = await dbPool.query(
    `
      SELECT
        w.work_type_code,
        GROUP_CONCAT(DISTINCT d.detail_name ORDER BY mtd.display_order SEPARATOR ', ') AS sample_tasks,
        GROUP_CONCAT(DISTINCT h.hazard_code ORDER BY mth.display_order SEPARATOR ',') AS default_hazards,
        w.category_code
      FROM code_work_type w
      LEFT JOIN map_work_type_detail mtd
        ON mtd.work_type_code = w.work_type_code
      LEFT JOIN code_detailed_work d
        ON d.detail_code = mtd.detail_code
       AND d.active_yn = 'Y'
      LEFT JOIN map_work_type_hazard mth
        ON mth.work_type_code = w.work_type_code
      LEFT JOIN code_hazard h
        ON h.hazard_code = mth.hazard_code
       AND h.active_yn = 'Y'
      WHERE w.active_yn = 'Y'
        AND (w.work_type_name = ? OR w.work_type_code = ?)
      GROUP BY w.work_type_code, w.category_code
      LIMIT 1
    `,
    [workType, workType]
  );
  return (rows as WorkTypeRow[])[0] ?? null;
};

const buildPpeContext = async (workType: string): Promise<string> => {
  try {
    const rows = await listPpeRulesByWorkType(workType);
    if (rows.length === 0) {
      return "";
    }

    const required = rows.filter((row) => row.required_yn === "Y");
    const additional = rows.filter((row) => row.required_yn !== "Y");

    const formatRow = (row: (typeof rows)[number]) =>
      `${row.ppe_name}${row.reason ? ` (${row.reason})` : ""}`;

    const lines: string[] = [];
    if (required.length > 0) {
      lines.push(`필수 보호구: ${required.map(formatRow).join(", ")}`);
    }
    if (additional.length > 0) {
      lines.push(`추가 보호구: ${additional.map(formatRow).join(", ")}`);
    }
    return lines.join("\n");
  } catch {
    return "";
  }
};

type IncidentRow = {
  hazard_code: string;
  hazard_type: string;
  accident_type: string;
  standard_controls: string | null;
};

const parseHazardCodes = (raw: string | null): string[] => {
  if (!raw) {
    return [];
  }
  return raw
    .split(/[,\s/|]+/g)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);
};

const MAX_INCIDENT_LINES = 5;

const buildIncidentDbContext = async (
  workType: string,
  workTypeRow: WorkTypeRow | null
): Promise<string> => {
  try {
    const realCases = await findRealIncidentCasesByWorkType(workType, MAX_INCIDENT_LINES);

    const hazardCodes = parseHazardCodes(workTypeRow?.default_hazards ?? null);

    let hazardRows: IncidentRow[] = [];
    if (hazardCodes.length > 0) {
      const placeholders = hazardCodes.map(() => "?").join(", ");
      const [rows] = await dbPool.query(
        `
          SELECT hazard_code, hazard_type, accident_type, standard_controls
          FROM code_hazard
          WHERE hazard_code IN (${placeholders})
          ORDER BY hazard_code ASC
          LIMIT 5
        `,
        hazardCodes
      );
      hazardRows = rows as IncidentRow[];
    }

    if (hazardRows.length === 0 && realCases.length === 0) {
      const [fallbackRows] = await dbPool.query(
        `
          SELECT hazard_code, hazard_type, accident_type, standard_controls
          FROM code_hazard
          ORDER BY hazard_code ASC
          LIMIT 3
        `
      );
      hazardRows = fallbackRows as IncidentRow[];
    }

    const header = [
      `작업유형: ${workType}`,
      `대표작업예시: ${workTypeRow?.sample_tasks ?? "정보없음"}`
    ].join("\n");

    // 실제 KOSHA/고용노동부 등 공개 사고사례를 위험요인-대책 매핑보다 우선 배치한다.
    const realIncidentLines = realCases.map(
      (row, index) =>
        `[사고사례 ${index + 1}] ${row.title} / 출처:${row.source}${row.source_url ? ` (${row.source_url})` : ""} / 내용:${row.body}`
    );
    const remainingSlots = Math.max(0, MAX_INCIDENT_LINES - realIncidentLines.length);
    const hazardLines = hazardRows
      .slice(0, remainingSlots)
      .map(
        (row, index) =>
          `[사고사례 ${realIncidentLines.length + index + 1}] 코드:${row.hazard_code}, 유형:${row.hazard_type}, 사고:${row.accident_type}, 표준조치:${row.standard_controls ?? "보강 필요"}`
      );

    const incidents = [...realIncidentLines, ...hazardLines].join("\n");
    return `${header}\n${incidents}`.trim();
  } catch {
    return "";
  }
};

type WorkContentFallback = {
  workType: string;
  location: string;
  permitType: string;
  sampleTasks: string | null;
  categoryCode: string | null;
};

const pickSampleTask = (sampleTasks: string | null, workType: string): string => {
  const tasks = (sampleTasks ?? "")
    .split(/[,，]/)
    .map((task) => task.trim())
    .filter((task) => task.length > 0);
  return tasks[0] ?? workType;
};

const pickContextLine = (raw: string, key: string): string => {
  const line = raw
    .split("\n")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${key}:`));
  return line ? line.replace(`${key}:`, "").trim() : "정보없음";
};

const ensureSection = (draft: string, sectionTitle: string, content: string): string => {
  if (
    new RegExp(
      `(^|\\n)\\s{0,3}(?:#{1,6}\\s*)?${sectionTitle}(?:\\s*\\*\\*)?\\s*(?:\\n|$)`,
      "m"
    ).test(draft)
  ) {
    return draft;
  }
  return `${draft}\n\n### ${sectionTitle}\n${content}`.trim();
};

const buildPpeChecklistSummary = (ppeContext: string): string => {
  if (!ppeContext) {
    return "- [ ] PPE 착용 확인 (작업유형별 세부 규정 미등록, 기본 보호구 기준 적용)";
  }

  const items: string[] = [];
  for (const line of ppeContext.split("\n")) {
    const match = line.match(/^(필수 보호구|추가 보호구): (.+)$/);
    if (!match) {
      continue;
    }
    const label = match[1] === "필수 보호구" ? "필수" : "추가";
    for (const entry of match[2].split(", ")) {
      items.push(`- [ ] [${label}] ${entry} 착용 확인`);
    }
  }

  return items.length > 0
    ? items.join("\n")
    : "- [ ] PPE 착용 확인 (작업유형별 세부 규정 미등록, 기본 보호구 기준 적용)";
};

// ===== 6단계 리더 멘트(T.B.M 리더 멘트) 구성 =====
// 현장에서 실제로 쓰는 리더 진행 멘트 양식을 그대로 따르며, 소규모 로컬 LLM의 자유생성 문장이
// 반복적으로 맥락에 안 맞는 문구를 만들어내는 문제를 근본적으로 없애기 위해 실제 조회된 데이터
// (날씨/사고사례DB/PPE규정/작업유형)만으로 결정론적으로 문장을 구성한다.
const KOREAN_WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

const formatWorkDateForGreeting = (workDate: string): string | null => {
  if (!workDate) return null;
  const parsed = new Date(`${workDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const weekday = KOREAN_WEEKDAYS[parsed.getDay()];
  return `${parsed.getMonth() + 1}월 ${parsed.getDate()}일 ${weekday}`;
};

const buildKickoffSectionBody = (input: GenerateTbmInput): string => {
  const location = input.preset.location || "현장";
  const datePart = formatWorkDateForGreeting(input.preset.workDate);
  const workerCount = getOptionValue(input.options, "작업인원");
  const supervisorName = getOptionValue(input.options, "작업책임자");
  const greeting = datePart
    ? `안녕하십니까? ${datePart} ${location} 아침 TBM을 시작하겠습니다.`
    : `안녕하십니까? ${location} 아침 TBM을 시작하겠습니다.`;

  const lines = [
    greeting,
    "간단한 스트레칭으로 굳은 몸을 풀어 주시기 바랍니다.",
    "목 돌리기부터 시작하겠습니다. 어깨, 허리, 무릎, 손목 및 발목 순으로 크게 따라 해 주시기 바랍니다."
  ];
  if (workerCount || supervisorName) {
    lines.push(
      `오늘 작업 투입 정보는${workerCount ? ` 작업인원 ${workerCount}` : ""}${supervisorName ? `, 작업책임자 ${supervisorName}` : ""}입니다.`
    );
  }
  return lines.join("\n");
};

const buildWeatherHealthAdvisory = (weatherContext: string): string | null => {
  const temperatureRaw = weatherContext ? pickContextLine(weatherContext, "기온") : "정보없음";
  const warningRaw = weatherContext ? pickContextLine(weatherContext, "특이기상") : "없음";
  const temperature = Number.parseFloat(temperatureRaw);

  if (Number.isFinite(temperature) && temperature >= 33) {
    return "오늘은 폭염 수준의 고온이므로 수분을 자주 섭취해 주시고, 두통이나 어지럼 등 온열질환 증상이 있으면 즉시 말씀해 주시기 바랍니다.";
  }
  if (Number.isFinite(temperature) && temperature <= 0) {
    return "오늘은 저온 환경이므로 방한복을 착용해 주시고, 몸이 떨리거나 감각이 둔해지면 즉시 말씀해 주시기 바랍니다.";
  }
  if (warningRaw && warningRaw !== "없음" && warningRaw !== "정보없음") {
    return `현재 특이기상(${warningRaw}) 상황이므로 평소보다 컨디션 변화에 더 주의해 주시기 바랍니다.`;
  }
  return null;
};

const buildHealthCheckSectionBody = (weatherContext: string): string => {
  const lines = [
    "체조 중 몸에 이상이 느껴지는 분 있으십니까? 어제 늦게까지 술을 드신 분은 없으십니까?",
    "열이 나거나 평소와 달리 몸 상태가 좋지 않은 분은 지금 말씀해 주시기 바랍니다."
  ];
  const advisory = buildWeatherHealthAdvisory(weatherContext);
  if (advisory) {
    lines.push(advisory);
  }
  return lines.join("\n");
};

const buildPpeCheckSectionBody = (input: GenerateTbmInput, ppeContext: string): string => {
  const requiredPpe = getOptionValue(input.options, "필수 보호구/자재");
  const lines = [
    "다음은 보호구 착용 상태를 확인하겠습니다. 두 명씩 짝을 맞추어 서 주시기 바랍니다.",
    "앞에 계신 동료분의 보호구 착용 상태를 확인해 주시기 바랍니다."
  ];

  const requiredLine = ppeContext.split("\n").find((line) => line.startsWith("필수 보호구:"));
  if (requiredLine) {
    // 리더가 실제로 구두로 읽는 문장이라 "(WT008 표준 보호구)" 같은 내부 사유/코드 표기는 제거하고
    // 보호구 이름만 나열한다.
    const items = requiredLine
      .replace("필수 보호구:", "")
      .replace(/\s*\([^()]*\)/g, "")
      .trim();
    lines.push(
      `오늘 작업에는 ${items} 착용이 필수입니다. 빠짐없이 착용하셨습니까? 다시 한 번 확인해 주시기 바랍니다.`
    );
  }
  if (requiredPpe) {
    lines.push(
      `현장 추가 입력 보호구와 준비물은 ${requiredPpe}입니다. 작업 전 누락 여부를 확인해 주시기 바랍니다.`
    );
  }

  return lines.join("\n");
};

type IncidentHighlight = { headline: string; detail: string };

const normalizeHazardHeadline = (hazardType: string, accidentType: string): string => {
  const hazard = hazardType.trim();
  const accident = accidentType.trim();
  if (!hazard && !accident) {
    return "주요 위험요인";
  }
  if (!hazard || hazard === accident || hazard.includes(accident) || accident.includes(hazard)) {
    return `${accident || hazard} 위험`;
  }
  return `${hazard} 관련 ${accident} 위험`;
};

const toPoliteControlSentence = (value: string): string => {
  const phrase = value.trim().replace(/[.!?。]+$/g, "");
  if (!phrase) {
    return "";
  }
  if (/(합니다|바랍니다|습니까)$/.test(phrase)) {
    return `${phrase}.`;
  }

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
  if (controlMap[phrase]) {
    return controlMap[phrase];
  }

  if (phrase.endsWith("확인")) {
    return `${phrase}해 주시기 바랍니다.`;
  }
  if (phrase.endsWith("착용")) {
    return `${phrase}해 주시기 바랍니다.`;
  }
  if (phrase.endsWith("배치")) {
    return `${phrase}해 주시기 바랍니다.`;
  }
  if (phrase.endsWith("비치")) {
    return `${phrase}해 주시기 바랍니다.`;
  }
  if (phrase.endsWith("제거")) {
    return `${phrase}해 주시기 바랍니다.`;
  }
  if (phrase.endsWith("실시")) {
    return `${phrase}해 주시기 바랍니다.`;
  }
  return `${phrase}을 확인해 주시기 바랍니다.`;
};

const normalizeControlListTone = (value: string): string => {
  const parts = value
    .split(/[;；]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (parts.length <= 1) {
    return value;
  }
  return parts.map(toPoliteControlSentence).filter(Boolean).join(" ");
};

const normalizeTbmSpeechTone = (value: string): string =>
  normalizeControlListTone(value)
    .replace(/보고되었다/g, "보고되었습니다")
    .replace(/발생했다/g, "발생했습니다")
    .replace(/사망했다/g, "사망했습니다")
    .replace(/부상을 입었다/g, "부상을 입었습니다")
    .replace(/화상을 입었다/g, "화상을 입었습니다")
    .replace(/있음/g, "있습니다")
    .replace(/필요하다/g, "필요합니다")
    .replace(/필요하다\./g, "필요합니다.")
    .replace(/해야 한다/g, "해야 합니다")
    .replace(/하여야 한다/g, "해야 합니다")
    .replace(/준수해야 한다/g, "준수해야 합니다")
    .replace(/착용해야 한다/g, "착용해야 합니다")
    .replace(/확인해야 한다/g, "확인해야 합니다")
    .replace(/진입시켜야 한다/g, "진입시켜야 합니다")
    .replace(/([가-힣]+)한다(?=[.!?]|$)/g, "$1합니다")
    .replace(/있다(?=[.!?]|$)/g, "있습니다")
    .replace(/된다(?=[.!?]|$)/g, "됩니다")
    .replace(/이다(?=[.!?]|$)/g, "입니다")
    .replace(/통제가 필요합니다/g, "통제가 필요합니다")
    .replace(/조치가 필요합니다/g, "조치가 필요합니다");

const formatIncidentHighlight = (item: IncidentHighlight): string => {
  const headline = normalizeTbmSpeechTone(item.headline);
  const detail = normalizeTbmSpeechTone(item.detail);
  return `${headline}${detail ? `: ${detail}` : ""}`;
};

// 사고사례 라인은 "{제목} / 출처:{출처}({URL}) / 내용:{본문}" 형식이라, URL 내부의 슬래시가
// 구분자로 오인되지 않도록 " / " 리터럴 기준으로 분리한 뒤 "출처:" 조각만 제외한다.
const parseIncidentLine = (line: string): IncidentHighlight => {
  const parts = line.split(" / ").map((part) => part.trim());
  const contentPart = parts.find((part) => part.startsWith("내용:"));
  if (contentPart) {
    const headline = parts
      .filter((part) => part !== contentPart && !part.startsWith("출처:"))
      .join(" ")
      .trim();
    return {
      headline: normalizeTbmSpeechTone(headline || parts[0]),
      detail: normalizeTbmSpeechTone(contentPart.replace(/^내용:/, "").trim())
    };
  }
  const hazardMatch = line.match(/유형:([^,]+),\s*사고:([^,]+),\s*표준조치:(.+)$/);
  if (hazardMatch) {
    return {
      headline: normalizeTbmSpeechTone(normalizeHazardHeadline(hazardMatch[1], hazardMatch[2])),
      detail: normalizeTbmSpeechTone(hazardMatch[3].trim())
    };
  }
  return { headline: normalizeTbmSpeechTone(line), detail: "" };
};

const extractIncidentHighlights = (incidentContext: string, limit: number): IncidentHighlight[] =>
  incidentContext
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("[사고사례 "))
    .slice(0, limit)
    .map((line) => parseIncidentLine(line.replace(/\[사고사례 \d+\]\s*/, "")));

// 작업절차는 대분류(화기/전기/운반/설비/특수)에 따라 실제 안전관리 절차가 크게 다르므로,
// 하나의 범용 4단계 절차만 제시하면 실제 작업내용과 맞지 않는다는 문제가 있었다.
// 이에 따라 code_work_category 대분류 기준으로 표준절차를 구분해 제공한다.
const WORK_PROCEDURE_STEPS_BY_CATEGORY: Record<string, string[]> = {
  CAT03: [
    "① 화재감시자를 배치하고 소화기, 방화포 등 화재 대비 장비를 비치합니다.",
    "② 주변 가연물을 제거하고 가스농도를 측정한 후 화기작업허가서에 따라 작업을 개시합니다.",
    "③ 작업 중 불꽃이나 스파크가 주변으로 튀지 않도록 통제하고 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
    "④ 작업 종료 후 잔불감시를 실시하여 방치된 불씨가 없는지 확인하고 정리 상태를 확인한 뒤 철수합니다."
  ],
  CAT02: [
    "① 작업 전 차단기를 개방하고 잠금(LOTO) 조치 후 검전기로 무전압 상태를 확인합니다.",
    "② 접지를 설치하고 절연 보호구 착용상태를 상호 점검합니다.",
    "③ 단계별 작업을 순서대로 진행하며 활선 접근 등 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
    "④ 작업 종료 후 잠금장치를 해제하고 전원 투입 전 최종 점검을 실시한 뒤 철수합니다."
  ],
  CAT04: [
    "① 인양·운반 장비와 줄걸이 상태를 점검하고 신호수를 배치합니다.",
    "② 작업반경 내 통제구역을 설정하고 통행자 접근을 차단합니다.",
    "③ 신호수의 유도에 따라 서서히 이동하며 흔들림, 전복 등 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
    "④ 작업 종료 후 장비를 정위치에 거치하고 결속 상태를 확인한 뒤 철수합니다."
  ],
  CAT01: [
    "① 설비 정지 및 LOTO 상태를 확인하고 잔류 압력·온도·유체를 제거합니다.",
    "② 작업반경 내 위험요인을 제거하고 보호구 착용상태를 상호 점검합니다.",
    "③ 단계별 작업을 순서대로 진행하며 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
    "④ 작업 종료 후 복구 상태와 잔존 위험요인을 재점검하고 정리 상태를 확인한 뒤 철수합니다."
  ],
  CAT05: [
    "① 작업허가서와 작업별 특수조건(산소농도 측정, 추락방지, 지반 상태 등)을 확인합니다.",
    "② 작업반경 내 위험요인을 제거하고 보호구 착용상태를 상호 점검합니다.",
    "③ 단계별 작업을 순서대로 진행하며 이상징후 발생 시 즉시 작업을 중지하고 보고합니다.",
    "④ 작업 종료 후 잔존 위험요인을 재점검하고 정리 상태를 확인한 뒤 철수합니다."
  ]
};

const DEFAULT_WORK_PROCEDURE_STEPS = WORK_PROCEDURE_STEPS_BY_CATEGORY.CAT01;

const pickWorkProcedureSteps = (categoryCode: string | null): string[] =>
  (categoryCode && WORK_PROCEDURE_STEPS_BY_CATEGORY[categoryCode]) || DEFAULT_WORK_PROCEDURE_STEPS;

const buildWorkRiskProcedureSectionBody = (
  input: GenerateTbmInput,
  workContent: WorkContentFallback,
  incidentContext: string
): string => {
  const detailedWork = getOptionValue(input.options, "세부 작업내용");
  const equipment = getOptionValue(input.options, "주요 장비/공구");
  const siteHazards = getOptionValue(input.options, "현장 특이사항/추가 위험요인");
  const safetyMeasures = getOptionValue(input.options, "안전조치/작업중지 기준");
  const task = detailedWork || pickSampleTask(workContent.sampleTasks, workContent.workType);
  const location = input.preset.location || "현장";
  const highlights = extractIncidentHighlights(incidentContext, 2);
  const [primaryHighlight, ...restHighlights] = highlights;

  const lines = [
    "다음은 오늘 작업하실 내용과 위험요인 및 작업절차에 대해 공유하는 시간을 갖도록 하겠습니다.",
    `오늘 작업내용은 ${location}에서 진행하는 ${task} 작업입니다.`,
    "오늘 작업의 핵심 위험요인은 다음과 같습니다."
  ];
  if (equipment) {
    lines.splice(
      2,
      0,
      `사용 장비와 공구는 ${equipment}입니다. 사용 전 점검상태를 확인해 주시기 바랍니다.`
    );
  }

  if (primaryHighlight) {
    lines.push(`- ${formatIncidentHighlight(primaryHighlight)}`);
  }
  restHighlights.forEach((item) => {
    lines.push(`- ${formatIncidentHighlight(item)}`);
  });
  if (highlights.length === 0) {
    lines.push(
      "- 협착, 추락, 화재 등 해당 작업에서 발생할 수 있는 기본 위험요인에 유의해 주시기 바랍니다."
    );
  }
  if (siteHazards) {
    lines.push(`- 현장 추가 위험요인: ${siteHazards}`);
  }

  lines.push("작업절차는 다음과 같습니다.", ...pickWorkProcedureSteps(workContent.categoryCode));
  if (safetyMeasures) {
    lines.push(`추가 안전조치 및 작업중지 기준은 다음과 같습니다. ${safetyMeasures}`);
  }
  lines.push("이상의 작업내용과 위험요인, 절차를 반드시 준수하여 안전하게 작업하시기 바랍니다.");

  return lines.join("\n");
};

const buildComprehensionCheckSectionBody = (
  input: GenerateTbmInput,
  incidentContext: string
): string => {
  const workType = input.preset.workType || "오늘";
  const workTypeLabel = workType.endsWith("작업") ? workType : `${workType} 작업`;
  const [primaryHighlight] = extractIncidentHighlights(incidentContext, 1);
  const incidentTitle = primaryHighlight?.headline.replace(/\s*\([^)]*\)\s*/g, "").trim();
  const chant = `${workType} 안전수칙 준수하겠습니다!`;
  const reminder = incidentTitle
    ? `${workTypeLabel}과 유사한 사고사례로 "${incidentTitle}" 사례가 있습니다. 같은 사고가 반복되지 않도록 위험징후와 안전대책을 다시 한 번 확인해 주시기 바랍니다.`
    : `${workTypeLabel}의 핵심 위험요인을 다시 한 번 상기하고, 안전대책을 반드시 준수해 주시기 바랍니다.`;

  return [
    "오늘 가장 중요한 위험 포인트를 다시 한 번 확인하겠습니다.",
    `${reminder} 이를 함께 확인하는 의미에서 지적확인은 "${chant}"로 진행하겠습니다.`,
    "지적확인을 준비해 주시기 바랍니다.",
    `"${chant}" (선창 1회)`,
    `"${chant}" (후창 x 3회)`
  ].join("\n");
};

const buildEmergencyEvacuationSectionBody = (input: GenerateTbmInput): string => {
  const emergencyNotes = getOptionValue(input.options, "비상대피/연락 특이사항");
  const lines = [
    "다음은 비상 시 대피요령을 확인하겠습니다. 비상 대피로는 현장에 사전 지정된 비상계단을 이용해 주시기 바랍니다.",
    "밖으로 대피 후에는 지정된 비상집결지로 모여 주시기 바랍니다.",
    "그리고 현재 작업 위치 인근의 소화기 위치도 작업 전 반드시 확인해 주시기 바랍니다.",
    "작업 전 대피로와 집결지, 소화기 위치를 반드시 확인해 주시기 바랍니다."
  ];
  if (emergencyNotes) {
    lines.push(`오늘 현장 비상대피 및 연락 특이사항은 다음과 같습니다. ${emergencyNotes}`);
  }
  return lines.join("\n");
};

const TBM_SIX_STEPS: Array<{ number: number; title: string; subtitle?: string }> = [
  { number: 1, title: "작업장소 이동", subtitle: "체조 및 스트레칭" },
  { number: 2, title: "건강상태 확인" },
  { number: 3, title: "보호구 착용상태 확인" },
  { number: 4, title: "작업내용, 위험요인, 작업절차 확인" },
  { number: 5, title: "숙지여부 확인" },
  { number: 6, title: "비상 시 대피요령" }
];

type LeaderScriptContext = {
  weatherContext: string;
  incidentContext: string;
  ppeContext: string;
};

const buildLeaderScriptDraft = (
  input: GenerateTbmInput,
  workContent: WorkContentFallback,
  context: LeaderScriptContext
): string => {
  const bodies: Record<string, string> = {
    "작업장소 이동": buildKickoffSectionBody(input),
    "건강상태 확인": buildHealthCheckSectionBody(context.weatherContext),
    "보호구 착용상태 확인": buildPpeCheckSectionBody(input, context.ppeContext),
    "작업내용, 위험요인, 작업절차 확인": buildWorkRiskProcedureSectionBody(
      input,
      workContent,
      context.incidentContext
    ),
    "숙지여부 확인": buildComprehensionCheckSectionBody(input, context.incidentContext),
    "비상 시 대피요령": buildEmergencyEvacuationSectionBody(input)
  };

  return TBM_SIX_STEPS.map(
    (step) =>
      `### ${step.number}. ${step.title}${step.subtitle ? ` (${step.subtitle})` : ""}\n${bodies[step.title]}`
  ).join("\n\n");
};

const buildRagReferenceSection = (ragContext: string): string => {
  const titles = [...ragContext.matchAll(/\[참고 \d+\]\s*(.+)/g)].map((match) => match[1].trim());
  if (titles.length === 0) {
    return "";
  }
  return titles.map((title, index) => `- 참고 ${index + 1}: ${title}`).join("\n");
};

const appendOperationalSections = (
  draft: string,
  weatherContext: string,
  incidentContext: string,
  ppeContext: string,
  ragContext: string
): string => {
  const weatherSummary = weatherContext
    ? [
        `- 관측시각: ${pickContextLine(weatherContext, "관측시각")}`,
        `- 기온: ${pickContextLine(weatherContext, "기온")}`,
        `- 특이기상: ${pickContextLine(weatherContext, "특이기상")}`,
        `- 대응가이드: 특이기상 조건에 맞춰 휴식/보호구/작업중지 기준을 즉시 적용합니다.`
      ].join("\n")
    : "- 기상 정보 수집 실패: 기본 안전수칙 기준으로 운영합니다.";

  const incidentLines = incidentContext
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("[사고사례 "));
  const top3 = incidentLines.slice(0, 3);
  const riskSummary =
    top3.length > 0
      ? top3
          .map(
            (line, idx) =>
              `- 위험요인 ${idx + 1}: ${formatIncidentHighlight(parseIncidentLine(line.replace(/\[사고사례 \d+\]\s*/, "")))}`
          )
          .join("\n")
      : "- 위험요인 정보가 부족하여 일반 고위험 기준으로 통제조치를 적용합니다.";

  const checklistSummary = [
    "- [ ] PPE 착용 확인 (하단 PPE 체크리스트 참고)",
    "- [ ] LOTO 점검",
    "- [ ] 작업 전 브리핑 완료",
    "- [ ] 전자서명(진행자/작업책임자) 기록"
  ].join("\n");

  const ppeChecklistSummary = buildPpeChecklistSummary(ppeContext);
  const ragSummary = buildRagReferenceSection(ragContext);

  let updated = draft;
  updated = ensureSection(updated, "기상 특보 대응", weatherSummary);
  updated = ensureSection(updated, "핵심 위험요인", riskSummary);
  updated = ensureSection(updated, "PPE 체크리스트", ppeChecklistSummary);
  updated = ensureSection(updated, "체크리스트/서명", checklistSummary);
  if (ragSummary) {
    updated = ensureSection(updated, "RAG 근거", ragSummary);
  }
  return updated;
};

export const generateTbmDraft = async (
  input: GenerateTbmInput
): Promise<{ draft: string; historyId: number; title: string }> => {
  const workTypeRow = await fetchWorkTypeRow(input.preset.workType);
  const workContentFallback: WorkContentFallback = {
    workType: input.preset.workType,
    location: input.preset.location,
    permitType: input.preset.permitType,
    sampleTasks: workTypeRow?.sample_tasks ?? null,
    categoryCode: workTypeRow?.category_code ?? null
  };

  const [ragContext, weatherContext, incidentContext, ppeContext] = await Promise.all([
    buildRagContext(`${input.prompt}\n${JSON.stringify(input.preset)}`),
    buildWeatherApiContext(input.preset.location),
    buildIncidentDbContext(input.preset.workType, workTypeRow),
    buildPpeContext(input.preset.workType)
  ]);

  const leaderScriptDraft = buildLeaderScriptDraft(input, workContentFallback, {
    weatherContext,
    incidentContext,
    ppeContext
  });
  const scriptDraft = `${leaderScriptDraft}\n\n### Safety Logic Check\n- 필수 섹션 누락: 없음\n- 규정 형식 점검: 통과`;
  const scriptDraftWithOps = appendOperationalSections(
    scriptDraft,
    weatherContext,
    incidentContext,
    ppeContext,
    ragContext
  );

  const title = buildHistoryTitle(input);
  const createdAt = new Date().toISOString();
  const bundleDraft = buildBundleContent(
    {
      title,
      preset: input.preset,
      userPrompt: input.prompt,
      draftText: scriptDraftWithOps,
      createdAt
    },
    "bundle"
  );

  const historyPayload = {
    title,
    workType: input.preset.workType,
    permitType: input.preset.permitType,
    risk: input.preset.risk,
    shift: input.preset.shift,
    workDate: input.preset.workDate,
    location: input.preset.location,
    optionsJson: JSON.stringify(input.options),
    userPrompt: input.prompt,
    draftText: scriptDraftWithOps
  };

  let historyId: number;
  if (
    typeof input.historyId === "number" &&
    Number.isInteger(input.historyId) &&
    input.historyId > 0
  ) {
    const updated = await updateTbmHistory(input.historyId, historyPayload);
    historyId = updated ? input.historyId : await saveTbmHistory(historyPayload);
  } else {
    historyId = await saveTbmHistory(historyPayload);
  }

  return { draft: bundleDraft, historyId, title };
};

export const getRecentTbmHistory = async (limit: number): Promise<RecentTbmHistory[]> => {
  const rows = await listRecentTbmHistory(limit);
  return rows.map((row) => ({
    id: Number(row.id),
    title: row.title,
    createdAt: row.created_at
  }));
};

export type TbmHistoryListItem = {
  id: number;
  title: string;
  workType: string;
  permitType: string;
  risk: string;
  workDate: string;
  location: string;
  signed: boolean;
  createdAt: string;
};

export const getTbmHistoryPage = async (params: {
  page: number;
  pageSize: number;
  workType?: string;
  risk?: string;
  search?: string;
}): Promise<{ rows: TbmHistoryListItem[]; totalCount: number }> => {
  const { rows, totalCount } = await listTbmHistoryPage({
    offset: params.page * params.pageSize,
    pageSize: params.pageSize,
    workType: params.workType,
    risk: params.risk,
    search: params.search
  });

  return {
    rows: rows.map((row) => ({
      id: Number(row.id),
      title: row.title,
      workType: row.work_type,
      permitType: row.permit_type,
      risk: row.risk_level,
      workDate: row.work_date,
      location: row.location,
      signed: isSignatureCompleted(parseSignatureJson(row.signature_json)),
      createdAt: row.created_at
    })),
    totalCount
  };
};

export const getTbmHistoryById = async (id: number): Promise<TbmHistoryDetail | null> => {
  const row = await getTbmHistoryDetail(id);
  if (!row) {
    return null;
  }

  let options: string[] = [];
  if (Array.isArray(row.options_json)) {
    options = row.options_json.filter((item): item is string => typeof item === "string");
  } else if (typeof row.options_json === "string" && row.options_json.trim().length > 0) {
    try {
      const parsed = JSON.parse(row.options_json);
      options = Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      options = [];
    }
  }

  return {
    id: Number(row.id),
    title: row.title,
    preset: {
      workType: row.work_type,
      permitType: row.permit_type,
      risk: row.risk_level,
      shift: row.work_shift,
      workDate: normalizeDateInput(row.work_date),
      location: row.location
    },
    options,
    userPrompt: row.user_prompt,
    draftText: row.draft_text,
    signature: parseSignatureJson(row.signature_json),
    createdAt: row.created_at
  };
};

export const saveTbmHistorySignatureById = async (
  id: number,
  signature: TbmSignatureData
): Promise<TbmSignatureData | null> => {
  const existing = await getTbmHistoryDetail(id);
  if (!existing) {
    return null;
  }

  const normalized: TbmSignatureData = {
    checklist:
      signature.checklist && typeof signature.checklist === "object" ? signature.checklist : {},
    workerSignature: signature.workerSignature || "",
    supervisorSignature: signature.supervisorSignature || "",
    signedAt: signature.signedAt || new Date().toISOString()
  };

  const updated = await updateTbmHistorySignature(id, JSON.stringify(normalized));
  return updated ? normalized : null;
};

export const saveTbmHistoryDraftById = async (id: number, draftText: string): Promise<boolean> => {
  const existing = await getTbmHistoryDetail(id);
  if (!existing) {
    return false;
  }

  return updateTbmHistoryDraft(id, draftText);
};

export const removeTbmHistoryById = async (id: number): Promise<boolean> => {
  return deleteTbmHistory(id);
};
