import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_090",
    title: "동절기 결빙구간 미끄럼방지 조치",
    body: [
      "동절기에는 낮은 기온과 불안정한 날씨로 화재, 낙상, 질식 등의 사고 위험이 커지며, 결빙된 작업장 바닥과 눈이 쌓인 구조물에서의 미끄러짐 사고가 대표적인 재해 유형이다.",
      "결빙 구간에는 모래나 염화칼슘을 살포하고, 가설구조물은 적설로 인한 하중을 점검해 붕괴를 방지하며, 작업장 내 통로·계단 등 주요 이동 경로의 미끄럼 방지 조치를 철저히 해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6405",
    workType: "일반작업",
    riskLevel: null,
    process: "동절기 결빙 미끄럼방지",
    weatherType: "한파",
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_091",
    title: "고온배관 정비 시 맹판(블라인드) 설치 의무",
    body: [
      "보일러·배관 정비 작업 중 맹판(차단용 덮개판)을 설치하지 않고 작업하다가 고온의 스팀이나 유체가 역류해 화상사고로 이어진 사례가 반복되고 있다.",
      "배관·보일러 정비 전에는 반드시 관련 구간에 맹판을 설치해 압력원과 물리적으로 차단하고, 밸브가 완전히 잠겨 있는지 확인한 후 작업을 시작해야 한다."
    ].join(" "),
    source: "리걸타임즈",
    sourceUrl: "https://www.legaltimes.co.kr/news/articleView.html?idxno=49543",
    workType: "기계정비",
    riskLevel: null,
    process: "고온배관 맹판설치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_092",
    title: "지붕재(패널) 설치작업 개구부 안전조치",
    body: [
      "지붕재나 대형 패널 설치·보수 작업 중 시공되지 않은 개구부로 추락하는 사고가 반복적으로 발생하므로, 작업 전 개구부에는 임시 덮개나 안전방망을 반드시 설치해야 한다.",
      "대형 패널을 진공흡착기 등으로 인양할 때는 흡착 상태를 작업 전 점검하고, 작업자는 안전대를 구조물에 체결한 상태에서 이동해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=1602",
    workType: "고소작업",
    riskLevel: null,
    process: "지붕재/패널 설치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_093",
    title: "사업장 비상구 설치기준",
    body: [
      "비상구는 출입구와 같은 방향에 있지 않고 출입구로부터 3m 이상 떨어져 있어야 하며, 작업장 각 부분에서 비상구 또는 출입구까지의 수평거리가 50m 이하가 되도록 설치해야 한다.",
      "비상구의 너비는 0.75m 이상, 높이는 1.5m 이상이어야 하며 문은 피난 방향으로 열리고 실내에서 항상 열 수 있는 구조여야 한다."
    ].join(" "),
    source: "산업안전보건기준에 관한 규칙",
    sourceUrl: "https://hseworld.co.kr/226",
    workType: "일반작업",
    riskLevel: null,
    process: "비상구 설치기준",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_094",
    title: "피난통로 유지관리 의무",
    body: [
      "피난통로의 너비는 75cm 이상이어야 하고 실내마감은 불연재료로 해야 하며, 사업주는 비상구·비상통로·비상용 기구를 근로자가 언제든 쉽게 이용할 수 있도록 항상 사용 가능한 상태로 유지해야 한다.",
      "피난통로에 자재나 장비를 적재해 통로 폭을 침범하는 행위는 금지되며, 정기적으로 통로 확보 상태를 점검해야 한다."
    ].join(" "),
    source: "산업안전보건기준에 관한 규칙",
    sourceUrl: "https://hseworld.co.kr/226",
    workType: "일반작업",
    riskLevel: null,
    process: "피난통로 관리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_095",
    title: "건강진단 결과에 따른 사후관리 조치",
    body: [
      "사업주는 건강진단 결과표에 따라 근로자의 건강을 유지하기 위해 필요한 조치를 하고, 근로자에게 해당 조치 내용을 설명해야 한다.",
      "건강진단 결과 필요하다고 인정될 때는 작업장소 변경, 작업 전환, 근로시간 단축 등 고용노동부령으로 정한 적절한 조치를 취해야 한다."
    ].join(" "),
    source: "산업안전보건법",
    sourceUrl: "https://www.law.go.kr/lsLinkCommonInfo.do?lsJoLnkSeq=1020162031&chrClsCd=010202",
    workType: "일반작업",
    riskLevel: null,
    process: "건강진단 사후관리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_096",
    title: "배치전건강진단 실시 의무",
    body: [
      "배치전건강진단은 사업주가 신규채용 또는 배치전환 등의 사유로 근로자를 법정 유해인자 노출부서에 신규 배치할 때, 직업성 질환 예방을 위해 실시하는 건강진단이다.",
      "유해인자에 노출되는 작업으로 배치하기 전에는 반드시 해당 근로자의 건강 상태가 그 작업에 적합한지 확인하는 절차를 거쳐야 한다."
    ].join(" "),
    source: "산업안전보건법 시행규칙",
    sourceUrl: "https://www.law.go.kr/LSW/lumLsLinkPop.do?lspttninfSeq=154565&chrClsCd=010202",
    workType: "일반작업",
    riskLevel: null,
    process: "배치전건강진단",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_097",
    title: "특수건강진단 사후관리 조치결과 보고",
    body: [
      "사업주는 특수·수시·임시건강진단 결과표의 의사소견에 따라 필요한 조치를 한 후, 사후관리 조치결과 보고서에 건강진단 결과표와 사후관리 증명서류를 첨부해 관할 지방고용노동관서에 제출해야 한다.",
      "제출기한은 사업주가 건강진단 결과표를 송부받은 날로부터 30일 이내이다."
    ].join(" "),
    source: "고용노동부",
    sourceUrl:
      "https://www.moel.go.kr/local/changwon/news/notice/noticeView.do?bbs_seq=20200300905",
    workType: "일반작업",
    riskLevel: null,
    process: "특수건강진단 사후관리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_098",
    title: "진공흡착기 이용 중량물(유리·패널) 취급 안전수칙",
    body: [
      "유리패널·대형 패널 등을 진공흡착기로 인양할 때는 작업 전 흡착판의 흡착력과 진공압력 게이지를 반드시 점검하고, 인양 중 흡착력 저하 경보가 울리면 즉시 작업을 중단해야 한다.",
      "장당 100kg을 넘는 대형 패널을 취급할 때는 2인 이상이 협력해 균형을 유지하고, 개구부가 있는 지붕이나 고소 구간에서는 사전에 방호덮개를 설치한 후 작업해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=1602",
    workType: "중량물취급",
    riskLevel: null,
    process: "진공흡착기 패널취급",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_099",
    title: "겨울철 건설현장 재해예방 대책",
    body: [
      "겨울철 건설현장은 결빙된 통로·비계 발판에서의 미끄러짐, 적설로 인한 가설구조물 붕괴, 저체온증 등의 위험이 커지므로 작업 전 기상 상황을 반드시 확인해야 한다.",
      "눈이 쌓인 지붕이나 고소 구조물에서는 제설을 완료하고 미끄럼방지 조치를 취하기 전까지 작업을 중지해야 하며, 가설구조물은 적설 하중을 고려해 정기적으로 안전성을 점검해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6405",
    workType: "건설작업",
    riskLevel: null,
    process: "겨울철 건설현장 재해예방",
    weatherType: "한파",
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_100",
    title: "스팀배관 역류 방지 안전작업절차",
    body: [
      "스팀·고온수가 흐르는 배관이나 열교환기가 연결된 밀폐공간(탱크·드럼 등) 내부 작업 시에는 연결 배관의 밸브를 완전히 차단하고 맹판을 설치한 뒤 잠금표시(LOTO)를 실시해야 한다.",
      "진입 전에는 내부 온도와 잔류 증기 여부를 확인하고, 작업 중에도 인접 설비의 스팀 공급이 재개되지 않도록 관리감독자가 통제해야 한다."
    ].join(" "),
    source: "안전저널",
    sourceUrl: "https://www.anjunj.com/news/articleView.html?idxno=16859",
    workType: "밀폐공간",
    riskLevel: null,
    process: "스팀배관 역류방지",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH11] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH11] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
