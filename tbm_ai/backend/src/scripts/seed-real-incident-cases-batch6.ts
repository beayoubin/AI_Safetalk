import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_051",
    title: "노통연관식보일러 연소실 폭발사고 (KOSHA-MIA-202003)",
    body: [
      "2015년 11월 27일, 노통연관식보일러의 연소실 내 불완전연소로 추정되는 폭발이 발생해 버너부가 떨어져 나가면서 조작판넬에서 작업하던 보일러기사가 안면부에 부상을 입었다.",
      "보일러는 가동 전 연소실 내 미연소가스를 충분히 환기(퍼지)한 후 점화해야 하며, 불완전연소가 의심되면 즉시 연료 공급을 차단해야 한다."
    ].join(" "),
    source: "KOSHA-MIA-202003",
    sourceUrl:
      "https://kosha.or.kr/kosha/data/seriousAccident.do?mode=download&articleNo=424998&attachNo=240007",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "보일러 연소실",
    weatherType: null,
    effectiveDate: "2015-11-27",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_052",
    title: "의료용 압력용기 기밀시험 중 폭발 사망사고",
    body: [
      "경남 김해시의 압력용기 제조 공장에서 의료용 산소치료 기기의 기밀시험을 하던 중 압력용기가 폭발해 시험을 담당하던 50대 작업자가 사망했다.",
      "압력용기 기밀시험은 KOSHA GUIDE D-54(화학설비의 압력시험 기술지침), M-150(불활성기체를 이용한 기밀시험)에 따라 시험압력과 방호벽 등 안전조치를 갖춘 상태에서 실시해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6765",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "압력용기 기밀시험",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_053",
    title: "굴착기 후진 중 협착 사망사고",
    body: [
      "2020년 3월 7일 경기도 평택시 토목조경공사 현장에서 근로자가 식재목을 임시 이식장으로 운반한 후 이동하던 중, 진입로 바닥 정지작업을 위해 후진하는 굴착기 바퀴에 깔려 사망했다.",
      "현장에서는 접촉 위험이 있는 장소에 근로자 출입을 금지하거나 유도자를 배치하는 등의 접촉방지 조치가 이루어지지 않았던 것으로 확인되었다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.kosha.or.kr/kosha/data/seriousAccident.do?mode=download&articleNo=274124&attachNo=146883",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "굴착기 후진 작업",
    weatherType: null,
    effectiveDate: "2020-03-07",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_054",
    title: "사출성형기 금형점검 중 협착 사망사고",
    body: [
      "사출성형기 내부로 들어가 금형을 점검하던 작업자가 기계가 재작동하면서 상체가 금형 사이에 끼여 사망하는 사고가 발생했다.",
      "제품취출을 위해 금형 사이에 손을 넣다 끼이거나, 금형 점검 중 후진하는 이젝터와 금형 사이에 신체가 끼이는 유형이 반복되므로, 내부 점검·정비 시에는 반드시 전원을 차단하고 잠금표시(LOTO) 절차를 시행해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=603",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "사출성형기 금형점검",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_055",
    title: "공장 지붕 보수공사 중 채광창 파손 추락사고",
    body: [
      "공장 지붕 보수공사 중 작업자가 지붕 위 채광창을 밟았다가 채광창이 갑자기 파손되면서 아래로 추락하는 사고가 발생했다.",
      "산업안전보건기준에 관한 규칙에 따라 채광창에는 견고한 구조의 덮개를 설치해야 하고, 슬레이트 등 강도가 약한 재료로 덮은 지붕에서는 폭 30cm 이상의 작업발판을 설치해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://www.hkbs.co.kr/news/articleView.html?idxno=654362",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "지붕/채광창 작업",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_056",
    title: "축사 태양광 설비 설치공사 중 채광창 추락사망사고",
    body: [
      "축사 지붕에 태양광 발전시설을 설치하는 공사 중 40대 작업자가 지붕 채광창을 딛다가 파손되어 아래로 추락해 사망했다.",
      "태양광·지붕 공사는 채광창·슬레이트 등 강도가 약한 지붕재 위를 직접 밟지 않도록 안전대 부착설비와 추락방지망을 사전에 설치하고 작업발판을 확보해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=5148",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "태양광 설비/지붕 작업",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "me_real_004",
    title: "과산화수소 정제공정 폭발사고 (2021년 원인조사)",
    body: [
      "화학물질안전원이 2021년 원인조사를 실시한 주요 화학사고 중 하나로, 과산화수소 정제공정에서 폭발사고가 발생했다.",
      "화학물질안전원은 시설조사, 정밀분석, 재현실험(시뮬레이션) 등 과학적 조사기법으로 근본원인을 규명해 유사시설의 사고예방대책 수립에 활용하도록 사례집으로 배포했다."
    ].join(" "),
    source: "화학물질안전원(2021년 화학사고 원인조사 사례집)",
    sourceUrl: "https://safety-as.com/bbs/board.php?bo_table=dataroom&wr_id=120",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "과산화수소 정제공정",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "me_real_005",
    title: "광개시제 제조공정 폭발·화재사고 (2021년 원인조사)",
    body: [
      "화학물질안전원이 2021년 원인조사를 실시한 주요 화학사고 중 하나로, 광개시제 제조공정에서 폭발·화재사고가 발생했다.",
      "제조공정 중 반응 조건 이탈이나 미반응 물질 축적은 폭주반응으로 이어질 수 있어, 온도·압력 등 공정변수를 상시 모니터링하고 이상 시 비상정지 절차를 갖춰야 한다."
    ].join(" "),
    source: "화학물질안전원(2021년 화학사고 원인조사 사례집)",
    sourceUrl: "https://safety-as.com/bbs/board.php?bo_table=dataroom&wr_id=120",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "광개시제 제조공정",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "me_real_006",
    title: "아산화질소 제조 반응기 폭발사고 (2021년 원인조사)",
    body: [
      "화학물질안전원이 2021년 원인조사를 실시한 주요 화학사고 중 하나로, 아산화질소 제조 반응기에서 폭발사고가 발생했다.",
      "반응기 폭발사고 예방을 위해서는 반응기 압력·온도의 이상 상승을 감지하는 인터록과 비상방출설비(안전밸브·파열판)를 갖추고 정기적으로 작동 상태를 점검해야 한다."
    ].join(" "),
    source: "화학물질안전원(2021년 화학사고 원인조사 사례집)",
    sourceUrl: "https://safety-as.com/bbs/board.php?bo_table=dataroom&wr_id=120",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "아산화질소 제조 반응기",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "me_real_007",
    title: "염산 저장탱크 누출사고 (2021년 원인조사)",
    body: [
      "화학물질안전원이 2021년 원인조사를 실시한 주요 화학사고 중 하나로, 염산 저장탱크에서 누출사고가 발생했다.",
      "부식성이 강한 염산을 저장하는 탱크는 재질 부식과 배관 이음부 손상 여부를 정기적으로 점검하고, 누출 시 확산을 막을 방류벽과 중화 설비를 갖춰야 한다."
    ].join(" "),
    source: "화학물질안전원(2021년 화학사고 원인조사 사례집)",
    sourceUrl: "https://safety-as.com/bbs/board.php?bo_table=dataroom&wr_id=120",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "염산 저장탱크",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH6] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH6] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
