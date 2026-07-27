import { dbPool } from "../../config/database";

export type CodeWorkTypeRow = {
  work_type_code: string;
  work_type: string;
  category_code: string | null;
  permit_types: string | null;
};

export type CodeWorkCategoryRow = {
  category_code: string;
  category_name: string;
};

export type CodeRiskLevelRow = {
  risk_level: string;
};

export type CodePermitTypeRow = {
  permit_type: string;
};

export type CodeApprovalStatusRow = {
  approval_status: string;
};

// 대분류(작업 카테고리) 정의. 표시 순서는 배열 순서를 그대로 따른다.
const WORK_CATEGORIES: Array<{ code: string; name: string }> = [
  { code: "CAT01", name: "설비 작업" },
  { code: "CAT02", name: "전기 작업" },
  { code: "CAT03", name: "화기 작업" },
  { code: "CAT04", name: "운반 작업" },
  { code: "CAT05", name: "특수 작업" }
];

// 작업종류(work_type)별로 실제 발급 가능한 허가유형이 다르므로, work_permit.process(공정 구역명)를
// 허가유형으로 잘못 사용하던 기존 방식 대신 작업종류에 종속된 허가유형을 별도 컬럼으로 관리한다.
// 화기/밀폐공간/고소/전기/중량물/굴착/화학물질/방사선 등 고위험 작업은 화재·질식·추락·피폭 등
// 중대재해 위험이 있어 산업안전보건법 및 사내 PTW(Permit To Work) 절차상 반드시 전용 허가서가
// 필요하므로, "일반작업허가서"를 대안으로 함께 제시하지 않고 작업종류당 허가유형 1개로 매핑한다.
const DEFAULT_PERMIT_TYPES_BY_WORK_TYPE_CODE: Record<string, string> = {
  WT001: "화기작업허가서",
  WT002: "밀폐공간출입허가서",
  WT003: "고소작업허가서",
  WT004: "전기작업허가서",
  WT005: "중량물취급작업허가서",
  WT006: "굴착작업허가서",
  WT007: "화학물질취급작업허가서",
  WT008: "일반작업허가서",
  WT009: "배관작업허가서",
  WT010: "일반작업허가서",
  WT011: "일반작업허가서",
  WT012: "일반작업허가서",
  WT013: "배관작업허가서",
  WT014: "일반작업허가서",
  WT015: "전기작업허가서",
  WT016: "전기작업허가서",
  WT017: "화기작업허가서",
  WT018: "화기작업허가서",
  WT019: "중량물취급작업허가서",
  WT020: "일반작업허가서",
  WT021: "방사선작업허가서",
  WT022: "일반작업허가서"
};

// 작업종류를 대분류에 종속시킨다. 기존 10종은 카테고리만 부여하고, 다양한 작업 유형을 추가로 확장한다.
const WORK_TYPE_CATEGORY_BY_CODE: Record<string, string> = {
  WT001: "CAT03", // 화기작업
  WT002: "CAT05", // 밀폐공간
  WT003: "CAT05", // 고소작업
  WT004: "CAT02", // 전기작업
  WT005: "CAT04", // 중량물취급
  WT006: "CAT05", // 굴착작업
  WT007: "CAT05", // 화학물질작업
  WT008: "CAT01", // 기계정비
  WT009: "CAT01", // 배관작업
  WT010: "CAT04", // 일반작업
  WT011: "CAT01", // 설비설치
  WT012: "CAT01", // 설비철거
  WT013: "CAT01", // 밸브교체작업
  WT014: "CAT01", // 열교환기정비
  WT015: "CAT02", // 계장설비작업
  WT016: "CAT02", // 수배전설비점검
  WT017: "CAT03", // 용접작업
  WT018: "CAT03", // 절단작업
  WT019: "CAT04", // 크레인작업
  WT020: "CAT04", // 지게차운반작업
  WT021: "CAT05", // 방사선작업
  WT022: "CAT05" // 동시복합작업
};

type NewWorkTypeSeed = {
  code: string;
  name: string;
  sampleTasks: string;
  defaultHazards: string;
};

