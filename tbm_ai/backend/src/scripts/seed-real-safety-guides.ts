import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

// 사고사례(seed-real-incident-cases*)와 달리, 이 스크립트는 "표준/절차/기준"을 다루는
// 실제 KOSHA 기술지침·산업안전보건기준에 관한 규칙 내용을 요약해 넣는다.
const REAL_GUIDES: RagDocumentInput[] = [
  // 화기작업
  {
    externalKey: "guide_real_001",
    title: "화기작업 허가 절차",
    body: [
      "화기작업(용접, 용단 등)을 하려면 별도의 화기작업허가를 취득해야 한다.",
      "밀폐공간 등 다른 고위험 작업과 화기작업이 병행되는 경우에는 각각의 작업승인 여부를 모두 확인해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/musculoskeletalPreventionData_A.do?mode=download&articleNo=296389&attachNo=166906",
    workType: "화기작업",
    riskLevel: null,
    process: "화기작업 허가",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 밀폐공간
  {
    externalKey: "guide_real_002",
    title: "밀폐공간 적정공기 기준",
    body: [
      "산업안전보건기준에 관한 규칙상 적정공기란 산소농도 18% 이상 23.5% 미만, 이산화탄소 1.5% 미만, 일산화탄소 30ppm 미만, 황화수소 10ppm 미만인 수준의 공기를 말한다.",
      "산소농도가 18% 미만인 상태는 산소결핍으로 규정되며, 밀폐공간 출입 전 반드시 확인해야 한다."
    ].join(" "),
    source: "법제처(산업안전보건기준에 관한 규칙)",
    sourceUrl:
      "https://www.law.go.kr/LSW//lsLawLinkInfo.do?lsJoLnkSeq=1000218131&chrClsCd=010202&lsId=007363&print=print",
    workType: "밀폐공간",
    riskLevel: null,
    process: "적정공기 기준",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_003",
    title: "밀폐공간 보건작업 프로그램",
    body: [
      "사업주는 근로자가 밀폐공간에서 작업을 시작하기 전에 사업장 내 밀폐공간의 위치 파악 및 관리 방안, 질식·중독 등을 일으킬 수 있는 유해·위험 요인의 파악 및 관리 방안, 작업 시 사전 확인이 필요한 사항에 대한 확인 절차를 포함한 밀폐공간 보건작업 프로그램을 수립·시행해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/business/occuHealthBusinessData.do?mode=download&articleNo=452084&attachNo=257821",
    workType: "밀폐공간",
    riskLevel: null,
    process: "밀폐공간 보건작업 프로그램",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_004",
    title: "밀폐공간 가스농도 측정 방법",
    body: [
      "가스농도측정은 환기 전 측정으로 밀폐공간의 공기 특성을 먼저 파악하고, 환기를 실시한 뒤 재측정하여 적정공기 상태가 되었는지 확인해야 한다.",
      "산소 및 유해가스 농도 측정은 측정 장비의 조작과 그 결과에 대한 올바른 해석을 할 수 있는 사람이 수행해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/musculoskeletalPreventionData_A.do?mode=download&articleNo=452084&attachNo=257821",
    workType: "밀폐공간",
    riskLevel: null,
    process: "가스농도 측정",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 고소작업
  {
    externalKey: "guide_real_005",
    title: "안전난간 설치기준",
    body: [
      "안전난간은 상부난간대·중간난간대·난간기둥·발끝막이판으로 구성되며, 중간난간대 간격은 50cm 이하로, 발끝막이판은 바닥에서 10cm 이상 높이로 설치해야 한다.",
      "난간재료는 지름 2.7cm 이상의 금속제 파이프 또는 그 이상의 강도를 가진 재료를 사용해야 한다."
    ].join(" "),
    source: "KOSHA/산업안전보건기준에 관한 규칙",
    sourceUrl:
      "https://www.kosha.or.kr/kosha/info/koshaGuideData.do?mode=download&articleNo=453844&attachNo=260120",
    workType: "고소작업",
    riskLevel: null,
    process: "안전난간 설치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_006",
    title: "추락재해방지 표준안전작업지침",
    body: [
      "고소작업 시에는 안전대 부착설비를 설치하고 작업발판을 설치하는 등 추락 방지조치를 취해야 한다.",
      "추락재해방지표준안전작업지침(행정규칙)에 따라 작업 전 안전대 부착설비와 발판 상태를 점검해야 한다."
    ].join(" "),
    source: "고용노동부(추락재해방지표준안전작업지침)",
    sourceUrl: "https://www.law.go.kr/LSW/admRulLsInfoP.do?admRulSeq=2100000186039",
    workType: "고소작업",
    riskLevel: null,
    process: "추락 방지조치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 전기작업
  {
    externalKey: "guide_real_007",
    title: "전기작업 안전관리계획서 5단계",
    body: [
      "활선작업·정전작업·활선근접작업 시에는 전기 특성과 작업내용을 고려한 전기안전관리계획서를 작성해 감전재해를 예방해야 한다.",
      "계획서는 작업준비단계, 전원차단단계, 전기공사 작업단계, 전원복전단계, 작업종료단계의 5단계로 치밀하게 수립해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE E-105",
    sourceUrl:
      "http://www.myungjielec.com/32/?q=YToyOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjtzOjQ6InBhZ2UiO2k6Mzt9&bmode=view&idx=1812094&t=board",
    workType: "전기작업",
    riskLevel: null,
    process: "전기작업 안전관리계획서",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_008",
    title: "전기작업계획서 필수 포함사항",
    body: [
      "전기작업계획서에는 작업 목적 및 내용, 작업자 자격 및 적정인원, 작업책임자 임명, 감전·아크섬광·아크폭발 등 전기 위험요인 파악, 접근한계거리, 활선접근경보장치 휴대 등 작업시작 전 필요사항을 포함해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE",
    sourceUrl:
      "https://gidosa.net/entry/%EC%A0%95%EC%A0%84%EC%9E%91%EC%97%85-%ED%99%9C%EC%84%A0%EC%9E%91%EC%97%85-%ED%99%9C%EC%84%A0%EA%B7%BC%EC%A0%91%EC%9E%91%EC%97%85%EC%97%90%EC%84%9C-%EA%B0%90%EC%A0%84%EC%9E%AC%ED%95%B4-%EC%98%88%EB%B0%A9%EC%9D%84-%EC%9C%84%ED%95%9C-%EC%95%88%EC%A0%84%EC%9E%91%EC%97%85%EA%B3%84%ED%9A%8D%EC%84%9C-%EC%9E%91%EC%84%B1%EC%9D%98-%ED%95%B5%EC%8B%AC%EC%82%AC%ED%95%AD%EB%93%A4-%EC%95%8C%EC%95%84%EB%B3%B4%EA%B8%B0",
    workType: "전기작업",
    riskLevel: null,
    process: "전기작업계획서",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 중량물취급
  {
    externalKey: "guide_real_009",
    title: "이동식크레인 작업계획서",
    body: [
      "중량물을 이동식크레인으로 취급할 때는 작업계획서를 작성해야 하며, 장비 전도·낙하물·협착·추락·감전 등의 사고를 예방하기 위한 안전조치를 사전에 계획해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE C-102-2023",
    sourceUrl:
      "https://www.kosha.or.kr/extappKosha/kosha/guidance/fileDownload.do?sfhlhTchnlgyManualNo=C-102-2023&fileOrdrNo=2",
    workType: "중량물취급",
    riskLevel: null,
    process: "이동식크레인 작업계획서",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_010",
    title: "중량물 취급 작업구역 통제",
    body: [
      "이동식크레인 등으로 중량물을 취급하는 작업구역에는 안전펜스를 설치해 비작업자의 출입을 통제하고, 신호수를 배치해 인양작업 전 과정을 통제해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_crane",
    workType: "중량물취급",
    riskLevel: null,
    process: "작업구역 통제/신호수",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 굴착작업
  {
    externalKey: "guide_real_011",
    title: "굴착공사 단계별 위험요인",
    body: [
      "굴착공사는 장비·자재 반입, 흙막이 지보공 설치, 굴착 및 가시설 설치, 구조물 공사, 해체 및 되메우기 순으로 진행된다.",
      "각 단계마다 토사 무너짐, 흙막이 지보공 설치 중 근로자 떨어짐, 건설기계에 의한 끼임 등의 위험이 존재해 단계별 안전조치가 필요하다."
    ].join(" "),
    source: "KOSHA GUIDE C-4-2012",
    sourceUrl: "https://www.cak.or.kr/download.do?uuid=ae78969e-c555-4424-8455-401775bcf217.pdf",
    workType: "굴착작업",
    riskLevel: null,
    process: "굴착공사 단계관리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_012",
    title: "흙막이 지보공 일상점검",
    body: [
      "흙막이 지보공은 작업 전후로 상부 지반의 균열, 부재 접합부 용접상태, 버팀대 연결부 볼트 이완 여부를 매일 점검해야 한다.",
      "점검 중 이상이 발견되면 즉시 보강조치를 취하고 위험구간의 출입을 통제해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/intro/jeonbukBranch_A.do?mode=download&articleNo=423307&attachNo=239329",
    workType: "굴착작업",
    riskLevel: null,
    process: "흙막이 지보공 점검",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 화학물질작업
  {
    externalKey: "guide_real_013",
    title: "MSDS(물질안전보건자료) 작성·제공 의무",
    body: [
      "산업안전보건법 제110조·제111조에 따라 화학물질을 제조·수입·판매하는 자는 물질안전보건자료(MSDS)를 작성해 제공할 의무가 있다.",
      "MSDS는 화학물질의 명칭, 성분, 물리·화학적 특성, 폭발·화재 위험성, 독성정보, 응급처치 방법 등 16개 항목으로 구성된다."
    ].join(" "),
    source: "KOSHA(물질안전보건자료시스템)",
    sourceUrl: "https://msds.kosha.or.kr/MSDSInfo/",
    workType: "화학물질작업",
    riskLevel: null,
    process: "MSDS 관리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_014",
    title: "화학물질 취급 근로자 교육 및 경고표지",
    body: [
      "화학물질 취급 사업장은 근로자에게 취급하는 화학물질의 MSDS 내용을 교육해야 한다.",
      "화학물질 용기 및 포장에는 GHS(세계조화시스템) 기준 경고표지를 반드시 부착해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://msds.kosha.or.kr/MSDSInfo/kcic/msds/msds.do?page=msds04",
    workType: "화학물질작업",
    riskLevel: null,
    process: "경고표지/근로자 교육",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 기계정비
  {
    externalKey: "guide_real_015",
    title: "LOTO(잠금·표지) 절차",
    body: [
      "LOTO는 기계·설비에 대한 비정형 작업(정비, 점검 등) 시 위험 에너지를 차단(Lock Out)하고 작업 상황을 표지(Tag Out)로 알려 근로자의 안전을 보장하는 절차다.",
      "Lock Out은 전원 차단부에 잠금장치를 설치해 불시 가동을 막는 것이고, Tag Out은 장비 상태와 작업 정보를 표지판으로 명시해 다른 근로자가 임의로 조작하지 못하게 하는 것이다."
    ].join(" "),
    source: "KOSHA GUIDE Z-40-2022",
    sourceUrl: "https://www.hadaworks.com/blog-insight/lock-out-tag-out",
    workType: "기계정비",
    riskLevel: null,
    process: "LOTO 절차",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_016",
    title: "LOTO 표지판 기재사항",
    body: [
      "잠금장치 설치 후 부착하는 표지판에는 작업 내용, 작업자 이름, 작업 종료 예정 시간, 경고 메시지를 명확히 기록해야 한다.",
      "표준화된 LOTO 운영 절차를 문서화하고 근로자 교육을 통해 모든 인원이 일관된 방식으로 절차를 따르도록 해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE Z-40-2022",
    sourceUrl:
      "https://www.kogl.or.kr/recommend/recommendDivView.do?recommendIdx=33465&division=img",
    workType: "기계정비",
    riskLevel: null,
    process: "LOTO 표지판",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 배관작업
  {
    externalKey: "guide_real_017",
    title: "압력용기·배관 점검기준",
    body: [
      "용기 본체, 노즐, 맨홀, 부속물, 지지대 및 기초볼트 등은 손상·변형·균열이 없어야 한다.",
      "용접이음부, 노즐부 및 맨홀에는 누설 흔적이 없어야 하며, 압력을 받는 부위의 측정두께는 부식여유를 제외한 필요두께 이상이어야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_pv",
    workType: "배관작업",
    riskLevel: null,
    process: "압력용기/배관 점검",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_018",
    title: "배관 용접이음부 검사 절차",
    body: [
      "용접이음부는 육안검사로 균열이나 이상 유무를 확인해야 하며, 육안으로 판정이 곤란한 경우 액체침투탐상검사 또는 자분탐상검사를 실시한다.",
      "이상이 발견된 부위는 방사선투과검사 또는 초음파탐상검사로 추가 확인해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.kosha.or.kr/ebook/fcatalog/include/practice_detail.jsp?ccate=0205130000&sdir=437&cimg=",
    workType: "배관작업",
    riskLevel: null,
    process: "용접이음부 검사",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },

  // 일반작업
  {
    externalKey: "guide_real_019",
    title: "TBM(Tool Box Meeting) 표준 진행절차",
    body: [
      "고용노동부는 TBM을 '사전준비-실행-환류조치'의 3단계로 진행할 것을 권고하며, 통상 4~10명이 작업 직전 현장 근처에서 10분 내외로 진행한다.",
      "2023년 12월부터 TBM 실시는 산업안전보건법상 근로자 정기 안전보건교육 시간으로 인정된다."
    ].join(" "),
    source: "고용노동부",
    sourceUrl: "https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20230200455",
    workType: "일반작업",
    riskLevel: null,
    process: "TBM 진행절차",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(`[SEED_REAL_SAFETY_GUIDES] inserted/updated=${changed}, total=${REAL_GUIDES.length}`);
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
