import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_061",
    title: "항타기 지반침하 전도사고",
    body: [
      "지하저수조 기초 PHC파일 항타를 위해 가설도로에서 항타기를 이동하던 중, 장마철 강우 등으로 연약화가 진행된 지반이 침하되면서 항타기가 넘어져 인근에서 작업 중이던 이동식크레인과 충돌했다.",
      "항타기는 66% 이상이 운영 중, 33% 이상이 설치·해체 중 사고가 발생하며 리더 높이를 등록사항보다 높게 설치하거나 지반이 연약한 경우 전도 위험이 커지므로, 이동 전 지반 상태와 하부 철판의 적정성을 반드시 확인해야 한다."
    ].join(" "),
    source: "안전소장 곽두협(항타기 사고사례 모음)",
    sourceUrl:
      "https://windori.com/entry/%ED%95%AD%ED%83%80%EA%B8%B0-%EB%B0%8F-%ED%95%AD%EB%B0%9C%EA%B8%B0-%EC%82%AC%EA%B3%A0-%EC%82%AC%EB%A1%80-%EB%AA%A8%EC%9D%8C",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "항타기 이동/전도",
    weatherType: "우천",
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_062",
    title: "항타기 전도방지 철판 협착 사망사고",
    body: [
      "파일항타공이 항타기 전도방지용 철판에 연결된 훅을 제거하기 위해 대기하던 중, 지면에 내려놓으려던 철판에 협착되어 사망했다.",
      "전도방지 철판을 내리거나 옮기는 작업 시에는 작업자가 철판의 낙하·이동 경로 밖에서 대기하도록 하고, 신호수와 운전원 간 신호를 명확히 정해야 한다."
    ].join(" "),
    source: "안전소장 곽두협(항타기 사고사례 모음)",
    sourceUrl:
      "https://windori.com/entry/%ED%95%AD%ED%83%80%EA%B8%B0-%EB%B0%8F-%ED%95%AD%EB%B0%9C%EA%B8%B0-%EC%82%AC%EA%B3%A0-%EC%82%AC%EB%A1%80-%EB%AA%A8%EC%9D%8C",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "항타기 전도방지 철판",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_063",
    title: "콘크리트펌프카 지지대 전도 사망사고",
    body: [
      "경기 구리시 신축공사 현장에서 콘크리트 펌프카의 지지대(아웃트리거)가 쓰러지면서 근로자를 덮쳐, 안전모를 착용했음에도 무거운 배관에 머리를 맞아 사망했다.",
      "아파트 주차장 콘크리트 타설 작업 등에서는 아웃트리거 하부 지반의 침하로 펌프카가 기울어지며 붐대가 불시 하강할 수 있으므로, 연약지반에는 반드시 지반 침하 방지용 받침판을 설치해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=1298",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "콘크리트펌프카 타설",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_064",
    title: "콘크리트펌프카 붐대 지지대 불량 사망사고",
    body: [
      "2025년 4월 제주 공사 현장에서 콘크리트 펌프카 차량 지지대의 불량으로 붐대가 쓰러지면서, 리모컨으로 펌프카를 운용하던 50대 운전자가 사망했다.",
      "최근 5년간 펌프카 사고는 17건(전도 12건, 붐대 파단 5건)이 발생해 5명이 사망했으며, 작업 전 지지대와 붐대의 결함 여부를 반드시 점검해야 한다."
    ].join(" "),
    source: "세계일보",
    sourceUrl: "https://www.segye.com/newsView/20250417513070",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "콘크리트펌프카 붐대",
    weatherType: null,
    effectiveDate: "2025-04-17",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_065",
    title: "스크류컨베이어 원료투입 중 협착사고",
    body: [
      "작업자가 보조 수공구를 사용하지 않고 손으로 직접 원재료를 밀어 넣다가 오른손이 원료와 함께 스크류컨베이어 안으로 딸려 들어가는 협착사고가 발생했다.",
      "회전 날개에 의한 끼임 위험이 가장 큰 설비이므로 원료 투입 시에는 반드시 보조 수공구를 사용하고, 정비·보수나 급유 작업 시에는 다른 근로자의 오조작을 막기 위해 전원을 차단하고 잠금표시(LOTO)를 실시해야 한다."
    ].join(" "),
    source: "비즈중앙",
    sourceUrl: "https://www.bizjoongang.co.kr/news/articleView.html?idxno=53208",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "스크류컨베이어 원료투입",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_066",
    title: "고온물질 접촉 화상 사고 (KOSHA-MIA-202016)",
    body: [
      "고온의 물질(용융물 또는 고온설비 표면)에 신체가 접촉해 화상을 입는 사고가 발생했다.",
      "고온설비 주변에서 작업할 때는 방열복·방열장갑 등 개인보호구를 착용하고, 고온배관·용기에는 단열재나 접촉방지 커버를 설치해 비의도적 접촉을 차단해야 한다."
    ].join(" "),
    source: "KOSHA-MIA-202016",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/seriousAccident.do?mode=download&articleNo=425010&attachNo=240019",
    workType: "기계정비",
    riskLevel: "MEDIUM",
    process: "고온물질 접촉",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_067",
    title: "폐기물 탱크로리 이송작업 중 폭발사고 (KOSHA-MIA-202021)",
    body: [
      "폐기물을 탱크로리로 이송하는 작업 중 폭발사고가 발생했다.",
      "인화성·가연성 폐기물을 이송할 때는 정전기 축적을 막기 위해 접지·본딩을 실시하고, 이송 전 배관 내 잔류가스나 이종물질 혼입 여부를 확인해야 한다."
    ].join(" "),
    source: "KOSHA-MIA-202021",
    sourceUrl:
      "https://kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=418295&attachNo=235704",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "폐기물 탱크로리 이송",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH8] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH8] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
