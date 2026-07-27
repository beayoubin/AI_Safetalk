import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_042",
    title: "굴착기 작업 접촉방지 조치",
    body: [
      "굴착기 작업 전에는 작업계획서를 수립하고, 유도자와 운전자 간 신호체계를 명확히 정해야 한다.",
      "접촉 위험이 있는 장소에는 근로자 출입을 금지하거나 유도자를 배치해야 하며, 퀵커플러 잠금 상태, 후방카메라·후진경보장치, 좌석안전띠 등 안전장치의 작동 여부를 작업 전 확인해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE",
    sourceUrl:
      "https://www.kosha.or.kr/kosha/data/seriousAccident.do?mode=download&articleNo=274124&attachNo=146883",
    workType: "건설작업",
    riskLevel: null,
    process: "굴착기 접촉방지",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_043",
    title: "사출성형기 LOTO 및 방호장치 관리",
    body: [
      "정비, 금형 교체, 청소 등 사출성형기 내부 작업 시에는 전원을 완전히 차단하고 잠금장치(Lock)와 조작금지 표찰(Tag)을 부착하는 잠금표시(LOTO) 절차를 이행해야 하며, 전원 제어 키는 작업자가 직접 소지해 타인의 조작을 막아야 한다.",
      "안전문에 설치된 방호장치의 무효화기능을 제거하고, 작업 시작 전 방호장치의 정상 작동 여부를 점검해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_IM_machine",
    workType: "기계정비",
    riskLevel: null,
    process: "사출성형기 LOTO",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_044",
    title: "채광창·슬레이트 지붕 작업 안전기준",
    body: [
      "산업안전보건기준에 관한 규칙에 따라 채광창에는 견고한 구조의 덮개를 설치해야 하며, 슬레이트 등 강도가 약한 재료로 덮은 지붕에서 작업할 때는 폭 30cm 이상의 작업발판을 설치해야 한다.",
      "지붕 위 작업에서는 채광창이나 슬레이트를 직접 밟지 않도록 안전대 부착설비, 추락방지망을 사전에 설치해야 한다."
    ].join(" "),
    source: "산업안전보건기준에 관한 규칙",
    sourceUrl: "https://www.hkbs.co.kr/news/articleView.html?idxno=654362",
    workType: "고소작업",
    riskLevel: null,
    process: "지붕/채광창 안전기준",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_045",
    title: "정전기 방전 화재·폭발 예방대책",
    body: [
      "정전기 스파크로 가연성 가스·증기에 인화되려면 (1)가연성 가스·증기가 폭발한계 내에 있을 것, (2)정전기 스파크 에너지가 최소착화에너지 이상일 것, (3)방전할 수 있는 충분한 전위차가 있을 것의 3가지 조건이 동시에 충족되어야 한다.",
      "예방을 위해 작업장의 기계기구에 제전접지를 하고, 작업장 내 습도를 가급적 높게 유지해 정전기 축적을 줄여야 한다."
    ].join(" "),
    source: "한국화재보험협회(KFPA)",
    sourceUrl: "https://www.kfpa.or.kr/mem/pdf_file/F/162/F162_1.pdf",
    workType: "화학물질작업",
    riskLevel: null,
    process: "정전기 방전 예방",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_046",
    title: "소음성난청 업무상질병 인정기준",
    body: [
      "85dB 이상의 연속음에 3년 이상 노출되어 한쪽 귀의 청력손실이 40dB 이상인 감각신경성 난청은 업무상질병으로 인정된다.",
      "소음 노출이 많은 작업장은 정기적으로 작업환경측정을 실시하고, 근로자에게 방음보호구(귀마개·귀덮개)를 지급·착용시켜야 한다."
    ].join(" "),
    source: "산업재해보상보험법 시행령(업무상질병 인정기준)",
    sourceUrl: "https://thefirstlawfirm.com/noise-induced/",
    workType: "일반작업",
    riskLevel: null,
    process: "소음성난청 예방",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_047",
    title: "용접작업 보건관리지침 (KOSHA GUIDE H-73)",
    body: [
      "고정된 용접 작업지점에는 국소배기장치를 설치하되, 후드는 작업구역을 감싸는 부스형으로 설치하고 국소배기로 포집되지 않는 용접흄은 전체환기설비로 희석해야 한다. 이동식 용접 작업지점에는 이동식 집진장치나 이동식 환기팬을 사용해야 한다.",
      "작업자에게는 흄 방진마스크나 송기마스크를 지급·착용시키고, 망간 또는 크롬산염·카드뮴이 1% 이상 함유된 용접재료를 취급하는 근로자는 연 1회 이상 특수건강진단을 받아야 한다."
    ].join(" "),
    source: "KOSHA GUIDE H-73-2015",
    sourceUrl: "https://m.kosha.or.kr/resources/1111.pdf",
    workType: "화기작업",
    riskLevel: null,
    process: "용접흄 보건관리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_048",
    title: "밀폐공간 작업 프로그램 수립·시행 (안전보건규칙 제619조)",
    body: [
      "사업주는 밀폐공간에서 작업하도록 하는 경우 밀폐공간 작업 프로그램을 수립·시행해야 하며, 여기에는 사업장 내 밀폐공간의 위치 파악, 질식·중독을 일으킬 수 있는 유해·위험 요인의 파악 및 관리방안, 사전 확인 절차가 포함되어야 한다.",
      "작업 시작 전에는 작업 일시·장소·내용, 관리감독자·근로자·감시인 정보, 산소 및 유해가스 농도 측정결과, 착용할 보호구 종류를 확인하고 작업이 종료될 때까지 출입구에 게시해야 한다."
    ].join(" "),
    source: "산업안전보건기준에 관한 규칙 제619조",
    sourceUrl: "https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1016499135",
    workType: "밀폐공간",
    riskLevel: null,
    process: "밀폐공간 작업 프로그램",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_049",
    title: "지게차 헤드가드 및 방호장치 안전기준",
    body: [
      "지게차 헤드가드는 최대하중의 2배에 해당하는 등분포정하중(4톤 초과 시 4톤으로 한정)을 견딜 수 있어야 하고, 상부틀의 각 개구부 폭 또는 길이는 16cm 미만이어야 하며, 높이는 입식은 1,905mm 이상, 좌식은 903mm 이상이어야 한다.",
      "지게차의 주요 방호장치로는 전조등, 후미등, 헤드가드, 백레스트, 안전벨트와 함께 후진경보기가 있으며, 운행 전 이 장치들의 정상 작동 여부를 점검해야 한다."
    ].join(" "),
    source: "산업안전보건기준에 관한 규칙 제180조",
    sourceUrl:
      "https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%82%B0%EC%97%85%EC%95%88%EC%A0%84%EB%B3%B4%EA%B1%B4%EA%B8%B0%EC%A4%80%EC%97%90%EA%B4%80%ED%95%9C%EA%B7%9C%EC%B9%99/%EC%A0%9C180%EC%A1%B0",
    workType: "중량물취급",
    riskLevel: null,
    process: "지게차 헤드가드",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH5] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH5] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
