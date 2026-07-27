import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_GUIDES: RagDocumentInput[] = [
  {
    externalKey: "guide_real_066",
    title: "우레탄폼-화기작업 동시수행 금지",
    body: [
      "우레탄폼 발포 작업과 용접 등 화기작업을 동시에 진행하면, 발포제에서 발생하는 유증기에 용접 불꽃이 튀어 대형 화재·폭발로 이어질 수 있다.",
      "두 작업은 반드시 시간을 분리해서 실시하고, 부득이하게 인접 구역에서 진행할 경우 방화포로 차폐하고 화재감시자를 배치하며 공사기간 단축을 이유로 동시작업을 강행해서는 안 된다."
    ].join(" "),
    source: "고용노동부/한국법학회",
    sourceUrl: "https://www.dbpia.co.kr/journal/articleDetail?nodeId=NODE09369426",
    workType: "화기작업",
    riskLevel: null,
    process: "우레탄폼/화기작업",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_067",
    title: "목재가공용 둥근톱 안전기준",
    body: [
      "둥근톱·띠톱에는 절단에 필요한 부위 외 신체접촉을 방지하는 방호덮개를 설치하고, 가공물은 바이스 등 고정기구로 고정해야 하며 불가피하게 손으로 고정할 경우 절단날에 접촉되지 않는 위치를 잡아야 한다.",
      "둥근톱 재단작업 중 손가락 접촉이나 장갑말림에 의한 베임·절단, 가공물 반발에 의한 손가락·얼굴 가격 사고가 반복되므로 장갑 착용 시 말림 위험을 항상 인지해야 한다."
    ].join(" "),
    source: "KOSHA GUIDE M-179-2014",
    sourceUrl:
      "https://oshri.kosha.or.kr/extappKosha/kosha/guidance/fileDownload.do?sfhlhTchnlgyManualNo=M-179-2014&fileOrdrNo=3",
    workType: "기계정비",
    riskLevel: null,
    process: "둥근톱 목재가공",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_068",
    title: "아세틸렌가스 취급 안전수칙",
    body: [
      "아세틸렌은 공기 중 2.5~12.5%의 매우 넓은 농도범위에서 폭발할 수 있는 위험한 가스이며, 공기보다 가벼워 실내에서 배출하면 상부에 체류·축적될 수 있으므로 잔가스 처리는 반드시 환기가 원활한 실외에서 실시해야 한다.",
      "용기는 전도방지 체인으로 고정하고 직사광선과 고온을 피해 보관해야 하며, 밀폐·반밀폐 공간에서 사용할 때는 누출 여부를 상시 점검해야 한다."
    ].join(" "),
    source: "가스신문",
    sourceUrl: "https://www.gasnews.com/news/articleView.html?idxno=78421",
    workType: "화기작업",
    riskLevel: null,
    process: "아세틸렌가스 취급",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_069",
    title: "건설용 리프트 설치·해체 안전수칙",
    body: [
      "최근 10년간 리프트 사용 중 중대재해는 추락으로 인한 사망이 11명(68.8%), 끼임으로 인한 사망이 5명(31.2%)으로 나타났으며, 설치·해체 중 발생한 중대재해도 다수 보고되었다.",
      "해체된 마스트 등 자재는 운반구에 반드시 고정하고, 낙하물 위험구역에는 출입금지 구역을 설정하며 작업지휘자를 선임해 해체 작업자 외의 출입을 통제해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/intro/easternGyeongbukBranch_A.do?mode=download&articleNo=417479&attachNo=235352",
    workType: "건설작업",
    riskLevel: null,
    process: "건설용 리프트 설치/해체",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_070",
    title: "지하매설물 굴착 전 사전확인 절차",
    body: [
      "굴착공사원콜시스템(EOCS)이 전국으로 확대된 2008년 이후 발생한 타공사 사고 70건 중 64건이 도시가스 관련 사고로, 대부분 사전 신고 없이 굴착을 진행하다 발생했다.",
      "굴착 전에는 반드시 지하매설물(가스관·상하수도관 등) 현황을 확인하고 관련 기관에 사전 신고 절차를 거쳐야 하며, 매설물 손상 시 가스 폭발이나 지반 붕괴로 이어질 수 있음을 인지해야 한다."
    ].join(" "),
    source: "MBC뉴스",
    sourceUrl: "https://imnews.imbc.com/replay/2025/nwdesk/article/6731194_36799.html",
    workType: "굴착작업",
    riskLevel: null,
    process: "지하매설물 사전확인",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_071",
    title: "크레인 과부하방지장치·훅해지장치·권과방지장치",
    body: [
      "크레인에는 정격하중 초과를 막는 과부하방지장치(제134조)와, 훅 걸이용 와이어로프가 훅에서 벗겨지는 것을 방지하는 훅해지장치(제137조)를 설치하고 정상 작동 여부를 확인해야 한다.",
      "권과방지장치를 설치하지 않은 크레인은 권상용 와이어로프에 위험표시를 하고 경보장치를 설치하는 등 대체 조치를 해야 한다."
    ].join(" "),
    source: "크레인제작기준·안전기준및검사기준(고용노동부 고시)",
    sourceUrl: "https://www.law.go.kr/LSW/admRulInfoP.do?admRulSeq=2366",
    workType: "중량물취급",
    riskLevel: null,
    process: "크레인 방호장치",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_072",
    title: "용접 아크 자외선 눈 보호(전광성안염 예방)",
    body: [
      "용접 아크의 강한 빛은 눈 건강에 해로우며, 적절한 눈 보호 없이 노출되면 자외선에 의한 전광성안염(각막염)이 발생해 눈물과 통증으로 며칠간 눈을 뜨기 어려운 상태가 될 수 있다.",
      "용접작업자는 반드시 적정 차광도의 용접용 보안면을 착용해야 하며, 보안면은 지지대와 필터를 통해 눈과 얼굴을 보호하도록 KOSHA 기준에 따른 자외선 투과율 규격을 충족해야 한다."
    ].join(" "),
    source: "서울대학교(아크용접 자외선 노출 연구)/KOSHA",
    sourceUrl: "https://s-space.snu.ac.kr/handle/10371/41109",
    workType: "화기작업",
    riskLevel: null,
    process: "용접 아크 눈 보호",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "guide_real_073",
    title: "조선업 도크 내 중장비 이동 안전수칙",
    body: [
      "조선업 도크 작업장은 중장비와 도보 이동자가 혼재하는 구역이 많아 신호수 배치 미흡, 운전원 시야 확보 부족이 주된 협착·충돌사고 원인으로 지적된다.",
      "도크 내 중장비 이동 구간에는 신호수를 배치하고, 운전원의 시야가 제한되는 구간에는 후방카메라·경보장치를 설치하며 도보 이동자는 지정된 통로만 이용하도록 통제해야 한다."
    ].join(" "),
    source: "KOSHA(조선업 중대재해 사례집)",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/shipbuildingb_f.do?mode=download&articleNo=234887&attachNo=112882",
    workType: "중량물취급",
    riskLevel: null,
    process: "조선업 도크 안전",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_GUIDES);
  console.log(
    `[SEED_REAL_SAFETY_GUIDES_BATCH8] inserted/updated=${changed}, total=${REAL_GUIDES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_SAFETY_GUIDES_BATCH8] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
