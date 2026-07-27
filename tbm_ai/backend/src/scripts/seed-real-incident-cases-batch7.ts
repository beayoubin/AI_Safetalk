import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_057",
    title: "중조블럭 탑재작업 중 협착 사망사고",
    body: [
      "주판에 중조블럭을 탑재하던 중 상하로 조정하던 주판이 약 45cm가량 미끄러지면서, 취부작업을 위해 대기하던 작업자가 중조블럭과 옆 블록 사이에 가슴이 협착되어 사망했다.",
      "중량물 탑재 작업 시에는 대기 근로자를 이동 경로와 협착 위험구간 밖에 위치시키고, 설비 이동 전 신호 체계를 사전에 합의해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=3792",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "중조블럭 탑재",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_058",
    title: "화물차 후진 유도 중 협착 사망사고",
    body: [
      "작업장 내부에 일부 진입해 있던 화물차의 후진을 차량 측면에서 유도하던 작업자가, 후진하는 차량 후미와 작업장 내 기구물 사이에 신체가 끼여 사망했다.",
      "화물차 후진 유도 시에는 유도자가 차량과 고정 구조물 사이의 협착 위험구간에 위치하지 않도록 하고, 운전자와 유도자 간 신호를 사전에 명확히 정해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=742",
    workType: "중량물취급",
    riskLevel: "HIGH",
    process: "화물차 후진 유도",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_059",
    title: "고압세척기 누전 감전사고 (조림공정)",
    body: [
      "팥앙금 조림공정에서 조림이 끝난 진공교반기를 고압세척기로 세척하던 작업자가 세척기의 누전으로 감전되는 사고가 발생했다.",
      "대지전압 150V를 초과하는 이동형·휴대형 전기기계·기구에는 감전방지용 누전차단기(정격감도전류 30mA 이하, 동작시간 0.03초 이하)를 반드시 설치하고, 물기가 있는 장소에서는 사용 전 절연 상태를 점검해야 한다."
    ].join(" "),
    source: "KOSHA",
    sourceUrl:
      "https://oshri.kosha.or.kr/kosha/data/machine.do?mode=download&articleNo=269483&attachNo=144445",
    workType: "전기작업",
    riskLevel: "HIGH",
    process: "고압세척기 세척",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_060",
    title: "화물자동차 상차 작업 중 추락사고",
    body: [
      "제조업 현장에서 화물자동차 적재함 위에 올라가 상차 작업을 하던 근로자가 적재함에서 지면으로 추락하는 사고가 발생했다.",
      "적재함 위 작업 시에는 승강설비(발판·사다리)를 사용하고, 화물을 안정적으로 결박한 후 이동해야 하며 적재함 가장자리 작업 시 추락 위험을 항상 인지해야 한다."
    ].join(" "),
    source: "안전보건공단(이safetykorea)",
    sourceUrl:
      "https://esafetykorea.or.kr/main/supportCenter/innerBoard?board_no=1229&board_type=repository",
    workType: "중량물취급",
    riskLevel: "MEDIUM",
    process: "화물자동차 상차",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH7] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH7] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
