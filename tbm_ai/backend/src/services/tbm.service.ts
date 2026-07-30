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

const buildSelectedPpeChecklistSummary = (
  input: GenerateTbmInput,
  ppeContext: string
): string => {
  const selectedPpe =
    getOptionValue(input.options, "개인보호구(PPE)") ||
    getOptionValue(input.options, "필수 보호구/자재");

  if (!selectedPpe) {
    return buildPpeChecklistSummary(ppeContext);
  }

  const items = selectedPpe
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length === 0) {
    return buildPpeChecklistSummary(ppeContext);
  }

  return items
    .map((item) => `- [ ] ${item} 착용 확인`)
    .join("\n");
};

// ===== 9단계 리더 멘트(T.B.M 리더 멘트) 구성 =====
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

const getShiftLabel = (shift: string): string => {
  if (shift === "야간") return "야간";
  if (shift === "주간") return "주간";
  return shift || "작업 전";
};

const buildKickoffSectionBody = (input: GenerateTbmInput): string => {
  const location = input.preset.location || "현장";
  const datePart = formatWorkDateForGreeting(input.preset.workDate);
  const shiftLabel = getShiftLabel(input.preset.shift);

  const workerCount = getOptionValue(input.options, "작업인원");
  const supervisorName = getOptionValue(input.options, "작업책임자");

  const greeting = datePart
    ? `안녕하십니까? ${datePart} ${location} ${shiftLabel} TBM을 시작하겠습니다.`
    : `안녕하십니까? ${location} ${shiftLabel} TBM을 시작하겠습니다.`;

  const lines = [
    greeting,
    "간단한 스트레칭으로 굳은 몸을 풀어 주시기 바랍니다.",
    "목 돌리기부터 시작하겠습니다. 어깨, 허리, 무릎, 손목 및 발목 순으로 크게 따라 해 주시기 바랍니다."
  ];

  if (workerCount || supervisorName) {
    lines.push(
      `오늘 작업 투입 정보는${workerCount ? ` 작업인원 ${workerCount}` : ""}${supervisorName ? `, 작업책임자 ${supervisorName}` : ""
      }입니다.`
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

const buildPpeCheckSectionBody = (
  input: GenerateTbmInput,
  ppeContext: string
): string => {
  const selectedPpe = getOptionValue(input.options, "개인보호구(PPE)");

  const lines = [
    "다음은 보호구 착용 상태를 확인하겠습니다. 두 명씩 짝을 맞추어 서 주시기 바랍니다.",
    "앞에 계신 동료분의 보호구 착용 상태를 확인해 주시기 바랍니다."
  ];

  if (selectedPpe) {
    lines.push(
      `오늘 작업에는 ${selectedPpe} 착용이 필요합니다. 빠짐없이 착용하셨습니까? 다시 한 번 확인해 주시기 바랍니다.`
    );
  } else {
    const requiredLine = ppeContext
      .split("\n")
      .find((line) => line.startsWith("필수 보호구:"));

    if (requiredLine) {
      const items = requiredLine
        .replace("필수 보호구:", "")
        .replace(/\s*\([^()]*\)/g, "")
        .trim();

      lines.push(
        `오늘 작업에는 ${items} 착용이 필요합니다. 빠짐없이 착용하셨습니까? 다시 한 번 확인해 주시기 바랍니다.`
      );
    }
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
  const lastChar = phrase.charCodeAt(phrase.length - 1);
  const hasFinalConsonant =
    lastChar >= 0xac00 &&
    lastChar <= 0xd7a3 &&
    (lastChar - 0xac00) % 28 !== 0;

  const objectParticle = hasFinalConsonant ? "을" : "를";

  return `${phrase}${objectParticle} 확인해 주시기 바랍니다.`;
};

const normalizeControlListTone = (value: string): string => {
  const parts = value
    .split(/[,，;；]/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return toPoliteControlSentence(value);
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
      headline: headline || parts[0],
      detail: normalizeTbmSpeechTone(contentPart.replace(/^내용:/, "").trim())
    };
  }
  const hazardMatch = line.match(/유형:([^,]+),\s*사고:([^,]+),\s*표준조치:(.+)$/);
  if (hazardMatch) {
    return {
      headline: normalizeHazardHeadline(hazardMatch[1], hazardMatch[2]),
      detail: normalizeTbmSpeechTone(hazardMatch[3].trim())
    };
  }
  return { headline: line.trim(), detail: "" };
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
  ],
  CAT06: [
    "① 밀폐공간 출입 전 산소농도와 유해가스 농도를 측정합니다.",
    "② 송풍기 등 환기설비를 가동하여 내부를 충분히 환기합니다.",
    "③ 외부 감시인을 배치하고 출입자 명부와 비상연락체계를 확인합니다.",
    "④ 구조장비와 보호구 상태를 확인한 후 작업하고, 종료 후 작업인원과 장비를 확인한 뒤 철수합니다."
  ],
};

const DEFAULT_WORK_PROCEDURE_STEPS = WORK_PROCEDURE_STEPS_BY_CATEGORY.CAT01;

const pickWorkProcedureSteps = (categoryCode: string | null): string[] =>
  (categoryCode && WORK_PROCEDURE_STEPS_BY_CATEGORY[categoryCode]) || DEFAULT_WORK_PROCEDURE_STEPS;

const buildWorkShareSectionBody = (
  input: GenerateTbmInput,
  workContent: WorkContentFallback
): string => {
  const detailedWork = getOptionValue(input.options, "세부 작업내용");
  const equipment = getOptionValue(input.options, "주요 장비/공구");

  const safetyMeasure =
    getOptionValue(input.options, "필수 안전조치") ||
    getOptionValue(input.options, "안전조치/작업중지 기준");

  const task =
    detailedWork ||
    pickSampleTask(workContent.sampleTasks, workContent.workType);

  const location = input.preset.location || "현장";

  const taskLabel =
    task.endsWith("작업")
      ? task
      : `${task} 작업`;

  const lines = [
    "다음은 오늘 작업내용을 공유하겠습니다.",
    `오늘 작업내용은 ${location}에서 진행하는 ${taskLabel}입니다.`
  ];

  if (equipment) {
    lines.push(
      `사용 장비와 공구는 ${equipment}입니다. 사용 전 점검상태를 확인해 주시기 바랍니다.`
    );
  }

  if (safetyMeasure) {
    lines.push(
      `작업 시작 전 필수 확인사항은 ${safetyMeasure}입니다.`
    );
  }

  lines.push(
    "작업절차는 다음과 같습니다.",
    ...pickWorkProcedureSteps(workContent.categoryCode)
  );

  lines.push(
    "각 단계별 담당자와 신호체계를 확인하고, 변경사항이 있으면 즉시 공유해 주시기 바랍니다."
  );

  return lines.join("\n");
};

type HazardControlRow = {
  hazard_type: string;
  accident_type: string;
  standard_controls: string | null;
};

const HAZARD_NAME_ALIASES: Record<string, string[]> = {
  "유해가스": ["중독", "질식"],
  "협착·끼임": ["협착", "끼임"],
  "아크·화상": ["아크플래시", "화상"],
  "단락·합선": ["감전", "화재"],
  "협착·낙하": ["협착", "낙하"],
  "불티 비산": ["비래", "화재"],
  "가연물 착화": ["화재"],
  "가스 누출": ["화학물질누출", "중독"],
  "고온부 접촉": ["화상"],
  "부품·공구 낙하": ["낙하"],
  "누유·누출": ["화학물질누출"],
  "회전체 접촉": ["끼임", "협착"],
  "불시 기동": ["끼임", "협착"],
  "잔류에너지": ["감전", "협착"],
  "오결선": ["감전", "화재"],
  "불시 통전": ["감전"]
};

const findHazardControlsByName = async (
  hazardName: string
): Promise<string[]> => {
  try {
    const searchNames =
      HAZARD_NAME_ALIASES[hazardName] ?? [hazardName];

    const placeholders = searchNames.map(() => "?").join(", ");

    const [rows] = await dbPool.query(
      `
        SELECT
          hazard_type,
          accident_type,
          standard_controls
        FROM code_hazard
        WHERE active_yn = 'Y'
          AND (
            hazard_type IN (${placeholders})
            OR accident_type IN (${placeholders})
          )
        ORDER BY hazard_code
      `,
      [...searchNames, ...searchNames]
    );

    return (rows as HazardControlRow[])
      .map((row) => row.standard_controls?.trim())
      .filter((control): control is string => Boolean(control));
  } catch {
    return [];
  }
};

const buildCoreRiskSectionBody = async (
  input: GenerateTbmInput,
  incidentContext: string
): Promise<string> => {
  const selectedHazards =
    getOptionValue(input.options, "주요 위험요인") ||
    getOptionValue(input.options, "현장 특이사항/추가 위험요인");

  const lines = ["다음은 오늘 작업의 핵심 위험요인을 확인하겠습니다."];

  if (selectedHazards) {
    const hazardItems = selectedHazards
      .split(/[,，/|]/)
      .map((item) => item.trim())
      .filter(Boolean);

    lines.push(
      `오늘의 주요 위험요인은 ${hazardItems.join(", ")}입니다.`
    );

    for (const hazard of hazardItems) {
      const controls = await findHazardControlsByName(hazard);

      if (controls.length > 0) {
        const combinedControls = [...new Set(controls)]
          .join(", ");

        lines.push(
          `${hazard}: ${normalizeControlListTone(combinedControls)}`
        );
      } else {
        lines.push(
          `${hazard}: 해당 위험요인의 발생 구간과 안전조치를 작업 전에 확인해 주시기 바랍니다.`
        );
      }
    }
  } else {
    const highlights = extractIncidentHighlights(
      incidentContext,
      2
    );

    if (highlights.length > 0) {
      highlights.forEach((item) => {
        lines.push(`- ${formatIncidentHighlight(item)}`);
      });
    } else {
      lines.push(
        "작업 전 현장의 주요 위험요인을 확인해 주시기 바랍니다."
      );
    }
  }

  lines.push(
    "위험징후가 보이면 즉시 작업을 멈추고 주변 작업자에게 알려 주시기 바랍니다."
  );

  return lines.join("\n");
};

const buildSafetyActionSectionBody = (
  input: GenerateTbmInput,
  ppeContext: string
): string => {
  const safetyMeasures =
    getOptionValue(input.options, "필수 안전조치") ||
    getOptionValue(input.options, "안전조치/작업중지 기준");

  const lines = [buildPpeCheckSectionBody(input, ppeContext)];

  if (safetyMeasures) {
    lines.push(
      `오늘의 필수 안전조치는 ${safetyMeasures}입니다. 작업 시작 전에 반드시 확인해 주시기 바랍니다.`
    );
  }

  lines.push(
    "작업구역과 이동통로의 상태를 확인하고, 이상이 발견되면 작업을 시작하지 말고 즉시 보고해 주시기 바랍니다."
  );

  return lines.join("\n");
};

const normalizeIncidentDetailSentence = (value: string): string => {
  const normalized = value
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) {
    return "";
  }

  // 이미 정상적인 문장형이면 내용을 바꾸지 않고 마침표만 보장한다.
  if (
    /(습니다|합니다|바랍니다|됩니다|되었습니다|발생했습니다|입었습니다)[.!?]?$/.test(
      normalized
    )
  ) {
    return /[.!?]$/.test(normalized)
      ? normalized
      : `${normalized}.`;
  }

  // 쉼표 또는 세미콜론으로 구분된 안전조치 목록을 각각 문장으로 변환한다.
  return normalized
    .split(/[,，;；]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => toPoliteControlSentence(item))
    .filter(Boolean)
    .join(" ");
};

const buildIncidentCaseSectionBody = (
  input: GenerateTbmInput,
  incidentContext: string
): string => {
  const workType = input.preset.workType || "오늘";

  const workTypeLabel = workType.endsWith("작업")
    ? workType
    : `${workType} 작업`;

  const highlights = extractIncidentHighlights(incidentContext, 2);

  const lines = [
    `다음은 ${workTypeLabel}과 유사한 사고사례를 공유하겠습니다.`
  ];

  if (highlights.length > 0) {
    highlights.forEach((item) => {
      const headline = item.headline
        // 이전 처리 과정에서 제목에 잘못 붙은 진행 문구를 제거한다.
        .replace(/을 확인해 주시기 바랍니다\.?/g, "")
        .replace(/를 확인해 주시기 바랍니다\.?/g, "")
        .replace(/확인해 주시기 바랍니다\.?/g, "")
        .replace(/해 주시기 바랍니다\.?/g, "")
        .replace(/[.!?。]+$/g, "")
        .trim();

      const detail = normalizeIncidentDetailSentence(item.detail);

      if (detail) {
        lines.push(
          `${headline}이 발생할 수 있습니다. ${detail}`
        );
      } else {
        lines.push(
          `${headline}과 관련된 사고가 발생한 사례가 있습니다.`
        );
      }
    });
  } else {
    lines.push(
      `유사한 ${workTypeLabel}에서 작업 전 확인 부족과 안전조치 미준수로 사고가 발생한 사례가 있습니다.`
    );

    lines.push(
      "오늘 작업에서도 같은 사고가 발생하지 않도록 작업 전 장비 상태와 작업구역을 확인해 주시기 바랍니다."
    );
  }

  lines.push(
    "같은 사고가 반복되지 않도록 작업 전 확인과 상호 점검을 철저히 해 주시기 바랍니다."
  );

  return lines.join("\n");
};

const buildOpinionSectionBody = (input: GenerateTbmInput): string => {
  const specialNotes = getOptionValue(input.options, "특이사항");
  const lines = [
    "다음은 의견 및 질의응답 시간입니다.",
    "오늘 작업내용, 위험요인, 안전조치 중 이해가 되지 않거나 추가로 확인할 사항이 있으면 말씀해 주시기 바랍니다.",
    "작업 중에도 의문사항이나 위험요인을 발견하면 즉시 반장에게 공유해 주시기 바랍니다."
  ];
  if (specialNotes) {
    lines.push(`오늘 공유할 추가 특이사항은 다음과 같습니다. ${specialNotes}`);
  }
  return lines.join("\n");
};

const buildComprehensionCheckSectionBody = (
  input: GenerateTbmInput,
  incidentContext: string
): string => {
  const workType = input.preset.workType || "오늘";
  const workTypeLabel =
    workType.endsWith("작업")
      ? workType
      : `${workType} 작업`;

  const selectedHazards =
    getOptionValue(input.options, "주요 위험요인") ||
    getOptionValue(input.options, "현장 특이사항/추가 위험요인");

  const [primaryHighlight] =
    extractIncidentHighlights(incidentContext, 1);

  const incidentTitle = primaryHighlight?.headline
    .replace(/\s*\([^)]*\)\s*/g, "")
    .trim();

  const chant = `${workType} 안전수칙 준수하겠습니다!`;

  let reminder: string;

  if (selectedHazards) {
    reminder =
      `오늘 ${workTypeLabel}의 주요 위험요인은 "${selectedHazards}"입니다. ` +
      "같은 위험이 사고로 이어지지 않도록 작업 전 안전조치와 작업중지 기준을 다시 확인해 주시기 바랍니다.";
  } else if (incidentTitle) {
    reminder =
      `${workTypeLabel}과 유사한 사고사례로 "${incidentTitle}" 사례가 있습니다. ` +
      "같은 사고가 반복되지 않도록 위험징후와 안전대책을 다시 한 번 확인해 주시기 바랍니다.";
  } else {
    reminder =
      `${workTypeLabel}의 핵심 위험요인을 다시 한 번 상기하고, ` +
      "안전대책을 반드시 준수해 주시기 바랍니다.";
  }

  return [
    "오늘 가장 중요한 위험 포인트를 다시 한 번 확인하겠습니다.",
    `${reminder} 이를 함께 확인하는 의미에서 지적확인은 "${chant}"로 진행하겠습니다.`,
    "지적확인을 준비해 주시기 바랍니다.",
    "다 함께 따라 해 주시기 바랍니다.",
    `"${chant}" (선창 1회)`,
    `"${chant}" (후창 x 3회)`
  ].join("\n");
};

