import mysql from "mysql2/promise";
import { env } from "./env";

const hasDatabaseUrl = Boolean(env.db.url);

export const dbPool = hasDatabaseUrl
  ? mysql.createPool(env.db.url as string)
  : mysql.createPool({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      database: env.db.name,
      connectionLimit: env.db.connectionLimit
    });

export const checkDatabaseConnection = async (): Promise<void> => {
  const connection = await dbPool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
};
