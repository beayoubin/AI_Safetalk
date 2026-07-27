import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_084",
    title: "낙하물방지망 인양고리 이탈 추락사고",
    body: [
      "신축아파트 3층에 설치된 낙하물방지망을 수정하기 위해 4층 실외기실 난간턱에서 작업하던 근로자가, 타워크레인에 체결했던 낙하물방지망의 인양고리가 빠지면서 방지망과 함께 약 9m 아래로 추락해 사망했다.",
      "인양물에 고리를 체결할 때는 체결 상태를 재확인하고, 고리가 빠질 경우를 대비해 작업자는 낙하물방지망에 의존하지 않고 별도의 안전대를 구조물에 걸고 작업해야 한다."
    ].join(" "),
    source: "건설공사안전관리종합정보망(CSI)",
    sourceUrl: "https://www.csi.go.kr/acd/acdCaseView.do?case_no=5814",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "낙하물방지망 설치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_085",
    title: "콘크리트 타설 중 안전난간 해체구간 추락사고",
    body: [
      "지상 3층 콘크리트 타설 작업 중 펌프카 운전원이 원활한 타설을 위해 시스템비계의 안전난간대를 임의로 해체한 상태로 작업하다가, 난간대가 해체된 구간을 통해 지상으로 추락해 사망했다.",
      "타설 작업의 편의를 위해 안전난간을 임의로 해체해서는 안 되며, 부득이하게 해체해야 하는 경우 작업이 끝난 즉시 원상복구하거나 별도의 추락방지 조치(안전대 착용 등)를 취해야 한다."
    ].join(" "),
    source: "건설공사안전관리종합정보망(CSI)",
    sourceUrl: "https://www.csi.go.kr/acd/acdCaseView.do?case_no=5814",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "콘크리트 타설/안전난간",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_086",
    title: "개구부 덮개 미설치 추락사고",
    body: [
      "건설현장에서 근로자가 이동 중 개구부 턱에 걸려 넘어지면서, 덮개가 설치되지 않은 개구부로 함께 넘어져 10m 아래로 추락해 사망했다.",
      "근로자가 추락할 위험이 있는 개구부에는 반드시 견고한 덮개나 안전난간을 설치해야 하며, 덮개는 임의로 제거되지 않도록 고정하고 식별이 쉽도록 표시해야 한다."
    ].join(" "),
    source: "건설공사안전관리종합정보망(CSI)",
    sourceUrl: "https://www.csi.go.kr/acd/acdCaseView.do?case_no=5814",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "개구부 관리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_087",
    title: "엘리베이터 수리 중 추락 사망사고",
    body: [
      "2023년 6월 23일 서울 서대문구의 한 아파트에서 20대 수리기사가 엘리베이터 통로에서 수리 작업을 하다 발을 헛디뎌 7층 높이에서 추락해 사망했다. 당시 2인 1조 원칙이 지켜지지 않고 혼자 작업하고 있었다.",
      "엘리베이터 설치·정비 작업은 반드시 2인 1조로 진행하고, 승강로 내부 작업 시에는 안전모·안전줄 등 개인보호구를 착용해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=4310",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "엘리베이터 수리",
    weatherType: null,
    effectiveDate: "2023-06-23",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_088",
    title: "판교 신축공사 엘리베이터 설치 중 추락 사망사고",
    body: [
      "경기도 성남시 판교의 신축 공사 현장에서 엘리베이터 설치 작업 중 기계가 지하 5층까지 추락하며 협력업체 작업자 2명이 사망했다.",
      "엘리베이터 설치공사에서는 피트 깊이 확인, 승강로 기울기·치수 확인 시 추락 사고가 반복되므로, 승강로 내부 진입 전 방호덮개나 추락방지망을 설치하고 안전대를 체결해야 한다."
    ].join(" "),
    source: "MBC뉴스",
    sourceUrl: "https://imnews.imbc.com/news/2024/society/article/6646545_36438.html",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "엘리베이터 설치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_089",
    title: "지게차 경사로 운전 중 전도사고",
    body: [
      "지게차로 경사로를 과속으로 운행하던 중 지게차가 전도되어 운전자가 깔리는 사고가 발생했다.",
      "지게차는 적재물이 없을 때는 전진으로 경사로를 내려오고 후진으로 올라가야 하며, 적재물이 있을 때는 후진으로 내려오고 전진으로 올라가야 하고 경사로에서는 반드시 감속 운행해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://kosha.or.kr/kosha/data/regionalCase.do?mode=download&articleNo=418577&attachNo=235842",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "지게차 경사로 운전",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_090",
    title: "양돈농가 축사 밀폐공간 질식 사망사고",
    body: [
      "양돈농가의 정화조·집수조 등 밀폐공간에서 작업하던 근로자가 황화수소에 질식해 사망했다. 축산분뇨 처리시설은 유기물 부패로 황화수소가 다량 발생해 봄·여름철에 질식재해가 집중된다.",
      "황화수소의 노출기준은 10ppm으로 매우 낮으며, 침전물을 밟거나 휘저으면 순간적으로 고농도 가스가 발생해 한 번의 호흡만으로도 의식을 잃을 수 있으므로 작업 전 반드시 농도를 측정하고 환기팬을 가동해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6858",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "축산분뇨처리시설 질식",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_091",
    title: "자동차부품 제조사업장 코일 취급 중대재해",
    body: [
      "경북 성주군의 한 자동차 부품 제조 사업장에서 코일 등 중량물 취급 작업 중 중대재해가 발생했다.",
      "코일, 철판, 대형 금형 등 중량물 취급 작업 전에는 작업계획서를 작성해야 하며, 계획서에는 추락·낙하·전도·협착·붕괴 위험을 예방할 수 있는 구체적인 안전대책이 포함되어야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6505",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "코일 취급",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH11] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH11] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
