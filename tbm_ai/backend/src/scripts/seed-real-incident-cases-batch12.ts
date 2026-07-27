import "dotenv/config";
import { dbPool } from "../../config/database";
import {
  ensureRagDocumentTable,
  upsertRagDocuments,
  type RagDocumentInput
} from "../repositories/rag-document.repository";

const REAL_CASES: RagDocumentInput[] = [
  {
    externalKey: "kosha_real_092",
    title: "지붕 제설작업 중 미끄러짐 추락사고",
    body: [
      "강원도의 한 공사 현장에서 근로자가 지붕 위 제설 작업 중 미끄러지며 5m 아래로 추락해 다리 골절과 척추 손상을 입었다.",
      "사고 원인은 작업 전 안전 점검 미흡과 추락 방지 장비 미사용이었으며, 결빙·적설 상태의 지붕에서 작업할 때는 미끄럼 방지화를 착용하고 안전대 부착설비를 사전에 설치해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=6405",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "지붕 제설작업",
    weatherType: "한파",
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_093",
    title: "제지공장 보일러 수관 교체 중 스팀 역류 화상사고",
    body: [
      "2018년 6월 경남 양산시의 제지공장에서 보일러 수관 교체 작업 중 배관 사이에 맹판(차단용 덮개판)을 설치하지 않고 확관작업을 진행하다가, 상부드럼에서 고온의 스팀과 물이 역류해 근로자 1명이 사망하고 1명이 3도 화상을 입었다.",
      "배관·보일러 정비 작업 시에는 반드시 맹판을 설치해 잔류 압력이나 유체의 역류를 차단하고, 작업 전 관련 밸브가 완전히 잠겨 있는지 확인해야 한다."
    ].join(" "),
    source: "리걸타임즈",
    sourceUrl: "https://www.legaltimes.co.kr/news/articleView.html?idxno=49543",
    workType: "기계정비",
    riskLevel: "HIGH",
    process: "보일러 수관 교체",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_094",
    title: "화장품 공장 물탱크 청소 중 스팀 역류 화상 사망사고",
    body: [
      "화장품 생산공장에서 물탱크 내부 청소작업을 하던 근로자가, 보일러에 물을 공급하는 배관의 열교환기에서 고온의 수증기가 역류해 물탱크 내부로 유입되면서 전신화상을 입고 사망했다.",
      "밀폐된 탱크 내부에서 작업할 때는 연결된 배관·열교환기의 밸브를 완전히 차단하고 잠금표시(LOTO)를 실시한 후, 잔류 증기나 온수가 없는지 확인하고 진입해야 한다."
    ].join(" "),
    source: "안전저널",
    sourceUrl: "https://www.anjunj.com/news/articleView.html?idxno=16859",
    workType: "밀폐공간",
    riskLevel: "HIGH",
    process: "물탱크 청소/스팀배관",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_095",
    title: "중학교 신축공사 지붕 유리패널 설치 중 추락사고",
    body: [
      "2019년 9월 16일 충남 청양군의 중학교 신축공사 현장에서 교사동 지붕재(유리패널, 장당 135kg) 설치 작업을 하던 작업자가, 유리가 시공되지 않은 개구부(1.3m×1.7m)에 발을 헛디뎌 약 9.5m 아래 콘크리트 바닥으로 추락해 사망했다.",
      "지붕재 설치 작업 중에는 시공이 완료되지 않은 개구부에 반드시 임시 덮개나 방망을 설치하고, 작업자는 안전대를 구조물에 체결한 상태로 이동해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=1602",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "지붕 유리패널 설치",
    weatherType: null,
    effectiveDate: "2019-09-16",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_096",
    title: "자동창고 지붕 패널보수공사 중 개구부 추락사고",
    body: [
      "2019년 9월 27일 충남 서산시의 자동창고 지붕·외부 패널보수공사 중, 지붕에서 패널(1,200cm×100cm×7.5cm)을 고정하던 작업자가 시공되지 않은 개구부를 통해 약 12m 아래 창고 내부로 추락했다.",
      "대형 패널 취급 작업은 진공흡착기 등 인양장비의 흡착 상태를 작업 전 점검하고, 개구부가 있는 지붕에서는 작업 전 방호덮개나 안전방망을 반드시 설치해야 한다."
    ].join(" "),
    source: "세이프티퍼스트닷뉴스",
    sourceUrl: "https://www.safety1st.news/news/articleView.html?idxno=1602",
    workType: "고소작업",
    riskLevel: "HIGH",
    process: "지붕 패널보수",
    weatherType: null,
    effectiveDate: "2019-09-27",
    activeYn: "Y"
  },
  {
    externalKey: "kosha_real_097",
    title: "배관 절단 작업 중 화상사고",
    body: [
      "설비 배관을 절단하는 작업 중 배관 내부에 잔류해 있던 고온의 유체가 분출되어 작업자가 화상을 입는 사고가 발생했다.",
      "배관을 절단하기 전에는 반드시 내부 압력을 완전히 방출하고 잔류 유체를 배출한 후, 온도가 안전한 수준으로 낮아졌는지 확인해야 한다."
    ].join(" "),
    source: "고용노동부(충주지청)",
    sourceUrl:
      "https://www.moel.go.kr/local/chungju/common/downloadFile.do?file_seq=20201100098&bbs_seq=20201100069&bbs_id=LOCAL1",
    workType: "기계정비",
    riskLevel: "MEDIUM",
    process: "배관 절단",
    weatherType: null,
    effectiveDate: null,
    activeYn: "Y"
  }
];

const run = async (): Promise<void> => {
  await ensureRagDocumentTable();
  const changed = await upsertRagDocuments(REAL_CASES);
  console.log(
    `[SEED_REAL_INCIDENT_CASES_BATCH12] inserted/updated=${changed}, total=${REAL_CASES.length}`
  );
};

void run()
  .catch((error) => {
    console.error("[SEED_REAL_INCIDENT_CASES_BATCH12] failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbPool.end();
  });
