import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_031",
    title: "LPG 용접·용단 화재폭발 예방대책",
    body: [
      "LPG(액화석유가스)는 공기보다 1.5~2.0배 무거워 누출 시 바닥 낮은 곳에 체류하며, 공기 중 농도 2.0~9.5% 범위에서 폭발할 수 있다.",
      "가연성가스를 금속 용접·절단·가열 작업에 사용할 때는 작업 전 호스나 배관 이음부의 누출 여부를 확인하고, 작업을 중단할 때는 가스공급밸브를 잠그고 호스를 분리해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/confirmation_e.do?mode=download&articleNo=343332&attachNo=190101",
    workType: "화기작업",
    riskLevel: null,
    process: "LPG 화재예방",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_032",
    title: "지게차 재해 통계 및 위험요인",
    body: [
      "최근 2년간(2021~2022년) 지게차 관련 산업재해자는 총 2,559명으로, 2021년 1,396명, 2022년 1,163명이 발생했다.",
      "지게차 위험요인은 운전 중 충돌·깔림, 지게차 전도로 인한 작업자 압사, 운반화물의 전도·낙하, 포크에서 작업자 추락 등이 있다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=4768",
    workType: "중량물취급",
    riskLevel: null,
    process: "지게차 통계",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_033",
    title: "지게차 작업계획서 작성 의무",
    body: [
      "지게차로 하역·운반 작업을 할 때는 낙하, 비래, 전도, 협착, 붕괴 등 위험을 예방하기 위한 대책을 사전에 수립해야 한다.",
      "작업계획서에는 지게차별 운행경로와 작업방법을 포함해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.kosha.or.kr/kosha/intro/easternGyeonggiBranch_A.do?mode=download&articleNo=367328&attachNo=203284",
    workType: "중량물취급",
    riskLevel: null,
    process: "지게차 작업계획서",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_034",
    title: "롤러기 정비 안전수칙",
    body: [
      "롤러 표면에 낀 이물질이나 원단 꼬임을 제거할 때는 반드시 기계를 정지시킨 후 작업해야 한다.",
      "정비·점검 작업 시에는 전원을 차단하고 잠금스위치(LOTO)를 실시해 다른 근로자가 임의로 기계를 재가동하지 못하도록 해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_roller",
    workType: "기계정비",
    riskLevel: null,
    process: "롤러기 정비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_035",
    title: "안전작업허가서(PTW) 제도",
    body: [
      "안전작업허가 제도는 사업장 내 작업 중 중대재해나 중대산업사고로 이어질 수 있는 유해·위험 작업에 대해 체계화된 절차를 수립·시행하는 제도다.",
      "작업 신청자가 허가서 양식이나 전자문서로 신청하면, 작업대상 지역의 운전부서 담당자가 현장을 확인한 후 허가서를 발급한다. 다른 작업이 병행되는 경우 사전 확인 여부를 함께 검토해야 한다."
    ].join(" "),
    source: "KOSHA(안전작업허가지침)",
    sourceUrl:
      "https://musa-lab.com/superboard/lib/download.php?wm_table=policy&wm_bid=680&wm_num=0",
    workType: "일반작업",
    riskLevel: null,
    process: "안전작업허가(PTW)",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH3] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH3] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
