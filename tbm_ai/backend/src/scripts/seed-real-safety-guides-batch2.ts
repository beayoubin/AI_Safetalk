import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_020",
    title: "화재감시자 배치기준",
    body: [
      "용접·절단 작업에서 발생하는 불티는 1,600℃가 넘는 고온물로, 풍향과 풍속에 따라 비산 거리가 달라진다.",
      "작업반경 11m는 화재감시자 배치 여부를 판단하는 주요 기준 중 하나이며, 화재감시자는 소화기·소화수를 준비하고 제거하기 어려운 가연물은 방염포 등으로 덮어야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=235017&attachNo=113021",
    workType: "화기작업",
    riskLevel: null,
    process: "화재감시자",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_021",
    title: "개구부 추락 방호조치",
    body: [
      "사업주는 작업발판 및 통로의 끝이나 개구부로서 근로자가 추락할 위험이 있는 장소에는 안전난간, 수직형 추락방망, 덮개 등을 설치해야 한다.",
      "난간 설치가 곤란하거나 작업상 임시로 난간을 해체해야 하는 경우에는 근로자에게 안전대를 착용시켜야 한다."
    ].join(" "),
    source: "법제처(산업안전보건기준에 관한 규칙)",
    sourceUrl: "https://www.law.go.kr/LSW//lsInfoP.do?lsId=007363&ancYnChk=0",
    workType: "고소작업",
    riskLevel: null,
    process: "개구부 방호",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_022",
    title: "안전대 부착설비 설치 의무",
    body: [
      "추락 위험이 있는 높이 2m 이상 장소에서 근로자에게 안전대를 착용시킨 경우, 사업주는 안전대를 안전하게 걸어 사용할 수 있는 부착설비를 설치해야 한다."
    ].join(" "),
    source: "법제처(산업안전보건기준에 관한 규칙)",
    sourceUrl: "https://www.law.go.kr/LSW//lsInfoP.do?lsId=007363&ancYnChk=0",
    workType: "고소작업",
    riskLevel: null,
    process: "안전대 부착설비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_023",
    title: "접지설비 기술지침",
    body: [
      "KOSHA GUIDE E-92는 접지설비의 계획 및 유지관리에 관한 기술지침을, E-102는 저압용 전기설비의 접지설비 선정 및 설치에 관한 기술지침을 규정한다.",
      "전기작업 시에는 이 지침에 따라 접지설비를 계획·설치하고 주기적으로 유지관리해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE E-92/E-102",
    sourceUrl:
      "http://www.myungjielec.com/26/?q=YToyOntzOjEyOiJrZXl3b3JkX3R5cGUiO3M6MzoiYWxsIjtzOjQ6InBhZ2UiO2k6MTt9&bmode=view&idx=1811630&t=board",
    workType: "전기작업",
    riskLevel: null,
    process: "접지설비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_024",
    title: "와이어로프 폐기기준",
    body: [
      "와이어로프는 시간 기준(사용환경·빈도에 따른 예방적 교체)과 상태 기준(손상이 폐기기준에 도달하면 즉시 교체)을 함께 적용하며, 두 기준 중 더 엄격한 쪽을 우선 적용해야 한다.",
      "산업안전보건기준에 따라 소선이 공칭지름의 7~10% 이상 마모되거나 손상·변형된 경우 즉시 교체해야 한다."
    ].join(" "),
    source: "KOSHA/산업안전보건기준에 관한 규칙",
    sourceUrl: "https://www.dgcrane.com/ko/posts/inspection-and-discard-criteria-of-wire-ropes/",
    workType: "중량물취급",
    riskLevel: null,
    process: "와이어로프 점검/교체",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_025",
    title: "굴착면 기울기 기준",
    body: [
      "산업안전보건기준에 관한 규칙 제338조~347조는 지반을 모래, 연암 및 풍화암, 경암, 그 밖의 흙 4가지로 구분해 굴착면 기울기 기준을 규정한다.",
      "기울기는 세로 길이를 1로 두었을 때 가로 길이의 비율(세로:가로)로 표기하며, 지반 종류에 따라 안전한 기울기가 달라진다."
    ].join(" "),
    source: "법제처(산업안전보건기준에 관한 규칙)",
    sourceUrl: "https://www.law.go.kr/LSW//lsInfoP.do?lsId=007363&ancYnChk=0",
    workType: "굴착작업",
    riskLevel: null,
    process: "굴착면 기울기",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_026",
    title: "국소배기장치 설치 및 검사 기준",
    body: [
      "국소배기장치는 후드, 덕트, 공기정화장치, 배풍기, 배출구로 구성되어 유해물질을 발생원에서 포집·제거·배출하는 설비다.",
      "유해물질(49종 대상) 예방을 위해 설치된 국소배기장치는 설치 후 3년 이내 최초 안전검사를 받아야 하고, 이후 2년마다 정기 안전검사를 받아야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "http://miis.kosha.or.kr/webm/nav.do?jspName=KDMS_001_lev",
    workType: "화학물질작업",
    riskLevel: null,
    process: "국소배기장치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_027",
    title: "방호장치 안전인증 및 인터록",
    body: [
      "위험기계·기구의 방호장치와 근로자가 착용하는 보호구는 제조단계부터 안전인증을 거쳐야 한다.",
      "회전체 등 위험부위는 작업자 신체 접촉이 감지되면 자동으로 정지하는 인터록 방호장치를 설치해 협착·끼임을 예방해야 한다."
    ].join(" "),
    source: "KOSHA(산업안전보건인증원)",
    sourceUrl: "https://miis.kosha.or.kr/oshci/busi/viewSafetyInfo.do",
    workType: "기계정비",
    riskLevel: null,
    process: "방호장치 인터록",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_028",
    title: "폭염 온열질환 예방 3대 기본수칙",
    body: [
      "온열질환 예방 3대 기본수칙은 실외 작업장에서는 '물·그늘·휴식', 실내 작업장에서는 '물·바람·휴식'이다.",
      "체감온도 31도를 넘으면 매시간 10분 이상 휴식을 제공하고, 14~17시 사이 옥외작업을 단축하거나 중지해야 하며, 근로자가 온열질환 우려로 작업중지를 요청하면 즉시 조치해야 한다."
    ].join(" "),
    source: "고용노동부",
    sourceUrl: "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=16576",
    workType: "일반작업",
    riskLevel: null,
    process: "폭염 대응",
    weatherType: "폭염",
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_029",
    title: "한랭질환 예방수칙",
    body: [
      "겨울철 한파 대비 한랭질환 예방 3대 수칙은 '따뜻한 물, 따뜻한 옷, 따뜻한 장소'다.",
      "한랭질환은 건설업 등 옥외작업이 많은 업종에서 주로 발생하므로, 한파특보 시 옥외작업 근로자에 대한 예방수칙 이행 여부를 특히 점검해야 한다."
    ].join(" "),
    source: "고용노동부",
    sourceUrl: "https://www.moel.go.kr/policy/policydata/view.do?bbs_seq=20241200059",
    workType: "일반작업",
    riskLevel: null,
    process: "한파 대응",
    weatherType: "한파",
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_030",
    title: "위험성평가 실시 절차",
    body: [
      "사업주는 산업안전보건법에 따라 위험성평가를 실시할 의무가 있으며, 절차는 사전준비 → 유해·위험요인 파악 → 위험성 결정 → 감소대책 수립 및 실행 → 공유 → 기록·보존의 6단계로 진행된다.",
      "위험성평가는 최초·수시·정기로 구분되며, 정기평가는 최초평가 이후 매년 실시해야 하고 근로자를 평가 과정에 참여시켜야 한다."
    ].join(" "),
    source: "고용노동부(사업장 위험성평가에 관한 지침)",
    sourceUrl: "https://www.law.go.kr/LSW//admRulInfoP.do?admRulSeq=2100000251014&chrClsCd=010201",
    workType: "일반작업",
    riskLevel: null,
    process: "위험성평가",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH2] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH2] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
