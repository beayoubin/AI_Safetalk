import { dbPool } from "../../config/database";

export type AuthUser = {
  id: number;
  loginId: string;
  passwordHash: string;
  name: string;
  role: string;
  active: boolean;
};

let schemaReady = false;

const ensureAuthSchema = async (): Promise<void> => {
  if (schemaReady) {
    return;
  }

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS auth_user (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      login_id VARCHAR(80) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      user_name VARCHAR(120) NOT NULL,
      role_name VARCHAR(40) NOT NULL DEFAULT '관리자',
      active_yn CHAR(1) NOT NULL DEFAULT 'Y',
      password_updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  schemaReady = true;
};

export const findAuthUserByLoginId = async (loginId: string): Promise<AuthUser | null> => {
  await ensureAuthSchema();

  const [rows] = await dbPool.query(
    `
      SELECT id, login_id, password_hash, user_name, role_name, active_yn
      FROM auth_user
      WHERE login_id = ?
      LIMIT 1
    `,
    [loginId]
  );

  const list = rows as Array<{
    id: number;
    login_id: string;
    password_hash: string;
    user_name: string;
    role_name: string;
    active_yn: string;
  }>;
  if (list.length === 0) {
    return null;
  }

  const row = list[0];
  return {
    id: Number(row.id),
    loginId: row.login_id,
    passwordHash: row.password_hash,
    name: row.user_name,
    role: row.role_name,
    active: row.active_yn === "Y"
  };
};

export const findAuthUserById = async (id: number): Promise<AuthUser | null> => {
  await ensureAuthSchema();

  const [rows] = await dbPool.query(
    `
      SELECT id, login_id, password_hash, user_name, role_name, active_yn
      FROM auth_user
      WHERE id = ?
      LIMIT 1
    `,
    [id]
  );

  const list = rows as Array<{
    id: number;
    login_id: string;
    password_hash: string;
    user_name: string;
    role_name: string;
    active_yn: string;
  }>;
  if (list.length === 0) {
    return null;
  }

  const row = list[0];
  return {
    id: Number(row.id),
    loginId: row.login_id,
    passwordHash: row.password_hash,
    name: row.user_name,
    role: row.role_name,
    active: row.active_yn === "Y"
  };
};

export const updateAuthUserPasswordHash = async (
  userId: number,
  passwordHash: string
): Promise<void> => {
  await ensureAuthSchema();
  await dbPool.query(
    `
      UPDATE auth_user
      SET password_hash = ?, password_updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
    [passwordHash, userId]
  );
};
