import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_030",
    title: "용접·절단작업 화재·폭발 통계",
    body: [
      "2003~2012년 중소규모 건설현장 조사에서 화재·폭발사고의 28%가 용접·절단작업 중 인근 가연물로 인해 발생했다.",
      "정상작업 중 31건, 비정상(수리·정비 등)작업 중 32건의 화재·폭발이 용접·절단 관련으로 집계되어, 작업유형을 통틀어 가장 많은 비중을 차지했다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=234905&attachNo=112902",
    workType: "화기작업",
    riskLevel: "HIGH",
    process: "용접/절단 통계",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_031",
    title: "HDPE 저장탱크 정비 중 분진 화재 (6명 사망)",
    body: [
      "고밀도폴리에틸렌(HDPE) 저장탱크(사일로) 정비 작업 중 폴리에틸렌 분진이 용접 불티에 점화되어 화재가 발생, 6명이 사망하고 11명이 부상당했다.",
      "분진이 축적되는 저장설비 내부 정비 시에는 화기작업 전 분진 제거와 불활성화(퍼지) 조치가 필수적이다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/oshri/publication/researchReportSearch.do?mode=download&articleNo=408251&attachNo=229527",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "저장탱크/사일로 정비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_032",
    title: "이동식사다리 전도 추락사고",
    body: [
      "조경작업 중 나무 가지치기 작업을 하던 근로자가 이동식사다리를 사용하다가 사다리가 전도되며 지면으로 추락했다.",
      "이동식사다리는 평탄하고 견고한 바닥에 설치하고, 작업 중 미끄러짐·전도 방지를 위해 보조자를 배치하거나 사다리를 고정해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://esafetykorea.or.kr/main/supportCenter/innerBoard?board_no=2072&board_type=repository",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "이동식사다리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_033",
    title: "크레인 와이어로프 파단 낙하사고",
    body: [
      "이동식크레인으로 철근을 운반하던 중 와이어로프가 파단되어 후크블록이 낙하, 하부 작업자를 덮쳤다.",
      "크레인 작업 전 와이어로프의 변형, 소선 절단 상태, 로프 체결부를 점검하고, 작업자 머리 위로 직접 인양하는 것을 금지해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_lift",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "크레인 와이어로프",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_034",
    title: "리프트 와이어로프 파단 추락사고",
    body: [
      "리프트로 장비를 인양하던 중 와이어로프가 끊어지면서 발판이 낙하해 하부 작업자가 사망했다.",
      "리프트 등 양중설비는 정기적인 와이어로프 점검과 교체 주기 준수가 필수적이다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_lift",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "리프트 와이어로프",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_035",
    title: "갠트리크레인 섬유로프 파단 낙하사고",
    body: [
      "갠트리크레인으로 철근다발을 상차하던 중 섬유로프가 파단되어 철근이 낙하했다.",
      "손상되거나 부식된 섬유로프는 사용 전 교체하고, 위험구역 내 근로자 접근을 제한하며 적정 각도의 결속(슬링) 방법을 사용해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_lift",
    workType: "중량물취급",
    riskLevel: "MEDIUM",
    process: "갠트리크레인/섬유로프",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_036",
    title: "냉동설비 증축공사 암모니아 누출 사망사고 (여수)",
    body: [
      "2003년 6월 21일 전남 여수의 냉동실 증축공사 현장에서 배관·샌드위치패널 작업 중 기존 냉동설비에서 암모니아가 누출되었다.",
      "기존 냉동설비와 신설 증발기 사이 차단밸브 하부 용접부가 파열되었고, 용접 결함이 원인으로 지목되었다.",
      "누출된 암모니아로 작업자 1명이 중독사하고 2명이 2~3도 화학화상을 입었다."
    ].join(" "),
    source: "KOSHA (중대산업사고속보)",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/seriousAccident.do?mode=view&articleNo=274086&article.offset=200&articleLimit=10",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "냉동설비/배관 증축",
    weatherType: null,
    effectiveDate: "2003-06-21",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_037",
    title: "탱크 내부 아르곤가스 질식 사망사고",
    body: [
      "탱크 내부 배관에 아르곤가스를 충전하며 TIG용접을 실시한 후, 퍼지된 아르곤가스 밸브를 잠그기 위해 탱크 내부 바닥으로 이동하던 작업자가 배관에서 누출된 아르곤가스에 질식해 사망했다.",
      "아르곤은 무색·무취의 불활성기체로 누출되어도 감지가 어려워 밀폐공간 내 산소를 급격히 치환할 수 있으므로, 불활성가스를 사용하는 밀폐공간 작업은 산소농도를 상시 측정해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=419454&attachNo=236658",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "탱크 내부 용접(불활성가스)",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_038",
    title: "파쇄기 이물질 제거 중 협착 메커니즘",
    body: [
      "파쇄기 투입호퍼에 걸린 이물질을 제거하는 과정에서 기계가 완전히 정지하지 않은 상태로 작업자가 신체를 투입해 회전날·플라이휠 등 회전체에 협착되는 사고가 반복적으로 발생한다.",
      "작업복이나 장갑이 회전축에 말려드는 경우도 다수 보고되어, 정비·이물질 제거 작업 전에는 반드시 전원을 차단하고 LOTO 절차를 적용해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6943",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "파쇄기/회전체",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH3] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH3] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
