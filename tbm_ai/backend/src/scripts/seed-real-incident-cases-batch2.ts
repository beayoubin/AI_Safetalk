import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  // 화기작업 (+2)
  {
    externalKey: "kosha_real_011",
    title: "빈 드럼통 절단 작업 중 폭발 사고",
    body: [
      "방수제로 쓰인 인화성 액체를 담았던 빈 드럼통을 절단하는 작업 중 폭발이 발생해 작업자가 사망했다.",
      "드럼 내부에 잔류한 인화성 물질을 완전히 제거하지 않은 상태에서 절단 작업을 진행한 것이 원인으로 지목됐다.",
      "화기작업 전 용기·배관 내부 잔류물질 제거와 가스농도 측정이 반드시 선행되어야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://portal.kosha.or.kr/archive/disaster-case/disaster-collec/accident-collec",
    workType: "화기작업",
    riskLevel: "HIGH",
    process: "용기/배관 절단",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_012",
    title: "드럼 내부 잔류 인화성 증기 절단토치 점화 화재",
    body: [
      "드럼 내부에 남아있던 인화성 증기가 절단 작업 중 토치 불꽃에 점화되어 화재가 발생했다.",
      "드럼 내부 잔류 인화물질을 완전히 제거하지 않은 상태에서 화기작업을 진행한 것이 직접 원인이다.",
      "밀폐 용기의 화기작업 전에는 세정·환기 후 가스농도를 측정해 안전 기준 이내임을 확인해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://portal.kosha.or.kr/archive/disaster-case/disaster-collec/accident-collec",
    workType: "화기작업",
    riskLevel: "HIGH",
    process: "용기 절단/용접",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 밀폐공간 (+3)
  {
    externalKey: "kosha_real_013",
    title: "임신돈사 슬러리피트 내부 황화수소 중독 사고",
    body: [
      "임신돈사 슬러리 피트 내부 보도블록 파쇄 작업 중 황화수소에 중독되어 작업자 2명이 사망하고 1명이 부상당했다.",
      "축산분뇨 저장시설 등 유기물 부패가 진행되는 밀폐공간은 황화수소·메탄 등 유해가스가 축적되기 쉬워 진입 전 반드시 가스농도를 측정해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://portal.kosha.or.kr/archive/disaster-case/accident-case",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "슬러리피트/축산시설",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_014",
    title: "정제탱크 내부 메탄올 화재 및 산소부족 사망사고",
    body: [
      "정제탱크 내부의 메탄올 증기가 전기스파크에 점화되어 화재가 발생했고, 탱크 내부에서 작업 중이던 작업자가 화상과 산소부족으로 사망했다.",
      "인화성 물질을 저장했던 탱크 내부 작업 시에는 방폭 전기기기 사용, 충분한 환기, 산소농도 측정이 필수다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://portal.kosha.or.kr/archive/disaster-case/accident-case",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "저장탱크 내부",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_015",
    title: "탱크 내부 세척 작업 중 폭발 사고 (KOSHA-MIA-전북-2106)",
    body: [
      "저장탱크 내부 세척 작업 중 잔류 인화성 증기가 폭발해 작업자가 부상당했다.",
      "탱크류 내부 세척·정비 작업 전에는 잔류물 배출, 불활성화(퍼지), 가스농도 측정 등 밀폐공간 출입 절차를 준수해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/intro/jeonbukBranch_B.do?mode=download&articleNo=425584&attachNo=240547",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "저장탱크 세척",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 고소작업 (+3)
  {
    externalKey: "kosha_real_016",
    title: "비계 해체 작업 중 무너짐 재해",
    body: [
      "건설현장에서 비계 해체 작업 중 비계 전체가 무너지며 작업자가 추락·매몰되는 재해가 발생했다.",
      "비계 해체는 조립의 역순으로 진행하고, 해체 순서에 따라 구조 안정성을 계속 확인하며 작업구역 출입을 통제해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.kosha.or.kr/ebook/fcatalog/include/practice_detail.jsp?ccate=0205120000&sdir=436",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "비계 가설/해체",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_017",
    title: "달비계 작업대 로프 파단 추락사고",
    body: [
      "건물 외벽 작업 중 달비계 작업대를 지탱하던 로프가 파단되며 작업자가 추락했다.",
      "달비계 작업 전 로프·고정장치의 손상 여부를 점검하고, 안전대를 별도의 생명줄에 걸어 이중 방호를 갖춰야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.kosha.or.kr/ebook/fcatalog/include/practice_detail.jsp?ccate=0205120000&sdir=436",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "달비계 외벽작업",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_018",
    title: "철골 기둥 승강용 트랩 추락사고",
    body: [
      "철골 구조물의 기둥에 설치된 승강용 트랩을 이용해 오르내리던 중 작업자가 추락했다.",
      "철골 승강 설비 이용 시에도 안전대를 상시 체결하고, 트랩 및 발판 상태를 사전에 점검해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.kosha.or.kr/ebook/fcatalog/include/practice_detail.jsp?ccate=0205120000&sdir=436",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "철골 구조물",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 전기작업 (+1)
  {
    externalKey: "kosha_real_019",
    title: "제조공장 전기판넬 점검 중 감전 사망사고",
    body: [
      "제조공장에서 전기판넬(배전반) 점검 작업 중 작업자가 감전되어 사망했다.",
      "전기판넬 점검·정비 작업은 반드시 정전 후 검전기로 무전압 상태를 확인하고 잠금·표지(LOTO)를 실시한 뒤 진행해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.seumedu.kr/data/safe/%EC%A0%9C%EC%A1%B0%EA%B3%B5%EC%9E%A5%20%EC%A0%84%EA%B8%B0%ED%8C%90%EB%84%AC%20%EC%A0%90%EA%B2%80%20%EC%A4%91%20%EA%B0%90%EC%A0%84%EC%82%AC%EA%B3%A0.pdf",
    workType: "전기작업",
    riskLevel: "HIGH",
    process: "배전반/전기판넬",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 중량물취급 (+2)
  {
    externalKey: "kosha_real_020",
    title: "코일 전도 사고로 인한 중량물 취급 사망사고",
    body: [
      "제조업 현장에서 적재된 코일이 전도되며 인근 작업자가 깔려 사망하는 사고가 반복적으로 발생하고 있다.",
      "코일·철판 등 중량물을 고정할 클램프, 지지대, 받침목 등 전도방지 설비를 반드시 갖추고 작업계획서에 따라 작업해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6505",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "코일/철판 적재",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_021",
    title: "지게차 오조작으로 인한 프레스 협착 사망사고",
    body: [
      "200톤 유압프레스 금형 교체 작업 중 지게차 운전자의 오조작으로 지게차가 갑자기 급전진하면서 작업자가 프레스와 지게차 사이에 끼여 사망했다.",
      "지게차와 인력 작업이 동시에 이뤄지는 구간은 신호수를 배치하고, 작업 전 운전자와 작업자 간 신호체계를 명확히 확인해야 한다."
    ].join(" "),
    source: "고용노동부",
    sourceUrl: "https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=5085",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "지게차/금형교체",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 굴착작업 (+1)
  {
    externalKey: "kosha_real_022",
    title: "굴착공사 중 건설기계 끼임 및 토사 무너짐 재해",
    body: [
      "지반 굴착공사에서는 굴착기·항타기·덤프트럭 등 차량계 건설기계에 의한 끼임 재해와, 흙막이 지보공 설치 과정에서의 토사 무너짐 재해가 주로 발생한다.",
      "건설기계 작업반경 내 근로자 출입을 통제하고, 굴착면 기울기와 흙막이 지보공 상태를 매일 점검해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://portal.kosha.or.kr/archive/disaster-case/accident-case/acccase-industry/construc-industry",
    workType: "굴착작업",
    riskLevel: "HIGH",
    process: "지반굴착/흙막이",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 화학물질작업 (+2)
  {
    externalKey: "kosha_real_023",
    title: "황산 배관 과압 파열 누출사고",
    body: [
      "화학공정 설비에서 황산 이송배관이 과압으로 파열되며 황산이 누출되는 사고가 발생했다.",
      "부식성·유해화학물질 배관은 정기적인 압력 점검과 노후 배관 교체가 필요하며, 누출 시 즉시 인근 통제 및 중화 조치를 취해야 한다."
    ].join(" "),
    source: "화학물질안전원",
    sourceUrl: "https://icis.me.go.kr/search/searchType2.do",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "산 이송배관",
    weatherType: null,
    effectiveDate: "2022-01-01",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_024",
    title: "불산 등 강산 누출사고 반복 발생",
    body: [
      "국내 화학공단에서 불산을 비롯한 강산 누출사고가 연이어 발생해 인근 지역 피해가 보고된 바 있다.",
      "강산·불산 등 고위험 화학물질 취급 시설은 이중 배관, 누출감지센서, 방재장비를 갖추고 정기적인 누출 점검을 실시해야 한다."
    ].join(" "),
    source: "화학물질안전원",
    sourceUrl: "https://icis.me.go.kr/search/searchType2.do",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "불산/강산 취급",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 기계정비 (+3)
  {
    externalKey: "kosha_real_025",
    title: "프레스 배출장치 점검 중 협착 사망사고",
    body: [
      "프레스 배출장치 오류를 확인하던 작업자가 하형 다이 센서에 몸이 감지되며 하강한 금형 사이에 머리가 협착되어 사망했다.",
      "프레스 점검·정비 작업 시에는 반드시 전원을 차단하고 안전블록을 설치한 뒤 금형 사이에 신체를 진입시켜야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://oshri.kosha.or.kr/kosha/data/machine.do?mode=view&articleNo=268451",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "프레스 설비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_026",
    title: "프레스 배출 컨베이어 이물질 제거 중 협착 사망사고",
    body: [
      "프레스 배출 컨베이어에 걸린 제품을 공구로 제거하던 중, 동료가 풋스위치를 잘못 밟아 상하형 다이 사이에 머리가 협착되어 사망했다.",
      "제품 이물질 제거 등 프레스 근접 작업 시에는 반드시 기계를 정지하고 잠금·표지(LOTO)를 실시해 타인의 오조작을 원천 차단해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_press",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "프레스 컨베이어",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_027",
    title: "자동화 라인 점검 중 이송로봇 협착 사망사고",
    body: [
      "자동화 생산라인이 정지되어 수동 풋스위치로 점검하던 중, 정지해 있던 이송로봇이 갑자기 작동하며 로봇암과 자동공급장치 사이에 작업자가 협착되어 사망했다.",
      "자동화 설비 점검 시에는 전원을 완전히 차단하고 로봇의 예기치 못한 재작동을 방지하는 잠금장치를 반드시 적용해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_press",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "자동화 이송로봇",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 배관작업 (+1)
  {
    externalKey: "kosha_real_028",
    title: "고온물질 접촉 화상 사고 (KOSHA-MIA-202016)",
    body: [
      "배관 설비에서 유출된 고온물질에 접촉해 작업자가 화상을 입는 사고가 발생했다.",
      "고온 배관·설비 작업 시에는 방열복 등 내열 보호구를 착용하고, 작업 전 설비 온도와 압력을 낮춰 안전 상태를 확인해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/seriousAccident.do?mode=download&articleNo=425010&attachNo=240019",
    workType: "배관작업",
    riskLevel: "MEDIUM",
    process: "고온배관 설비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 일반작업 (+1)
  {
    externalKey: "moel_real_029",
    title: "2024 중대재해 사이렌 - 계절별 위험요인 및 예방수칙",
    body: [
      "고용노동부가 발간한 2024 중대재해 사이렌 책자에는 한 해 동안 발생한 중대재해 사고사례 500여 건이 건설·제조·기타 업종으로 나뉘어 수록되어 있다.",
      "해빙기, 폭염기 등 계절·시기별로 반복되는 위험요인과 예방수칙이 함께 정리되어 있어, 작업 시기에 맞는 안전수칙을 TBM에 반영하는 것이 권장된다."
    ].join(" "),
    source: "고용노동부",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6780",
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
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH2] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH2] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
