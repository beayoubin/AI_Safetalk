import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_001",
    title: "폐유기용제 중화조 화재·폭발 사고 (KOSHA-MIA-201702)",
    body: [
      "폐유기용제 중화조에서 수산화칼슘을 이용한 중화 작업 중 화재·폭발이 발생하여 증류공정, 창고, 사무실이 피해를 입고 작업자 3명이 중화상을 입었다.",
      "인화성 물질을 취급하는 공정에서 화기 작업을 할 때는 사전 가스농도 측정, 발화원 제거, 화기작업 허가 절차 준수가 필요하다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=235083&attachNo=113083",
    workType: "화기작업",
    riskLevel: "HIGH",
    process: "증류공정/저장탱크",
    weatherType: null,
    effectiveDate: "2002-03-26",
    activeYn: "Y"
  },
  {
    externalKey: "moel_real_002",
    title: "밀폐공간(맨홀) 질식 반복 사망사고",
    body: [
      "최근 10년(2014~2023년) 밀폐공간 질식재해는 174건 발생해 338명의 재해자 중 136명이 사망했으며, 이는 다른 사고성 재해 사망률의 약 41배에 달한다.",
      "김해시 맨홀 작업 중 질식사(2023년 5월, 9월), 창원시 하수처리장 청소 중 질식사(2024년 12월) 등 유사 사고가 반복되고 있다.",
      "사망사고의 86%가 작업 전 산소·유해가스 농도 미측정에서 비롯되며, 사전 위험성평가, 농도 측정, 충분한 환기가 핵심 예방수칙이다."
    ].join(" "),
    source: "고용노동부",
    sourceUrl: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=16585",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "맨홀/하수처리시설",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_003",
    title: "고소작업차 붐 파손 추락 사망사고",
    body: [
      "건물 외벽 도장 작업 중 고소작업차 작업대(높이 약 28m)를 벽에서 이격시키는 과정에서 차체 프레임이 작업하중을 견디지 못하고 붐이 전도되어 탑승자 2명이 지상으로 추락, 1명이 사망하고 1명이 부상당했다.",
      "고소작업차 사용 시 작업대와 분리되지 않는 견고한 구조물에 안전대 부착설비(구명줄)를 설치하고 반드시 안전대를 걸고 작업해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://kosha.or.kr/kosha/data/regionalCase.do?mode=download&articleNo=445240&attachNo=250811",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "고소작업차/외벽",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_004",
    title: "진공교반기 세척 중 고압세척기 감전 사망사고",
    body: [
      "진공교반기 세척 작업 중 손상된 고압세척기 노즐 부위에 접촉하여 감전 사망한 사고가 발생했다.",
      "50V 이상 전기기기의 설치·분해·점검 작업 시에는 작업계획서를 작성하고 절연 보호구를 착용해야 하며, 손상이 확인된 전기기기·배선은 즉시 사용을 중지해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.safety.or.kr/safety/cmmn/file/fileDown.do?atchFileId=e466dd4658b54a91aad2ed4baeb32c14&fileSn=1",
    workType: "전기작업",
    riskLevel: "HIGH",
    process: "회전설비/교반기",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_005",
    title: "크레인 중량물 운반 중 적재대 전도 협착사고",
    body: [
      "크레인으로 배관용 파이프 등 중량물을 운반하던 중 원자재 적재대가 전도되면서 근로자가 협착되는 사고가 발생했다.",
      "클램프·지지대·록킹장치 등 중량물 고정설비가 충분히 갖춰지지 않은 상태에서 작업이 진행된 것이 주요 원인으로 지목되며, 작업 전 작업계획서 작성과 고정설비 점검이 필요하다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://portal.kosha.or.kr/archive/disaster-case/accident-case",
    workType: "중량물취급",
    riskLevel: "MEDIUM",
    process: "크레인/자재야드",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_006",
    title: "오수관로 매설 굴착작업 중 토사붕괴 매몰사고",
    body: [
      "오수관로 매설 작업 중 굴착면 주변의 토사가 무너지면서 작업자가 매몰되어 사망한 사고가 발생했다.",
      "지반 특성에 맞는 굴착면 기울기(구배) 미준수가 원인으로 지목되었으며, 굴착작업 전 지반 조사와 흙막이 지보공 설치, 붕괴 위험구간 출입통제가 필요하다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/government_office.do?mode=download&articleNo=409851&attachNo=230798",
    workType: "굴착작업",
    riskLevel: "HIGH",
    process: "지하매설배관/굴착현장",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "me_real_007",
    title: "유해화학물질(암모니아 등) 누출사고 발생 현황",
    body: [
      "화학물질안전원 통계에 따르면 2014년부터 전국에서 다수의 화학사고가 신고·집계되고 있으며, 암모니아 등 유해화학물질 누출사고가 반복적으로 보고되고 있다.",
      "밸브·배관 점검 소홀이 누출사고의 주요 원인 중 하나로 지목되며, 정기적인 밸브 조작·점검과 누출 감지 체계 구축, 취급 매뉴얼 준수가 필요하다."
    ].join(" "),
    source: "화학물질안전원",
    sourceUrl: "https://icis.me.go.kr/search/searchType2.do",
    workType: "화학물질작업",
    riskLevel: "MEDIUM",
    process: "화학물질 저장/이송설비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_008",
    title: "건설기계 정비·작업 중 협착(끼임) 사고사례",
    body: [
      "건설기계 정비·점검 및 작업 중 불도저 바퀴, 그레이더, 콘크리트믹서트럭과 펌프카 사이 등에 끼여 발생한 협착 사고 사례가 다수 보고되었다.",
      "정비 작업 전 기계 정지 및 LOTO(잠금·표지부착) 조치, 신호수 배치, 회전체 주변 접근 통제가 필요하다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://kosha.or.kr/ebook/fcatalog/include/practice_detail.jsp?ccate=02051B0000&cimg=&sdir=451",
    workType: "기계정비",
    riskLevel: "MEDIUM",
    process: "건설기계/회전체",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_009",
    title: "배관절단 작업 중 화상 사고사례 (KOSHA-MIA-202015)",
    body: [
      "부산물탱크에 신설 배관을 설치하기 위해 기존 배관을 그라인더로 절단하던 중 배관 내 잔류 유해물질이 누출되며 폭발이 발생하여 작업자 2명이 화상을 입었다.",
      "배관 절단 등 화기작업 전에는 잔류물질 배출과 가스농도 측정, 화기작업 허가 절차 준수가 반드시 필요하다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=419454&attachNo=236658",
    workType: "배관작업",
    riskLevel: "MEDIUM",
    process: "배관/부산물탱크",
    weatherType: null,
    effectiveDate: "2020-01-01",
    activeYn: "Y"
  },
  {
    externalKey: "moel_real_010",
    title: "중대재해 사이렌 - 연간 사고사례 공유 현황",
    body: [
      "고용노동부는 2023년부터 '중대재해 사이렌'을 통해 중대재해 발생 시 사고 개요·원인·유사 사례·예방조치를 지역·업종별 채널로 실시간 공유하고 있으며, 2024년 한 해 500건의 사고사례가 전파되었다.",
      "TBM 진행 시 최신 유사 사고사례를 반영하는 것이 재발 방지에 효과적이므로, 작업 직전 최근 사고 동향을 확인하는 절차를 권장한다."
    ].join(" "),
    source: "고용노동부",
    sourceUrl: "https://labor.moel.go.kr/sasttc/cmmt/bbs_srn_list.do?seCdVal=B1",
    workType: "일반작업",
    riskLevel: null,
    process: null,
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(`[SEED_REAL_INCIDENT_CASES] inserted/updated=${changed}, total=${REAL_CASES.length}`);
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
