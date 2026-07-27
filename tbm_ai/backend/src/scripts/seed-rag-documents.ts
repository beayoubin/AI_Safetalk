import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const WORK_TYPES = [
  "화기작업",
  "밀폐공간",
  "고소작업",
  "전기작업",
  "기계정비",
  "배관정비",
  "중량물취급",
  "도장작업",
  "가스작업",
  "청소작업"
];
const RISK_LEVELS = ["HIGH", "MEDIUM", "LOW"];
const PROCESSES = ["정비동", "탱크구역", "배관구역", "전기실", "유틸리티"];
const WEATHER_TYPES = ["폭염", "강풍", "강우", "한파", "맑음"];

const createSeedRows = (targetCount: number): RagDocumentInput[] => {
  const rows: RagDocumentInput[] = [];
  for (let i = 1; i <= targetCount; i += 1) {
    const workType = WORK_TYPES[(i - 1) % WORK_TYPES.length];
    const riskLevel = RISK_LEVELS[(i - 1) % RISK_LEVELS.length];
    const process = PROCESSES[(i - 1) % PROCESSES.length];
    const weatherType = WEATHER_TYPES[(i - 1) % WEATHER_TYPES.length];
    const sequence = String(i).padStart(4, "0");
    const shortKey = String(i).padStart(6, "0");

    rows.push({
      externalKey: `r${shortKey}`,
      title: `[SEED ${sequence}] ${workType} ${riskLevel} 안전 가이드`,
      body: [
        `${workType} 작업 시 ${riskLevel} 위험요인을 기준으로 사전 위험성 평가를 수행한다.`,
        `공정(${process})의 출입 통제선, 감시자 배치, 작업 전 도구점검을 완료한다.`,
        `기상 조건(${weatherType})에 따라 휴식 주기, 보호구 착용, 작업 중지 기준을 적용한다.`,
        `비상 시 연락체계와 대피 동선을 작업자 전원에게 재확인한다.`
      ].join(" "),
      source: "seed-generator",
      sourceUrl: null,
      workType,
      riskLevel,
      process,
      weatherType,
      effectiveDate: "2026-01-01",
      activeYn: "Y"
    });
  }
  return rows;
};

const run = async (): Promise<void> => {
  const targetArg = Number(process.argv[2] ?? "100");
  const targetCount = Number.isFinite(targetArg) && targetArg > 0 ? Math.trunc(targetArg) : 100;
  await ensureRagDocumentTable();
  const rows = createSeedRows(targetCount);
  const changed = await upsertRagDocuments(rows);
  console.log(`[SEED_RAG_DOCUMENTS] target=${targetCount}, changed=${changed}`);
};

void run()
  .catch((error) => {
    console.error("[SEED_RAG_DOCUMENTS] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
