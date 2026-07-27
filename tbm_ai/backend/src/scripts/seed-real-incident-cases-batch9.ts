import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_068",
    title: "이천 물류창고 신축공사 화재 (38명 사망)",
    body: [
      "2020년 4월 29일 경기 이천시 물류창고 신축공사 현장 지하에서 우레탄폼 작업과 화물엘리베이터 설치 용접작업이 동시에 진행되던 중, 우레탄폼 발포제에서 나온 유증기에 용접 불꽃이 튀어 폭발·화재가 발생해 38명이 사망했다.",
      "우레탄폼 작업과 화기(용접)작업은 화재·폭발 위험이 있어 동시에 수행하면 안 되며, 무리한 공사기간 단축을 위해 동시 작업을 강행해서는 안 된다. 시공 중인 건물은 소방시설이 완비되지 않아 피해가 커질 수 있으므로 화기작업 시 임시 소화설비와 화재감시자를 반드시 배치해야 한다."
    ].join(" "),
    source: "고용노동부/한국법학회(이천 물류창고 화재사고 정책연구)",
    sourceUrl: "https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE09369426",
    workType: "화기작업",
    riskLevel: "HIGH",
    process: "우레탄폼/용접 동시작업",
    weatherType: null,
    effectiveDate: "2020-04-29",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_069",
    title: "고압용기 재검사장 아세틸렌 폭발사고",
    body: [
      "2017년 1월 1일 부산 강서구의 고압용기 재검사장에서 작업자가 아세틸렌용기에 남은 잔가스를 벤트시키기 위해 실내에서 밸브를 열어 가스가 누출되었고, 원인미상의 점화원에 의해 폭발해 건물 지붕이 날아가고 공장 1개동이 파손되었다.",
      "아세틸렌은 공기보다 가벼워 실내에서 잔가스를 배출하면 상부에 체류·축적될 수 있으므로, 잔가스 처리는 반드시 환기가 원활한 실외에서 실시해야 한다."
    ].join(" "),
    source: "가스신문",
    sourceUrl: "https://www.gasnews.com/news/articleView.html?idxno=78421",
    workType: "화기작업",
    riskLevel: "HIGH",
    process: "아세틸렌 잔가스 처리",
    weatherType: null,
    effectiveDate: "2017-01-01",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_070",
    title: "조선소 컨테이너선 건조 중 아세틸렌 폭발사고",
    body: [
      "2024년 5월 13일 부산 사하구의 한 조선소에서 건조 중이던 3,000톤급 컨테이너 운반선 내부에서 아세틸렌 폭발사고가 발생해 2명이 사망했다.",
      "선박 블록 내부와 같은 밀폐·반밀폐 공간에서 가연성가스 용기를 사용할 때는 누출 여부를 상시 점검하고, 환기를 통해 가스가 축적되지 않도록 해야 한다."
    ].join(" "),
    source: "가스신문",
    sourceUrl: "https://www.gasnews.com/news/articleView.html?idxno=115514",
    workType: "화기작업",
    riskLevel: "HIGH",
    process: "선박 블록 내 아세틸렌 사용",
    weatherType: null,
    effectiveDate: "2024-05-13",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_071",
    title: "공장 아세틸렌 용기 폭발사고 (화성)",
    body: [
      "2024년 5월 30일 경기 화성시 공업단지 내 공장에서 아세틸렌 용기가 폭발해 화재가 발생했고, 현장에 있던 작업자가 3m가량 튕겨나가 중상을 입었다.",
      "아세틸렌은 공기 중 2.5~12.5%의 넓은 농도범위에서 폭발할 수 있는 매우 위험한 가스이므로, 용기는 전도방지 체인으로 고정하고 직사광선·고온을 피해 보관해야 한다."
    ].join(" "),
    source: "가스신문",
    sourceUrl: "https://www.gasnews.com/news/articleView.html?idxno=115514",
    workType: "화기작업",
    riskLevel: "HIGH",
    process: "아세틸렌 용기 보관",
    weatherType: null,
    effectiveDate: "2024-05-30",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_072",
    title: "건설용 리프트 해체 중 마스트 낙하 사망사고",
    body: [
      "2023년 5월 부산 광안동 업무시설 신축 현장에서 건설용 리프트 해체 작업 중 약 15층 높이에서 마스트가 낙하해, 현장 내부로 이동 중이던 협력업체 근로자를 강타해 사망시켰다.",
      "해체된 마스트를 운반구에 적재할 때 고정조치를 하지 않았고, 낙하물 위험구역에 출입금지 구역을 설정하지 않았으며 작업지휘자도 선임하지 않은 것이 원인으로 지적되었다. 리프트 설치·해체 작업 시에는 자재를 반드시 고정하고 위험구역 출입을 통제하며 작업지휘자를 배치해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/intro/easternGyeongbukBranch_A.do?mode=download&articleNo=417479&attachNo=235352",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "건설용 리프트 해체",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_073",
    title: "조선소 도크 내 포크레인 협착 사망사고",
    body: [
      "2021년 9월 현대중공업 8.9도크 사이에서 선박 고정용 로프 작업을 마치고 이동하던 선거용 포크레인이, 도크장에서 나오던 근로자를 발견하지 못하고 치어 사망시켰다.",
      "도크 내 중장비 이동 구간에서는 신호수를 배치하고 운전원의 시야가 제한되는 구간에는 후방카메라·경보장치를 설치해야 하며, 도보 이동자는 지정된 통로만 이용하도록 통제해야 한다."
    ].join(" "),
    source: "로이슈(lawissue)",
    sourceUrl: "https://www.lawissue.co.kr/view.php?ud=202109301710022959a8c8bf58f_12",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "조선소 도크 중장비 이동",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_074",
    title: "지하철역 인근 굴착공사 가스관 파손 누출사고",
    body: [
      "서울 지하철 교대역 인근에서 굴착기로 굴착작업을 하던 중 지하에 매설된 도시가스 배관을 파손시켜 가스가 누출되는 사고가 발생했으며, 공사업체가 의무사항인 사전 신고를 하지 않고 공사를 진행한 것으로 확인되었다.",
      "굴착공사원콜시스템(EOCS)이 전국으로 확대된 2008년 이후 발생한 타공사 사고 70건 중 64건이 도시가스 관련 사고였으며, 굴착 전에는 반드시 지하매설물 현황을 확인하고 사전 신고 절차를 거쳐야 한다."
    ].join(" "),
    source: "MBC뉴스",
    sourceUrl: "https://imnews.imbc.com/replay/2025/nwdesk/article/6731194_36799.html",
    workType: "굴착작업",
    riskLevel: "HIGH",
    process: "지하매설물 굴착",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_075",
    title: "기계식 주차장 리프트 오작동 추락사고",
    body: [
      "기계식 주차장에서 리프트가 오작동을 일으켜 정비·점검 작업을 하던 작업자가 추락해 사망하는 사고가 발생했다.",
      "기계식 주차설비 정비 작업 시에는 전원을 차단하고 리프트가 임의로 작동하지 않도록 잠금조치를 한 후 작업해야 하며, 정기적으로 오작동 여부와 안전장치 작동 상태를 점검해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6754",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "기계식 주차장 리프트",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH9] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH9] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
