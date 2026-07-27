import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_050",
    title: "LOTO(잠금장치) 제도 및 절차",
    body: [
      "LOTO는 기계·설비의 비정형(정비·수리·청소) 작업 시 위험 에너지를 차단하고 주변에 작업 상황을 알려 근로자의 안전을 보장하는 절차로, Lock Out은 전원 차단부에 물리적 잠금장치를 설치하는 것이고 Tag Out은 장비 상태와 작업 정보를 표시해 다른 근로자의 임의 조작을 막는 것이다.",
      "산업안전보건기준에 관한 규칙 제92조는 비정형 작업 시 잠금장치와 표지판 설치를 규정하며, 전기 차단장치·유압밸브·공기차단밸브·열원 공급장치 등에는 반드시 잠금장치를 설치해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE Z-40-2022",
    sourceUrl: "https://koshahub.or.kr/news_detail.html?id=715",
    workType: "기계정비",
    riskLevel: null,
    process: "LOTO 절차",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_051",
    title: "크레인 신호수 배치기준 및 안전수칙",
    body: [
      "크레인으로 인양할 하물이 운전원에게 보이지 않는 경우 신호수를 배치해야 하며, 한 작업에는 한 명의 총괄 신호수만 지시하는 단일 지시체계를 유지해야 한다.",
      "신호수는 하중 낙하·스윙 예상 궤적의 외측 1.5배 반경 이상을 유지하고 하중 아래나 회전 반경 안에는 절대 진입하지 않아야 하며, 불안정 징후가 보이면 즉시 비상정지를 지시할 권한을 가져야 한다."
    ].join(" "),
    source: "크레인작업표준신호지침(고용노동부 고시)",
    sourceUrl: "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2352",
    workType: "중량물취급",
    riskLevel: null,
    process: "크레인 신호수",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_052",
    title: "개인보호구(안전모·안전화) 지급기준",
    body: [
      "물체가 떨어지거나 날아올 위험 또는 근로자가 추락할 위험이 있는 작업에는 안전모를 지급해야 하고, 물체의 낙하·충격, 물체에의 끼임, 감전 또는 정전기 대전 위험이 있는 작업에는 안전화를 지급해야 한다.",
      "사업주는 작업조건에 맞는 보호구를 작업하는 근로자 수 이상으로 지급하고 착용하도록 해야 한다."
    ].join(" "),
    source: "산업안전보건기준에 관한 규칙 제32조",
    sourceUrl:
      "https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%82%B0%EC%97%85%EC%95%88%EC%A0%84%EB%B3%B4%EA%B1%B4%EA%B8%B0%EC%A4%80%EC%97%90%EA%B4%80%ED%95%9C%EA%B7%9C%EC%B9%99/%EC%A0%9C32%EC%A1%B0",
    workType: "일반작업",
    riskLevel: null,
    process: "개인보호구 지급기준",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_053",
    title: "온열질환(열사병) 응급조치 및 예방",
    body: [
      "열사병은 고열로 체온조절 기능이 마비되어 40도 이상의 고열과 의식 혼미·혼수상태가 나타나는 위급한 응급질환으로, 낮 12시부터 오후 5시까지 가장 더운 시간대에는 옥외작업을 자제해야 한다.",
      "발생 시에는 즉시 그늘지고 시원한 장소로 옮기고 옷을 벗긴 뒤, 시원한 물을 뿌리거나 젖은 수건으로 몸을 적셔주며 체온을 낮추고 상태를 관찰해야 하며 환자를 혼자 두지 말아야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://www.kosha.or.kr/kosha/business/heatWaveResponse02.do",
    workType: "일반작업",
    riskLevel: null,
    process: "온열질환 응급조치",
    weatherType: "폭염",
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_054",
    title: "이동식사다리 안전작업지침",
    body: [
      "이동식사다리는 평탄하고 견고하며 미끄럽지 않은 바닥에 설치하고, 설치 바닥면에서 높이 3.5m 이하의 장소에서만 작업해야 하며, 최상부 발판과 그 하단 디딤대에 올라서서 작업해서는 안 된다(높이 1m 이하 사다리는 제외).",
      "안전모를 착용하되 작업 높이가 2m 이상인 경우에는 안전모와 안전대를 함께 착용해야 하며, 다른 근로자가 사다리를 지지해 넘어지지 않도록 해야 한다."
    ].join(" "),
    source: "고용노동부/KOSHA(이동식사다리 안전작업지침)",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/safetyGovernance.do?mode=download&articleNo=401576&attachNo=225098",
    workType: "고소작업",
    riskLevel: null,
    process: "이동식사다리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_055",
    title: "전동공구·이동형 전기기구 누전차단기 설치기준",
    body: [
      "대지전압이 150V를 초과하는 이동형 또는 휴대형 전기기계·기구에는 누전에 의한 감전위험을 방지하기 위해 감전방지용 누전차단기를 설치해야 한다.",
      "감전보호용 누전차단기는 고감도 고속형이어야 하며 국내기준으로 정격감도전류 30mA 이하, 동작시간 0.03초 이하여야 하고, 모든 전기기계·기구는 누전차단기 연결과 외함 접지를 함께 사용해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/regionalCase.do?mode=download&articleNo=411215&attachNo=232531",
    workType: "전기작업",
    riskLevel: null,
    process: "전동공구 감전예방",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_056",
    title: "밀폐공간 질식사고 최근 현황 및 규칙 개정",
    body: [
      "최근 5년간 발생한 밀폐공간 질식사고는 총 38건이며, 이 중 대부분이 산소·유해가스 농도를 측정하지 않는 등 기초적인 안전보건조치를 취하지 않아 발생한 것으로 나타났다.",
      "고용노동부는 사업주가 측정 장비를 측정자에게 지급할 의무를 명확히 하고, 산소·유해가스 농도 측정 및 적정공기 평가 결과를 기록·보존하도록 안전보건규칙 개정을 추진하고 있으며, 감시인은 밀폐공간 외부에 배치해 이상 발생 시 즉시 구조요청 및 관리감독자 통보 조치를 해야 한다."
    ].join(" "),
    source: "고용노동부/KOSHA",
    sourceUrl: "https://v.daum.net/v/20251009170046423",
    workType: "밀폐공간",
    riskLevel: null,
    process: "밀폐공간 감시인/농도측정",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_057",
    title: "화물 적재·하역 작업 안전수칙",
    body: [
      "화물차 적재·하역 작업 중 사고는 도로 주행 중보다 사업장 내에서 더 많이 발생하며, 적재 중 무너진 화물에 맞거나 컨테이너 개방 중 쏟아진 화물에 깔리는 재해가 반복되고 있다.",
      "화물 적재작업 순서와 화물 형태에 따른 쌓기 방법을 사전에 정하고, 결박 방법을 준수하며, 컨테이너·적재함 문을 개방할 때는 화물이 쏟아지지 않도록 예방 조치를 취해야 한다."
    ].join(" "),
    source: "대한경제",
    sourceUrl: "https://www.dnews.co.kr/uhtml/view.jsp?idxno=202211090948189040788",
    workType: "중량물취급",
    riskLevel: null,
    process: "화물 적재/하역",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH6] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH6] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
