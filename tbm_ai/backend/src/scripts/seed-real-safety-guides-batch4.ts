import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_036",
    title: "협착 다발 설비(컨베이어·프레스·전단기) 안전수칙",
    body: [
      "최근 10년간 협착사고의 주요 기인설비는 컨베이어, 전단기, 프레스, 성형기로 나타났으며, 가동 중인 설비에서 점검·수리 등을 시도하다 끼임 사고가 반복적으로 발생한다.",
      "프레스·전단기는 왕복운동을 하는 동작부분과 고정부분 사이에서 협착이 발생하므로, 정비·청소·급유·검사·수리 시에는 반드시 전원을 차단하고 방호장치를 정상 작동 상태로 유지해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl: "https://oshri.kosha.or.kr/kosha/data/machine.do?mode=view&articleNo=268451",
    workType: "기계정비",
    riskLevel: null,
    process: "협착 다발설비 안전",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_037",
    title: "강관비계 설치 및 안전지침 (KOSHA GUIDE C-30)",
    body: [
      "강관비계 설치 시 비계기둥과 구조물 사이의 틈 간격은 추락 방지를 위해 가급적 30cm 이하로 조립해야 하며, 틈 간격이 발생하는 구간에는 방망을 설치해야 한다.",
      "비계 해체 작업 시에는 안전모와 안전대를 지급·착용하도록 하고, 작업자가 안전대 부착설비에 고리를 체결했는지 관리감독을 철저히 해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE C-30",
    sourceUrl:
      "https://esafetykorea.or.kr/main/supportCenter/innerBoard?board_no=1918&board_type=repository",
    workType: "고소작업",
    riskLevel: null,
    process: "강관비계 설치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_038",
    title: "거푸집동바리 붕괴 예방대책",
    body: [
      "거푸집동바리 붕괴의 시공상 원인으로는 조립상세도 미작성, 콘크리트 한 곳 집중타설 및 타설순서 미준수, 파이프서포트 2본 이상 이어쓰기, 미검정품 사용에 따른 재료 불량 등이 있다.",
      "구조적 원인으로는 동바리 구조계산 미실시, 경사지·곡면 거푸집에서 수직재 밀착 불량으로 인한 편심하중 발생이 있으므로, 타설 전 조립상세도 작성과 구조계산을 반드시 실시해야 한다."
    ].join(" "),
    source: "KOSHA(산업안전보건연구원)",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/confirmation_e.do?mode=download&articleNo=343321&attachNo=190090",
    workType: "건설작업",
    riskLevel: null,
    process: "거푸집동바리",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_039",
    title: "밀폐공간 질식재해 현황 및 예방",
    body: [
      "2015~2024년 국내 산업현장에서 발생한 밀폐공간 질식 사고로 298명이 재해를 입었고, 이 중 126명(약 42%)이 사망할 만큼 치명적인 재해 유형이다.",
      "지하 밀폐공간은 공기 흐름이 제한돼 산소결핍이나 황화수소·메탄·암모니아 등 유해가스 축적 가능성이 높으며, 여름철에는 유기물 부패 속도가 빨라져 위험이 더 커지므로 진입 전 산소농도·유해가스 농도 측정이 필수다."
    ].join(" "),
    source: "포인트경제(산업재해 통계)",
    sourceUrl: "http://www.chemicalnews.co.kr/news/articleView.html?idxno=2605",
    workType: "밀폐공간",
    riskLevel: null,
    process: "밀폐공간 질식 통계",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_040",
    title: "고소작업차(차량탑재형) 작업 전 점검사항",
    body: [
      "고소작업차 사용 작업 시에는 작업지휘자를 배치하고 수립된 작업계획을 준수해야 한다.",
      "작업 전 차체, 붐, 작업대 등 각 부위의 이상 유무를 확인하고, 장기간 반복 사용으로 인한 피로하중 손상 여부를 점검하며 필요 시 보수·보강 후 작업해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://www.kosha.or.kr/kosha/data/construction.do?mode=download&articleNo=453778&attachNo=260018",
    workType: "고소작업",
    riskLevel: null,
    process: "고소작업차 점검",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_041",
    title: "분진폭발 5대 조건 및 예방대책",
    body: [
      "분진폭발이 발생하려면 가연성 분진, 점화원, 산소, 분진운(부유 상태), 밀폐 공간이라는 5가지 조건이 동시에 충족되어야 한다.",
      "파쇄·분쇄 설비에 금속 조각이나 돌조각이 섞여 들어가면 마찰·충격에 의한 불꽃이 발생해 점화원이 될 수 있으므로, 금속검출기·자력선별기·공기압 이물질 분리장치를 설치해 이물질을 제거해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/oshri/professionalBusiness/dangerEvaluationReport.do?mode=download&articleNo=406722&attachNo=234475",
    workType: "화학물질작업",
    riskLevel: null,
    process: "분진폭발 예방",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH4] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH4] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
