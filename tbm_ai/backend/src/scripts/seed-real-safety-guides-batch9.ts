import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_074",
    title: "크레인 줄걸이(슬링) 작업 안전수칙",
    body: [
      "줄걸이 체결 방법(히칭)은 하물의 종류와 중량에 따라 달라야 하며, 바스켓걸기와 초크걸기가 대표적인 방법이다. 줄걸이는 인양각도에 따라 슬링에 걸리는 하중이 달라지므로 적합한 각도를 선택해야 한다.",
      "줄걸이용 인양 체인은 사용 하중이 정확한 정품을 사용해야 하며 발판용 인양 체인을 줄걸이용으로 대체 사용해서는 안 되고, 작업 시작 전 점검은 물론 주 1회 정기점검을 실시해야 한다."
    ].join(" "),
    source: "울산제일일보",
    sourceUrl: "http://www.ujeil.com/news/articleView.html?idxno=9546",
    workType: "중량물취급",
    riskLevel: null,
    process: "크레인 줄걸이(슬링)",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_075",
    title: "물질안전보건자료(MSDS) 경고표지 게시 의무",
    body: [
      "산업안전보건법 제110조에 따라 화학물질을 제조·수입하려는 자는 물질안전보건자료(MSDS)를 작성해야 하며, 사업주는 이를 사업장에 비치하고 작업자에게 교육해야 한다.",
      "경고표지에는 신호어(위험/경고), 유해·위험 문구, 예방조치 문구, 공급자 정보가 모두 포함되어야 하며, 물질안전보건자료대상물질을 담은 용기·포장에 부착하거나 인쇄해 유해·위험정보가 명확히 드러나도록 해야 한다."
    ].join(" "),
    source: "화학물질의 분류·표시 및 물질안전보건자료에 관한 기준",
    sourceUrl:
      "https://www.law.go.kr/%ED%96%89%EC%A0%95%EA%B7%9C%EC%B9%99/%ED%99%94%ED%95%99%EB%AC%BC%EC%A7%88%EC%9D%98%EB%B6%84%EB%A5%98%C2%B7%ED%91%9C%EC%8B%9C%EB%B0%8F%EB%AC%BC%EC%A7%88%EC%95%88%EC%A0%84%EB%B3%B4%EA%B1%B4%EC%9E%90%EB%A3%8C%EC%97%90%EA%B4%80%ED%95%9C%EA%B8%B0%EC%A4%80",
    workType: "화학물질작업",
    riskLevel: null,
    process: "MSDS 경고표지",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_076",
    title: "근골격계부담작업 유해요인조사 대상기준",
    body: [
      "산업안전보건법 제39조 및 안전보건규칙 제12장에 따라 사업주는 반복작업이나 신체에 과도한 부담을 주는 작업에 대해 근골격계 유해요인조사를 실시해야 한다.",
      "조사 대상은 하루 4시간 이상 키보드·마우스를 조작하는 작업, 목·어깨·팔꿈치·손목·손을 하루 2시간 이상 반복 사용하는 작업, 팔을 머리 위로 들거나 팔꿈치를 몸통에서 벗어난 상태로 하루 2시간 이상 작업, 목이나 허리를 지지되지 않은 상태로 구부리거나 트는 작업을 하루 2시간 이상 수행하는 경우 등이다."
    ].join(" "),
    source: "KOSHA GUIDE E-G-1-2025",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/info/koshaGuideData.do?mode=download&articleNo=453891&attachNo=261185",
    workType: "일반작업",
    riskLevel: null,
    process: "근골격계 유해요인조사",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_077",
    title: "밀폐공간 질식사고 최근 통계 및 다발 시기",
    body: [
      "최근 10년간 국내 밀폐공간 질식사고는 174건 발생해 338명의 사상자가 났고 이 중 136명이 사망했으며, 정화조·오폐수처리시설·축산분뇨처리시설·맨홀·집수정·화학물질 저장탱크 등에서 주로 발생한다.",
      "기온이 오르는 5~6월에는 미생물이 빠르게 번식해 산소를 소모하고 유기물 부패로 황화수소 등 유해가스가 다량 방출되므로 이 시기 밀폐공간 작업은 특히 주의해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6858",
    workType: "밀폐공간",
    riskLevel: null,
    process: "밀폐공간 통계",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_078",
    title: "전기설비 활선 근접작업 이격거리 기준",
    body: [
      "전기설비기술기준에 따르면 저압 활선에는 0.6m, 고압 활선에는 0.8m 이상의 이격거리를 유지해야 하며, 25kV 이하 나전선은 2m, 특고압 절연전선은 1.5m 이상 이격해야 한다.",
      "60kV 이하 전력선과 식물·수목 사이의 이격거리는 2m이며, 35kV 이하 고압절연선을 사용할 경우에도 50cm 이상의 이격거리를 유지해야 한다."
    ].join(" "),
    source: "전기설비기술기준",
    sourceUrl:
      "https://www.law.go.kr/%ED%96%89%EC%A0%95%EA%B7%9C%EC%B9%99/%EC%A0%84%EA%B8%B0%EC%84%A4%EB%B9%84%EA%B8%B0%EC%88%A0%EA%B8%B0%EC%A4%80",
    workType: "전기작업",
    riskLevel: null,
    process: "활선 이격거리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_079",
    title: "태양광 설비 상시 활선 위험성",
    body: [
      "태양광 모듈은 햇빛을 받으면 자동으로 전력을 생산하므로, 인버터의 차단기를 내려도 모듈에서 인버터 방향 배선까지는 여전히 전류가 흐르는 활선 상태로 간주해야 한다.",
      "폐기되어 방치된 태양광 패널도 햇빛을 받으면 전력을 생산할 수 있어 화재 진압이나 철거 작업 시 감전 위험이 있으므로, 작업 전 반드시 차광 조치를 하거나 검전기로 잔류전압을 확인해야 한다."
    ].join(" "),
    source: "전기신문",
    sourceUrl: "https://www.electimes.com/news/articleView.html?idxno=221038",
    workType: "전기작업",
    riskLevel: null,
    process: "태양광 설비 감전위험",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_080",
    title: "화학반응기 폭주반응 예방대책",
    body: [
      "화학반응기 폭발사고 조사에서 냉각 실패와 온도제어 실패가 원인의 상당수를 차지하며, 밸브 성능저하·주입라인 막힘·벤트시스템 오류·제어시스템 실패 등 기술적 오류가 가장 많은 사고원인으로 나타났다.",
      "반응기에 설치된 파열판은 예상되는 최대 압력상승을 안전하게 방출할 수 있는 용량으로 설계·유지되어야 하며, 온도 상승 시 냉각설비가 정상 가동되는지 상시 감시해야 한다."
    ].join(" "),
    source: "한국화재보험협회(KFPA)/KOSHA",
    sourceUrl: "https://www.kfpa.or.kr/mem/pdf_file/F/117/F117_3-1.pdf",
    workType: "화학물질작업",
    riskLevel: null,
    process: "반응기 폭주반응 예방",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_081",
    title: "철강업 중대재해 유형 분석",
    body: [
      "철강업에서 발생한 사망사고 중 기계 끼임이 27%로 가장 많았고, 떨어짐이 16%, 화재·폭발이 15%로 뒤를 이었다.",
      "최근 5년간 철강 업종 중대재해를 끼임·추락·기타(화재·폭발 등) 3가지 유형으로 분석한 결과 끼임 6건, 추락 5건, 기타 3건으로 나타나, 회전체·압연설비 방호장치와 고소작업 추락방지 조치가 핵심 예방대책이다."
    ].join(" "),
    source: "KOSHA(철강산업 중대재해 사례집)",
    sourceUrl: "https://seumedu.kr/data/safe/2209safenews.pdf",
    workType: "기계정비",
    riskLevel: null,
    process: "철강업 중대재해 유형",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH9] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH9] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
