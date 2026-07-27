import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_082",
    title: "낙하물방지망·안전난간 임의해체 금지",
    body: [
      "낙하물방지망과 안전난간은 작업 편의를 위해 임의로 해체해서는 안 되며, 인양물에 방지망을 체결할 때는 인양고리 체결 상태를 재확인해야 한다.",
      "부득이하게 안전난간을 해체해야 하는 경우 작업이 끝난 즉시 원상복구하고, 해체된 구간에서는 안전대 착용 등 별도의 추락방지 조치를 취해야 한다."
    ].join(" "),
    source: "건설공사안전관리종합정보망(CSI)",
    sourceUrl: "https://www.csi.go.kr/acd/acdCaseView.do?case_no=5814",
    workType: "건설작업",
    riskLevel: null,
    process: "낙하물방지망/안전난간",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_083",
    title: "개구부 덮개 설치 의무",
    body: [
      "근로자가 추락할 위험이 있는 개구부에는 반드시 견고한 구조의 덮개나 안전난간을 설치해야 한다.",
      "덮개는 임의로 이탈되거나 제거되지 않도록 고정하고, 색상이나 표지로 개구부 위치를 명확히 식별할 수 있도록 표시해야 한다."
    ].join(" "),
    source: "건설공사안전관리종합정보망(CSI)",
    sourceUrl: "https://www.csi.go.kr/acd/acdCaseView.do?case_no=5814",
    workType: "건설작업",
    riskLevel: null,
    process: "개구부 관리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_084",
    title: "승강기(엘리베이터) 설치·정비 2인 1조 원칙",
    body: [
      "엘리베이터 설치·정비 작업은 반드시 2인 1조로 진행해야 하며, 혼자 작업하다 사고가 발생하면 발견과 구조가 지연되어 치명적인 결과로 이어질 수 있다.",
      "피트 깊이 확인, 승강로 기울기·치수 확인 시 추락 사고가 반복되므로 승강로 내부 진입 전 안전모·안전줄 등 개인보호구를 반드시 착용해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=4310",
    workType: "기계정비",
    riskLevel: null,
    process: "승강기 설치/정비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_085",
    title: "압력용기 안전검사 주기",
    body: [
      "산업안전보건법에 따른 압력용기의 안전검사는 설치 완료 후 3년 이내 최초 안전검사를 받아야 하고, 이후 2년 주기로 정기 안전검사를 받아야 하며 공정안전보고서 확인을 받은 경우 4년 주기를 적용할 수 있다.",
      "정기검사에서는 용기 본체·노즐·맨홀·부속물·지지대의 손상·변형 여부, 용접이음부와 노즐부·맨홀의 누설 흔적 여부, 압력을 받는 부분의 두께가 필요두께 이상인지를 확인해야 한다."
    ].join(" "),
    source: "KOSHA(유해·위험 기계·기구 종합정보시스템)",
    sourceUrl: "https://miis.kosha.or.kr/minwon/info/viewIsSiCycle.do",
    workType: "기계정비",
    riskLevel: null,
    process: "압력용기 안전검사",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_086",
    title: "지게차 경사로 안전운전 수칙",
    body: [
      "지게차로 경사로를 주행할 때 적재물이 없는 경우에는 전진으로 내려오고 후진으로 올라가야 하며, 적재물이 있는 경우에는 후진으로 내려오고 전진으로 올라가야 한다.",
      "경사로에서는 반드시 감속 운행하고 급회전이나 급제동을 피해야 하며, 과속으로 인한 전도사고가 지게차 중대재해의 주요 원인 중 하나이다."
    ].join(" "),
    source: "KOSHA(지게차 사망사고 사례 및 예방대책)",
    sourceUrl:
      "https://www.kosha.or.kr/kosha/intro/easternGyeonggiBranch_A.do?mode=download&articleNo=367328&attachNo=203284",
    workType: "중량물취급",
    riskLevel: null,
    process: "지게차 경사로 운전",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_087",
    title: "황화수소 밀폐공간 위험성",
    body: [
      "정화조·집수조·축산분뇨처리시설 등에서 발생하는 황화수소는 노출기준이 10ppm으로 매우 낮아 적은 양으로도 위험하며, 침전물을 밟거나 휘저으면 순간적으로 고농도 가스가 발생해 한 번의 호흡만으로 의식을 잃고 사망할 수 있다.",
      "이러한 밀폐공간 작업 전에는 반드시 산소농도와 유해가스 농도를 측정하고, 작업 중에는 환기팬을 가동해 유해가스를 지속적으로 배출해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6858",
    workType: "밀폐공간",
    riskLevel: null,
    process: "황화수소 위험성",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_088",
    title: "중량물 취급 작업계획서 필수 포함사항",
    body: [
      "코일·철판·대형 금형 등 중량물 취급 작업 전에는 반드시 작업계획서를 작성해야 하며, 최근 제조업 현장에서 이러한 중량물 취급 중 발생하는 산업재해가 증가하고 있다.",
      "작업계획서에는 추락 위험, 낙하 위험, 전도 위험, 협착 위험, 붕괴 위험을 예방할 수 있는 구체적인 안전대책이 반드시 포함되어야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6505",
    workType: "중량물취급",
    riskLevel: null,
    process: "중량물 작업계획서",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_089",
    title: "안전대 부착설비 설치기준 (안전보건규칙 제44조)",
    body: [
      "높이 2m 이상의 추락 위험 장소에서 근로자에게 안전대를 착용시키는 경우, 사업주는 안전대를 안전하게 걸어 사용할 수 있는 부착설비를 설치해야 한다.",
      "지지로프 등을 부착설비로 설치할 때는 처지거나 느슨해지지 않도록 필요한 조치를 해야 하며, 작업 시작 전 안전대와 부착설비에 이상이 없는지 점검해야 한다."
    ].join(" "),
    source: "산업안전보건기준에 관한 규칙 제44조",
    sourceUrl: "https://www.law.go.kr/LSW//lsInfoP.do?lsId=007363&ancYnChk=0",
    workType: "고소작업",
    riskLevel: null,
    process: "안전대 부착설비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH10] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH10] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
