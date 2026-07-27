import { dbPool } from "../../config/database";

export type SiteMaster = {
  siteId: number;
  siteName: string;
  nx: number;
  ny: number;
};

type SiteMasterRow = {
  site_id: number;
  site_name: string;
  nx: number;
  ny: number;
};

type WorkLocationSiteMapRow = {
  id?: number;
  site_id: number;
};

let locationMapSchemaReady = false;

const mapSiteRow = (site: SiteMasterRow): SiteMaster => ({
  siteId: Number(site.site_id),
  siteName: site.site_name,
  nx: Number(site.nx),
  ny: Number(site.ny)
});

const ensureWorkLocationMapTable = async (): Promise<void> => {
  if (locationMapSchemaReady) {
    return;
  }

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS work_location_site_map (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      location_keyword VARCHAR(255) NOT NULL,
      site_id BIGINT NOT NULL,
      match_type VARCHAR(20) NOT NULL DEFAULT 'contains',
      priority INT NOT NULL DEFAULT 100,
      active_yn CHAR(1) NOT NULL DEFAULT 'Y',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  locationMapSchemaReady = true;
};

export const listSiteMasters = async (): Promise<SiteMaster[]> => {
  const [rows] = await dbPool.query(`
    SELECT site_id, site_name, nx, ny
    FROM site_master
    ORDER BY site_id ASC
  `);

  const list = rows as SiteMasterRow[];

  if (list.length === 0) {
    throw new Error("site_master 테이블에 현장 정보가 없습니다.");
  }

  return list.map(mapSiteRow);
};

export const getSiteMaster = async (siteId?: number): Promise<SiteMaster> => {
  const hasSiteId = typeof siteId === "number" && Number.isFinite(siteId);
  if (!hasSiteId) {
    const sites = await listSiteMasters();
    return sites[0];
  }

  const [rows] = await dbPool.query(
    `
      SELECT site_id, site_name, nx, ny
      FROM site_master
      WHERE site_id = ?
      LIMIT 1
    `,
    [siteId]
  );

  const list = rows as SiteMasterRow[];
  if (list.length === 0) {
    throw new Error(`site_master에 site_id=${siteId} 정보가 없습니다.`);
  }

  return mapSiteRow(list[0]);
};

export const getSiteMasterByName = async (siteName: string): Promise<SiteMaster | null> => {
  const normalizedName = siteName.trim();
  if (!normalizedName) {
    return null;
  }
  const [rows] = await dbPool.query(
    `
      SELECT site_id, site_name, nx, ny
      FROM site_master
      WHERE site_name = ?
      LIMIT 1
    `,
    [normalizedName]
  );
  const list = rows as SiteMasterRow[];
  return list.length > 0 ? mapSiteRow(list[0]) : null;
};

export const resolveSiteIdByWorkLocation = async (workLocation: string): Promise<number | null> => {
  const normalized = workLocation.trim();
  if (!normalized) {
    return null;
  }

  await ensureWorkLocationMapTable();

  // 1) exact 매칭 우선
  const [exactRows] = await dbPool.query(
    `
      SELECT site_id
      FROM work_location_site_map
      WHERE active_yn = 'Y'
        AND match_type = 'exact'
        AND location_keyword = ?
      ORDER BY priority ASC, id ASC
      LIMIT 1
    `,
    [normalized]
  );
  const exact = (exactRows as WorkLocationSiteMapRow[])[0];
  if (exact && Number.isFinite(Number(exact.site_id))) {
    return Number(exact.site_id);
  }

  // 2) contains 매칭
  const [containsRows] = await dbPool.query(
    `
      SELECT site_id
      FROM work_location_site_map
      WHERE active_yn = 'Y'
        AND match_type = 'contains'
        AND ? LIKE CONCAT('%', location_keyword, '%')
      ORDER BY priority ASC, id ASC
      LIMIT 1
    `,
    [normalized]
  );
  const contains = (containsRows as WorkLocationSiteMapRow[])[0];
  if (contains && Number.isFinite(Number(contains.site_id))) {
    return Number(contains.site_id);
  }

  // 3) 매핑 테이블 미등록 시 site_master 이름 기반 보조 매칭
  const [siteRows] = await dbPool.query(
    `
      SELECT site_id
      FROM site_master
      WHERE ? LIKE CONCAT('%', site_name, '%')
         OR site_name LIKE CONCAT('%', ?, '%')
      ORDER BY site_id ASC
      LIMIT 1
    `,
    [normalized, normalized]
  );
  const siteMatch = (siteRows as WorkLocationSiteMapRow[])[0];
  if (siteMatch && Number.isFinite(Number(siteMatch.site_id))) {
    return Number(siteMatch.site_id);
  }

  return null;
};

export const createSiteMaster = async (
  siteName: string,
  nx: number,
  ny: number
): Promise<SiteMaster> => {
  const normalizedName = siteName.trim();
  if (!normalizedName) {
    throw new Error("siteName is required");
  }

  const [existingRows] = await dbPool.query(
    `
      SELECT site_id, site_name, nx, ny
      FROM site_master
      WHERE site_name = ?
      LIMIT 1
    `,
    [normalizedName]
  );
  const existing = (existingRows as SiteMasterRow[])[0];
  if (existing) {
    return mapSiteRow(existing);
  }

  const [insertResult] = await dbPool.query(
    `
      INSERT INTO site_master (site_name, nx, ny)
      VALUES (?, ?, ?)
    `,
    [normalizedName, nx, ny]
  );
  const insertedId = Number((insertResult as { insertId: number }).insertId);

  await ensureWorkLocationMapTable();
  const [mapRows] = await dbPool.query(
    `
      SELECT id, site_id
      FROM work_location_site_map
      WHERE location_keyword = ?
        AND match_type = 'exact'
      LIMIT 1
    `,
    [normalizedName]
  );
  const existingMap = (mapRows as WorkLocationSiteMapRow[])[0];
  if (!existingMap) {
    await dbPool.query(
      `
        INSERT INTO work_location_site_map (location_keyword, site_id, match_type, priority, active_yn)
        VALUES (?, ?, 'exact', 1, 'Y')
      `,
      [normalizedName, insertedId]
    );
  }

  return {
    siteId: insertedId,
    siteName: normalizedName,
    nx,
    ny
  };
};