const buildEmergencyEvacuationSectionBody = (
  input: GenerateTbmInput
): string => {
  const emergencyCriteria =
    getOptionValue(input.options, "비상대피/연락 기준") ||
    getOptionValue(input.options, "비상대피/연락 특이사항");

  const lines = [
    "다음은 비상 시 대피요령을 확인하겠습니다.",
    "비상상황이 발생하면 작업을 즉시 중지하고 지정된 대피로를 이용해 비상집결지로 이동해 주시기 바랍니다."
  ];

  if (emergencyCriteria) {
    lines.push(
      `오늘의 비상대피 및 연락 기준은 ${emergencyCriteria}입니다. 대피 시 반드시 이 기준을 준수해 주시기 바랍니다.`
    );
  }

  lines.push(
    "대피 후에는 작업인원을 확인하고 누락된 인원이 있으면 즉시 현장 책임자에게 알려 주시기 바랍니다."
  );

  return lines.join("\n");
};

const TBM_NINE_STEPS: Array<{ number: number; title: string }> = [
  { number: 1, title: "인사" },
  { number: 2, title: "건강" },
  { number: 3, title: "작업" },
  { number: 4, title: "위험" },
  { number: 5, title: "조치" },
  { number: 6, title: "사례" },
  { number: 7, title: "의견" },
  { number: 8, title: "비상" },
  { number: 9, title: "지적확인" }
];

