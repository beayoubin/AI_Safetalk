import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_043",
    title: "발전소 컨베이어벨트 아이들러 협착 사망사고",
    body: [
      "2018년 12월 10일 야간, 발전소에서 컨베이어벨트 및 아이들러 점검·탄 처리작업을 하던 중 벨트와 아이들러 사이 물림점에 신체가 협착되어 사망했다.",
      "가동 중인 컨베이어 하부의 퇴적물 청소나 점검 작업은 반드시 설비를 정지시키고 실시해야 하며, 최근 10년간 협착사고의 주요 기인설비는 컨베이어·전단기·프레스·성형기로 나타났다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://kosha.or.kr/kosha/data/regionalCase.do?mode=download&articleNo=409976&attachNo=230935",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "컨베이어/아이들러 점검",
    weatherType: null,
    effectiveDate: "2018-12-10",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_044",
    title: "프레스 금형 스위치 오조작 협착사고",
    body: [
      "프레스 작동 상태 확인 중 취출장치 에러가 발생해 이를 점검하던 작업자의 신체가 하부금형 센서에 감지되어, 하강하는 금형 사이에 협착되는 사고가 발생했다.",
      "연동장치(인터록) 기능을 해지한 채 금형에 접근해 수리·정비하면 안 되며, 정비·청소·급유·검사·수리 작업 시에는 반드시 프레스의 전원을 차단한 후 실시해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://oshri.kosha.or.kr/kosha/data/machine.do?mode=view&articleNo=268451",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "프레스 금형 점검",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_045",
    title: "이동식비계 위 작업 중 추락사고",
    body: [
      "이동식비계 위에서 작업하던 근로자가 균형을 잃고 지면으로 추락하는 사고가 발생했다.",
      "이동식비계는 사용 전 바퀴 브레이크를 고정하고, 작업발판에는 안전난간을 설치하며, 이동 중에는 작업자를 태운 채 이동시키지 않아야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/intro/seoulHeadquarters_B.do?mode=download&articleNo=195384&attachNo=240256",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "이동식비계 작업",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_046",
    title: "물류창고 신축공사 거푸집동바리 붕괴사고",
    body: [
      "2022년 12월 경기도 소재 물류창고 신축공사 현장에서 근로자 4명이 지상 4층 바닥 콘크리트 타설 작업을 하던 중 시스템동바리와 데크플레이트가 붕괴되어 약 10m 아래로 추락했다.",
      "사고 현장은 슬래브 하부에 동바리가 설치되지 않았고 시스템동바리의 가새재가 누락된 상태로 타설이 진행된 것으로 조사되었다. 조립상세도를 작성하고 동바리 구조계산을 실시하며, 콘크리트는 한 곳에 집중 타설하지 않고 정해진 순서를 준수해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/confirmation_e.do?mode=download&articleNo=343321&attachNo=190090",
    workType: "건설작업",
    riskLevel: "HIGH",
    process: "거푸집동바리/콘크리트 타설",
    weatherType: null,
    effectiveDate: "2022-12-01",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_047",
    title: "타워크레인 텔레스코핑 작업 중 마스트 전도사고",
    body: [
      "2017년 5월 22일 경기도 남양주시 아파트 신축공사 현장에서 타워크레인 텔레스코핑(마스트 상승) 작업 중 마스트가 전도되어 3명이 사망하고 2명이 부상했다.",
      "타워크레인 설치·해체·상승(텔레스코핑) 작업 전에는 유압장치, 고정핀, 마스트 연결 볼트 상태를 반드시 점검해야 하며, 작업 중에는 무선통신으로 신호수와 운전원 간 의사소통을 확실히 해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/confirmation_e.do?mode=download&articleNo=343342&attachNo=190112",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "타워크레인 텔레스코핑",
    weatherType: null,
    effectiveDate: "2017-05-22",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_048",
    title: "전기판넬 조작 중 활선 감전 사망사고",
    body: [
      "상수도 공사 현장에서 전기판넬을 조작하던 작업자가 활선 상태의 도체에 접촉해 감전으로 사망했다.",
      "사고 당시 습도가 높은 환경에서 땀을 흘리며 작업해 인체 저항이 감소한 것이 원인 중 하나로 지목되었으며, 활선작업 전에는 반드시 정전 여부를 확인하고 절연용 보호구를 착용해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/intro/chungnamBranch_A.do?mode=download&articleNo=425193&attachNo=240144",
    workType: "전기작업",
    riskLevel: "HIGH",
    process: "전기판넬 조작(활선)",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_049",
    title: "맨홀 오수관로 측량 작업 중 질식사고",
    body: [
      "맨홀 내부에서 오수관로 측량 작업을 하던 근로자가 의식을 잃고 쓰러져 병원으로 옮겨졌으나 유해가스에 의한 질식으로 사망했다.",
      "지하 맨홀은 공기 흐름이 제한되어 황화수소, 메탄, 암모니아 등 유해가스가 축적되기 쉬우며, 최근 10년간(2015~2024) 밀폐공간 질식 재해자 298명 중 126명(42%)이 사망할 만큼 치명적이다. 진입 전 산소농도와 유해가스 농도를 반드시 측정해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=7037",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "맨홀/오수관로 작업",
    weatherType: null,
    effectiveDate: "2025-07-06",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_050",
    title: "고소작업차 붐 프레임 파손 전도 추락사고",
    body: [
      "건물 외벽 도장 작업 중 높이 28m 지점을 도장하기 위해 고소작업차(차량 탑재형) 작업대를 벽에서 약 15cm 이격시켜 옮기던 순간, 차체 프레임이 작업하중을 견디지 못하고 파손되며 붐이 넘어져 탑승자 2명이 지상으로 추락했다.",
      "장기간 반복 사용에 따른 피로하중으로 프레임과 연결부 볼트의 강도가 저하된 것이 원인으로 추정되며, 작업 전 차체·붐·작업대 각 부위의 이상 유무를 점검하고 작업지휘자를 배치해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.kosha.or.kr/kosha/data/construction.do?mode=download&articleNo=453778&attachNo=260018",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "고소작업차(차량탑재형)",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH5] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH5] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
