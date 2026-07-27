import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_039",
    title: "플랜지볼트 핸드그라인더 절단 중 화재사고 (KOSHA-MIA-202110)",
    body: [
      "플랜지 볼트를 핸드그라인더로 절단하는 작업 중 화재가 발생했다.",
      "그라인더 작업 시 발생하는 불티가 주변 가연물에 옮겨붙지 않도록 작업 전 주변 인화물을 제거하고 방염포로 차폐해야 한다."
    ].join(" "),
    source: "KOSHA-MIA-202110",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=419455&attachNo=236665",
    workType: "화기작업",
    riskLevel: "MEDIUM",
    process: "그라인더 절단",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_040",
    title: "LPG 용접호스 손상 미점검 화재사고",
    body: [
      "용접토치의 열로 LPG 공급호스가 손상되어 구멍이 났으나, 이를 점검하지 않은 채 가연성가스를 사용하는 작업을 시작해 화재가 발생했다.",
      "LPG는 공기보다 1.5~2.0배 무거워 누출 시 바닥에 체류하며, 공기 중 농도 2.0~9.5%에서 폭발 위험이 있어 작업 전 호스·이음부의 누출 여부를 반드시 확인해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/confirmation_e.do?mode=download&articleNo=343332&attachNo=190101",
    workType: "화기작업",
    riskLevel: "HIGH",
    process: "LPG 용접/용단",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_041",
    title: "도장기 텐션롤러 협착사고",
    body: [
      "원단을 이송하는 도장기 텐션롤러 사이에 원단이 말리거나 접혀, 이를 바로잡으려던 작업자의 손이 롤러 사이에 협착되는 사고가 발생했다.",
      "롤러 표면의 이물질이나 꼬임을 제거할 때는 반드시 기계를 정지시킨 후 작업해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_roller",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "롤러기/텐션롤러",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_042",
    title: "냉간압연기 정비 중 동료 오조작 협착사고",
    body: [
      "냉간압연기 정비작업이 진행 중인 상태에서 다른 작업자가 상황을 모른 채 기계를 재가동시켜, 정비 중이던 작업자의 손이 롤러 사이로 말려들어가는 사고가 발생했다.",
      "정비·점검 작업 시에는 전원을 차단하고 잠금장치(LOTO)를 실시해 다른 작업자의 임의 재가동을 원천적으로 차단해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_roller",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "냉간압연기 정비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH4] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH4] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