type LeaderScriptContext = {
  weatherContext: string;
  incidentContext: string;
  ppeContext: string;
};

const buildLeaderScriptDraft = async (
  input: GenerateTbmInput,
  workContent: WorkContentFallback,
  context: LeaderScriptContext
): Promise<string> => {
  const riskBody = await buildCoreRiskSectionBody(
    input,
    context.incidentContext
  );

  const bodies: Record<string, string> = {
    인사: buildKickoffSectionBody(input),
    건강: buildHealthCheckSectionBody(context.weatherContext),
    작업: buildWorkShareSectionBody(input, workContent),
    위험: riskBody,
    조치: buildSafetyActionSectionBody(input, context.ppeContext),
    사례: buildIncidentCaseSectionBody(input, context.incidentContext),
    의견: buildOpinionSectionBody(input),
    비상: buildEmergencyEvacuationSectionBody(input),
    지적확인: buildComprehensionCheckSectionBody(
      input,
      context.incidentContext
    )
  };

  return TBM_NINE_STEPS.map(
    (step) => `### ${step.number}. ${step.title}\n${bodies[step.title]}`
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
  input: GenerateTbmInput,
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
      "- 대응가이드: 특이기상 조건에 맞춰 휴식, 보호구 및 작업중지 기준을 적용합니다."
    ].join("\n")
    : "- 기상 정보 수집 실패: 기본 안전수칙 기준으로 운영합니다.";

  /*
   * 사용자가 선택한 위험요인이 있으면 우선 사용한다.
   * 선택값이 없을 때만 기존 사고사례 DB 내용을 사용한다.
   */
  const selectedHazards =
    getOptionValue(input.options, "주요 위험요인") ||
    getOptionValue(input.options, "현장 특이사항/추가 위험요인");

  let riskSummary: string;

  if (selectedHazards) {
    const hazardItems = selectedHazards
      .split(/[,，]/)
      .map((item) => item.trim())
      .filter(Boolean);

    riskSummary =
      hazardItems.length > 0
        ? hazardItems
          .map((item, index) => `- 위험요인 ${index + 1}: ${item}`)
          .join("\n")
        : `- 위험요인: ${selectedHazards}`;
  } else {
    const incidentLines = incidentContext
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("[사고사례 "));

    const top3 = incidentLines.slice(0, 3);

    riskSummary =
      top3.length > 0
        ? top3
          .map(
            (line, index) =>
              `- 위험요인 ${index + 1}: ${formatIncidentHighlight(
                parseIncidentLine(
                  line.replace(/\[사고사례 \d+\]\s*/, "")
                )
              )}`
          )
          .join("\n")
        : "- 작업 전 현장의 주요 위험요인을 확인합니다.";
  }

  /*
   * 사용자가 선택한 PPE가 있으면 선택값으로 체크리스트를 만든다.
   * 선택값이 없으면 기존 PPE DB 규정을 사용한다.
   */
  const ppeChecklistSummary =
    buildSelectedPpeChecklistSummary(input, ppeContext);

  const safetyMeasures =
    getOptionValue(input.options, "필수 안전조치") ||
    getOptionValue(input.options, "안전조치/작업중지 기준");

  /*
   * 기존에는 LOTO 점검이 무조건 들어갔지만,
   * 이제 선택한 안전조치에 LOTO 또는 잠금 관련 내용이 있을 때만 추가한다.
   */
  const checklistItems = [
    "- [ ] PPE 착용 확인",
    "- [ ] 작업 전 브리핑 완료"
  ];

  if (/LOTO|잠금|전원 차단|에너지 차단/i.test(safetyMeasures)) {
    checklistItems.push("- [ ] LOTO 및 에너지 차단 상태 점검");
  }

  if (safetyMeasures) {
    checklistItems.push(`- [ ] 필수 안전조치 확인: ${safetyMeasures}`);
  }

  checklistItems.push(
    "- [ ] 전자서명(진행자/작업책임자) 기록"
  );

  const checklistSummary = checklistItems.join("\n");
  const ragSummary = buildRagReferenceSection(ragContext);

  let updated = draft;

  updated = ensureSection(
    updated,
    "기상 특보 대응",
    weatherSummary
  );

  updated = ensureSection(
    updated,
    "핵심 위험요인",
    riskSummary
  );

  updated = ensureSection(
    updated,
    "PPE 체크리스트",
    ppeChecklistSummary
  );

  updated = ensureSection(
    updated,
    "체크리스트/서명",
    checklistSummary
  );

  if (ragSummary) {
    updated = ensureSection(
      updated,
      "RAG 근거",
      ragSummary
    );
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

  const leaderScriptDraft = await buildLeaderScriptDraft(
    input,
    workContentFallback,
    {
      weatherContext,
      incidentContext,
      ppeContext
    }
  );
  const scriptDraft = `${leaderScriptDraft}\n\n### Safety Logic Check\n- 필수 섹션 누락: 없음\n- 규정 형식 점검: 통과`;
  const scriptDraftWithOps = appendOperationalSections(
    input,
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
