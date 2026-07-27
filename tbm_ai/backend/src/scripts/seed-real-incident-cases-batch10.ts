import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_076",
    title: "폐수 탱크로리 이송작업 중 이물질 혼입 폭발사고",
    body: [
      "인천의 한 사업장에서 폐수를 탱크로리로 이송하는 작업 중, 과산화수소 폐수에 가성소다가 오염·혼입되면서 반응열로 폭발이 발생해 1명이 사망하고 7명이 부상당했다.",
      "서로 반응성이 있는 폐액은 절대 혼합 이송하지 않아야 하며, 이송 전 배관·탱크로리 내부에 이종 화학물질이 잔류하지 않았는지 반드시 확인해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=418295&attachNo=235704",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "폐수 탱크로리 이송",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_077",
    title: "폐유기용제 중화조 화재·폭발 사고 (KOSHA-MIA-201702)",
    body: [
      "2002년 3월 26일 폐유기용제를 소석회(수산화칼슘)로 중화 처리하는 중화조에서 화재·폭발이 발생해 증류공정, 창고, 사무실이 전소되고 작업자 3명이 화상을 입었다.",
      "중화 반응은 발열반응이므로 처리량과 투입 속도를 통제해 반응열이 급격히 상승하지 않도록 관리하고, 중화조 주변에는 인화성 물질을 두지 않아야 한다."
    ].join(" "),
    source: "KOSHA-MIA-201702",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=235083&attachNo=113083",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "폐유기용제 중화조",
    weatherType: null,
    effectiveDate: "2002-03-26",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_078",
    title: "반응기 세정작업 중 화재·폭발 사고 (KOSHA-MIA-202101)",
    body: [
      "반응기 맨홀을 열고 플라스틱 바가지로 DMF(디메틸포름아미드) 용제를 내벽에 뿌려 세정하던 중 화재·폭발이 발생했다.",
      "인화성 용제로 반응기 내벽을 세정할 때는 맨홀을 개방한 상태에서 수작업으로 뿌리지 말고, 반응기 내부에 스프레이볼을 설치해 맨홀을 열지 않고 세정할 수 있도록 설비를 변경해야 한다."
    ].join(" "),
    source: "KOSHA-MIA-202101",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/screening_e.do?mode=download&articleNo=419454&attachNo=236653",
    workType: "화학물질작업",
    riskLevel: "HIGH",
    process: "반응기 세정",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_079",
    title: "크레인 원형코일 하역 중 협착 사망사고",
    body: [
      "작업장에서 원형코일 12개를 크레인 보조달기구(C형)에 걸어 권상하던 중 과부하방지장치가 작동해 권상이 정지되었고, 코일을 적재대에 내려놓는 순간 보조 달기기구에서 코일 2개가 전도되면서 작업자가 협착되어 사망했다.",
      "과부하방지장치가 작동했다는 것은 정격하중을 초과했다는 의미이므로, 즉시 하물의 수량이나 중량을 재산정하고 적정 하중으로 재작업해야 하며 코일 하역 시에는 전도 방지용 받침대를 사용해야 한다."
    ].join(" "),
    source: "울산제일일보",
    sourceUrl: "http://www.ujeil.com/news/articleView.html?idxno=9546",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "크레인 코일 하역",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_080",
    title: "천장크레인 H형강 줄걸이 이탈 낙하 사망사고",
    body: [
      "자체 제작한 줄걸이 훅을 사용해 천장크레인으로 H형강(H-beam)을 차량에 싣던 중, 권상 중이던 H형강이 이미 상차된 H형강과 충돌하면서 줄걸이 훅에서 이탈·낙하해 작업자가 사망했다.",
      "줄걸이 기구는 반드시 검정된 정품을 사용해야 하며, 자체 제작한 훅이나 규격 미달 기구를 사용해서는 안 되고 인양 시 다른 적재물과의 충돌 여유거리를 확보해야 한다."
    ].join(" "),
    source: "울산제일일보",
    sourceUrl: "http://www.ujeil.com/news/articleView.html?idxno=9546",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "크레인 H형강 줄걸이",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_081",
    title: "톤백 골재 인양 중 운반끈 파열 낙하사고",
    body: [
      "골재투입구 작업대에서 골재를 담은 1.4톤 톤백을 천장크레인으로 권상한 후 하부 매듭을 풀고 골재를 투입하는 과정에서 톤백의 운반끈이 파열되어 골재가 떨어지는 사망 재해가 발생했다.",
      "톤백은 표시된 최대 적재중량을 초과해 사용하지 않아야 하며, 사용 전 운반끈의 마모·손상 여부를 육안으로 점검하고 손상이 확인되면 즉시 폐기해야 한다."
    ].join(" "),
    source: "울산제일일보",
    sourceUrl: "http://www.ujeil.com/news/articleView.html?idxno=9546",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "톤백 골재 인양",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_082",
    title: "태양광 인버터 패널 감전사고",
    body: [
      "대규모 태양광 발전시설의 인버터 패널을 수리하던 작업자가 차단기를 내리고 손상된 콘덴서를 철거한 후, 신품 콘덴서를 설치하기 위해 패널에 손을 뻗는 순간 감전사고를 당했다.",
      "태양광 모듈은 햇빛을 받으면 차단기를 내려도 모듈 자체에서 인버터 방향으로 전력이 생산·유입될 수 있어 상시 활선 상태로 간주해야 하며, 정비 전 검전기로 잔류전압 유무를 반드시 확인해야 한다."
    ].join(" "),
    source: "전기신문",
    sourceUrl: "https://www.electimes.com/news/articleView.html?idxno=221038",
    workType: "전기작업",
    riskLevel: "HIGH",
    process: "태양광 인버터 정비",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_083",
    title: "아파트 정화조 준설작업 중 질식 사망사고",
    body: [
      "2025년 4월 24일 아파트 정화조 준설작업 중 작업자가 유해가스에 질식해 사망했다.",
      "최근 5년간 밀폐공간 질식 사망사고 14건 중 12건(85.7%)이 산소·유해가스 농도를 측정하지 않고 작업을 시작했으며, 10건(71.4%)은 보호구를 제공하지 않았고 9건(64.2%)은 감시인을 배치하지 않았다. 정화조 등 밀폐공간 작업 전에는 반드시 농도측정, 보호구 지급, 감시인 배치를 이행해야 한다."
    ].join(" "),
    source: "YouTube(중대재해사고사례)",
    sourceUrl: "https://www.youtube.com/watch?v=gFHr2HJ-S-8",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "정화조 준설",
    weatherType: null,
    effectiveDate: "2025-04-24",
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH10] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH10] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