// 기존 10종 외에 다양한 작업 유형을 추가로 제공한다.
const NEW_WORK_TYPE_SEEDS: NewWorkTypeSeed[] = [
  {
    code: "WT011",
    name: "설비설치",
    sampleTasks:
      "신규 펌프 설치, 신규 압축기 설치, 배관 신설 연결, 신규 계측기 설치, 스키드 설비 반입 설치",
    defaultHazards: "HZ005, HZ004, HZ011, HZ012, HZ018"
  },
  {
    code: "WT012",
    name: "설비철거",
    sampleTasks:
      "노후 설비 철거, 폐배관 철거, 사용중지 탱크 철거, 노후 케이블 철거, 유휴 설비 반출",
    defaultHazards: "HZ004, HZ005, HZ011, HZ012, HZ009"
  },
  {
    code: "WT013",
    name: "밸브교체작업",
    sampleTasks: "제어밸브 교체, 안전밸브 교체, 게이트밸브 교체, 체크밸브 교체, 밸브 시트 정비",
    defaultHazards: "HZ008, HZ005, HZ001, HZ018"
  },
  {
    code: "WT014",
    name: "열교환기정비",
    sampleTasks:
      "열교환기 튜브 청소, 열교환기 개방점검, 튜브번들 인출, 가스켓 교체, 열교환기 수압시험",
    defaultHazards: "HZ008, HZ009, HZ005, HZ018"
  },
  {
    code: "WT015",
    name: "계장설비작업",
    sampleTasks: "압력계 교정, 온도센서 교체, 유량계 점검, 제어시스템 배선 점검, 계장반 점검",
    defaultHazards: "HZ006, HZ017, HZ001"
  },
  {
    code: "WT016",
    name: "수배전설비점검",
    sampleTasks: "수전반 점검, 변압기 점검, 배전반 청소, 차단기 동작시험, 접지저항 측정",
    defaultHazards: "HZ006, HZ017, HZ001"
  },
  {
    code: "WT017",
    name: "용접작업",
    sampleTasks: "배관 맞대기 용접, 구조물 용접, 보수 용접, 육성 용접, 스터드 용접",
    defaultHazards: "HZ001, HZ002, HZ009, HZ012"
  },
  {
    code: "WT018",
    name: "절단작업",
    sampleTasks: "가스 절단, 플라즈마 절단, 철골 절단, 배관 절단, 그라인더 절단",
    defaultHazards: "HZ001, HZ002, HZ009, HZ012"
  },
  {
    code: "WT019",
    name: "크레인작업",
    sampleTasks:
      "이동식크레인 인양작업, 천장크레인 운전, 타워크레인 자재 인양, 크레인 중량물 하역, 크레인 정치작업",
    defaultHazards: "HZ004, HZ012, HZ019, HZ005"
  },
  {
    code: "WT020",
    name: "지게차운반작업",
    sampleTasks: "지게차 자재 운반, 팔레트 상하차, 드럼 이송, 창고 자재 정리, 지게차 후진 유도",
    defaultHazards: "HZ019, HZ005, HZ011"
  },
  {
    code: "WT021",
    name: "방사선작업",
    sampleTasks:
      "배관 용접부 방사선투과검사, 방사선원 이동, 비파괴검사 준비작업, 방사선구역 통제, 필름 현상작업",
    defaultHazards: "HZ001"
  },
  {
    code: "WT022",
    name: "동시복합작업",
    sampleTasks:
      "복합위험작업 동시 진행, 다공정 동시작업 조율, 교차작업 안전통제, 병행작업 신호수 배치, 복수업체 동시작업 관리",
    defaultHazards: "HZ005, HZ012, HZ019, HZ011"
  }
];

let schemaReady = false;

const ensureColumnExists = async (table: string, column: string, ddl: string): Promise<void> => {
  const [columns] = await dbPool.query(
    `
      SELECT COLUMN_NAME
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `,
    [table, column]
  );

  if ((columns as unknown[]).length === 0) {
    await dbPool.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  }
};

