import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_058",
    title: "흙막이 지보공 조립도 작성 의무",
    body: [
      "사업주는 흙막이 지보공을 조립하는 경우 미리 조립도를 작성하고, 그 조립도에 따라 조립해야 한다.",
      "도시지역의 지하터널, 도시철도 역사, 대규모 상업시설, 초고층 빌딩 기초 공사 등에서는 사면 토사 붕괴나 굴착 측면 붕괴가 빈번하므로 지반 상태에 맞는 지보공 설계와 계측관리가 필요하다."
    ].join(" "),
    source: "산업안전보건기준에 관한 규칙",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/constructionsafety.do?mode=download&articleNo=436193&attachNo=245212",
    workType: "굴착작업",
    riskLevel: null,
    process: "흙막이 지보공",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_059",
    title: "항타기·항발기 전도 예방대책",
    body: [
      "항타기 사고는 운영 중 66%, 설치·해체 중 33%가량 발생하며, 리더 높이를 등록사항보다 높게 설치하거나 지반이 연약한 경우 전도 위험이 커진다.",
      "국토교통부 건설안전정보시스템 사고 분석 결과 하부 철판의 잘못된 사용에 의한 전도사고가 빈번하므로, 이동 전 지반 상태를 확인하고 적정 두께의 철판을 사용해야 한다."
    ].join(" "),
    source: "국토교통부/건설안전정보시스템",
    sourceUrl: "https://www.molit.go.kr/USR/NEWS/dtl.jsp?lcmspage=1&id=95090987",
    workType: "건설작업",
    riskLevel: null,
    process: "항타기/항발기 전도예방",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_060",
    title: "콘크리트펌프카 아웃트리거 지반 안전조치",
    body: [
      "최근 5년간 콘크리트펌프카 사고는 17건이며 이 중 전도 사고가 12건, 붐대 파단 사고가 5건으로 5명이 사망했다.",
      "아웃트리거 하부 지반이 침하되면 펌프카가 기울어지며 붐대가 불시 하강할 수 있으므로, 연약지반에는 반드시 받침판을 설치해 침하를 방지하고 작업 전 지지대·붐대의 결함 여부를 점검해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=1298",
    workType: "건설작업",
    riskLevel: null,
    process: "콘크리트펌프카 안전조치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_061",
    title: "스크류컨베이어·원심분리기 협착 예방",
    body: [
      "스크류컨베이어는 회전 날개에 의한 끼임사고 위험이 가장 크며, 정비·보수 작업 시 다른 근로자의 오조작이나 가동 중인 트로프의 중간 베어링 급유 시 협착이 발생할 수 있다.",
      "원료 투입 시에는 손이 아닌 보조 수공구를 사용하고, 정비·급유 작업 전에는 전원을 차단하고 잠금표시(LOTO)를 실시해야 하며, 원심분리기는 시료 밸런스가 맞지 않으면 회전축 이탈이나 파손 위험이 있으므로 가동 전 균형을 확인해야 한다."
    ].join(" "),
    source: "비즈중앙",
    sourceUrl: "https://www.bizjoongang.co.kr/news/articleView.html?idxno=53208",
    workType: "기계정비",
    riskLevel: null,
    process: "스크류컨베이어/원심분리기",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_062",
    title: "아크플래시 및 배전반 전기화재 예방",
    body: [
      "저압 대전류에 의한 아크(불꽃)로 화상을 입을 수 있으며, 고전압에서는 감전과 동시에 신체에 불이 붙는 전기화상이 발생할 수 있다.",
      "전기화재의 발화요인은 절연열화가 가장 많고 다음으로 미확인 단락, 접촉불량, 과부하·과전류, 트래킹 순으로 나타나므로, 배전반·분전반은 정기적인 절연저항 측정과 접속부 열화 점검이 필요하다."
    ].join(" "),
    source: "산업종합저널(전기)",
    sourceUrl: "https://industryjournal.co.kr/news/221106",
    workType: "전기작업",
    riskLevel: null,
    process: "아크플래시/배전반",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_063",
    title: "폐기물 소각시설 작업관리 (KOSHA GUIDE E-G-7)",
    body: [
      "폐기물 소각작업은 고온의 소각로와 이송설비를 다루는 특성상 화상 재해가 잦다.",
      "소각로 점검·정비 시에는 완전 냉각 여부를 확인한 후 진입하고, 방열복 등 개인보호구를 착용하며 고온설비 주변에는 접촉방지 조치를 취해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE E-G-7-2025",
    sourceUrl:
      "https://www.aposho.org/kosha/info/koshaGuideData.do?mode=download&articleNo=453906&attachNo=261178",
    workType: "기계정비",
    riskLevel: null,
    process: "폐기물 소각시설",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_064",
    title: "방폭전기설비 위험장소 구분",
    body: [
      "탱크, 펌프, 배관, 용기 등 공정설비의 모든 구성요소는 잠재적인 가연성 물질의 누출원으로 간주되며, 인화성 가스가 발생할 수 있는 폭발위험장소의 범위는 누출률, 가스특성, 누출형상, 주위 기하학적 구조 등에 의해 결정된다.",
      "폭발위험장소로 구분된 지역에는 KOSHA GUIDE E-190(방폭전기설비 설계·선정·설치 기술지침) 등에 따라 방폭구조 전기기계·기구를 설치하고 최초 검사를 받아야 한다."
    ].join(" "),
    source: "KOSHA GUIDE E-190-2023",
    sourceUrl:
      "https://www.kosha.or.kr/extappKosha/kosha/guidance/fileDownload.do?sfhlhTchnlgyManualNo=E-190-2023&fileOrdrNo=4",
    workType: "화학물질작업",
    riskLevel: null,
    process: "방폭전기설비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_065",
    title: "유해화학물질 취급시설 정기검사 (화관법)",
    body: [
      "유해화학물질 취급시설은 가동 전 설치검사를 받아야 하며, 이후 사업장의 위험도와 취급량에 따라 1~4년 주기로 정기검사를 받아야 한다.",
      "정기검사는 안전보건공단, 가스안전공사, 환경공단에서 실시하며 압력용기의 안전밸브·파열판 등 안전장치 설치 여부와 누액감지기·가스감지기 등 검지·경보설비가 주요 점검 대상이다."
    ].join(" "),
    source: "화학물질관리법(화관법)",
    sourceUrl: "https://www.law.go.kr/admRulLsInfoP.do?admRulSeq=2100000207199",
    workType: "화학물질작업",
    riskLevel: null,
    process: "유해화학물질 취급시설 검사",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH7] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH7] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