export const ensureWorkTypeSchema = async (): Promise<void> => {
  if (schemaReady) {
    return;
  }

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS code_work_category (
      category_code VARCHAR(20) PRIMARY KEY,
      category_name VARCHAR(100) NOT NULL,
      display_order INT NOT NULL DEFAULT 0
    )
  `);

  for (const [index, category] of WORK_CATEGORIES.entries()) {
    await dbPool.query(
      `
        INSERT INTO code_work_category (category_code, category_name, display_order)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE category_name = VALUES(category_name), display_order = VALUES(display_order)
      `,
      [category.code, category.name, index]
    );
  }

  await ensureColumnExists("code_work_type", "permit_types", "permit_types TEXT NULL");
  await ensureColumnExists("code_work_type", "category_code", "category_code VARCHAR(20) NULL");

  // 다양한 작업 유형을 제공하기 위해 추가 작업종류를 등록한다(이미 있으면 값만 최신화).
  for (const seed of NEW_WORK_TYPE_SEEDS) {
    await dbPool.query(
      `
        INSERT INTO code_work_type (work_type_code, work_type, sample_tasks, default_hazards)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE work_type = VALUES(work_type)
      `,
      [seed.code, seed.name, seed.sampleTasks, seed.defaultHazards]
    );
  }

  // 허가유형·대분류 기준값은 관리 화면 없이 코드로만 관리되는 참조 데이터이므로, 매번 최신 매핑으로 동기화한다.
  for (const [workTypeCode, permitTypes] of Object.entries(
    DEFAULT_PERMIT_TYPES_BY_WORK_TYPE_CODE
  )) {
    await dbPool.query(`UPDATE code_work_type SET permit_types = ? WHERE work_type_code = ?`, [
      permitTypes,
      workTypeCode
    ]);
  }

  for (const [workTypeCode, categoryCode] of Object.entries(WORK_TYPE_CATEGORY_BY_CODE)) {
    await dbPool.query(`UPDATE code_work_type SET category_code = ? WHERE work_type_code = ?`, [
      categoryCode,
      workTypeCode
    ]);
  }

  schemaReady = true;
};

export const parsePermitTypes = (raw: string | null): string[] =>
  (raw ?? "")
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

export const listCodeWorkCategories = async (): Promise<CodeWorkCategoryRow[]> => {
  await ensureWorkTypeSchema();

  const [rows] = await dbPool.query(
    `
      SELECT category_code, category_name
      FROM code_work_category
      ORDER BY display_order ASC
    `
  );
  return rows as CodeWorkCategoryRow[];
};

export const listCodeWorkTypes = async (): Promise<CodeWorkTypeRow[]> => {
  await ensureWorkTypeSchema();

  const [rows] = await dbPool.query(
    `
      SELECT work_type_code, work_type, category_code, permit_types
      FROM code_work_type
      ORDER BY work_type_code ASC
    `
  );
  return rows as CodeWorkTypeRow[];
};

export const listCodeRiskLevels = async (): Promise<CodeRiskLevelRow[]> => {
  const [rows] = await dbPool.query(
    `
      SELECT DISTINCT risk_level
      FROM permit_risk
      WHERE risk_level IS NOT NULL AND risk_level <> ''
      ORDER BY risk_level ASC
    `
  );
  return rows as CodeRiskLevelRow[];
};

export const listCodePermitTypes = async (): Promise<CodePermitTypeRow[]> => {
  const [rows] = await dbPool.query(
    `
      SELECT DISTINCT process AS permit_type
      FROM work_permit
      WHERE process IS NOT NULL AND process <> ''
      ORDER BY process ASC
    `
  );
  return rows as CodePermitTypeRow[];
};

export const listCodeApprovalStatuses = async (): Promise<CodeApprovalStatusRow[]> => {
  const [rows] = await dbPool.query(
    `
      SELECT DISTINCT approval_status
      FROM permit_approval
      WHERE approval_status IS NOT NULL AND approval_status <> ''
      ORDER BY approval_status ASC
    `
  );
  return rows as CodeApprovalStatusRow[];
};
