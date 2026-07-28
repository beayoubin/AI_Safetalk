//알림기능 - 알림 API 실행하면 테이블 자동 생성
import { dbPool } from "../../config/database";

let schemaReady = false;

/**
 * 사용자별 알림 읽음 상태를 저장하는 테이블을 준비
 *
 * 같은 사용자가 같은 알림을 여러 번 확인해도
 * 한 번만 저장되도록 user_id + notification_id에 UNIQUE를 설정 */
const ensureNotificationReadTable = async (): Promise<void> => {
  if (schemaReady) {
    return;
  }

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS notification_reads (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT NOT NULL,
      notification_id VARCHAR(255) NOT NULL,
      read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_notification_reads_user_notification (
        user_id,
        notification_id
      )
    )
  `);

  schemaReady = true;
};

/**
 * 특정 사용자가 읽은 모든 알림 ID를 조회 */
export const listReadNotificationIds = async (
  userId: number
): Promise<string[]> => {
  await ensureNotificationReadTable();

  const [rows] = await dbPool.query(
    `
      SELECT notification_id
      FROM notification_reads
      WHERE user_id = ?
      ORDER BY read_at DESC
    `,
    [userId]
  );

  return (rows as Array<{ notification_id: string }>).map(
    (row) => row.notification_id
  );
};

/**
 * 특정 사용자가 확인한 알림들을 읽음 상태로 저장 */
export const saveReadNotifications = async (
  userId: number,
  notificationIds: string[]
): Promise<void> => {
  await ensureNotificationReadTable();

  if (notificationIds.length === 0) {
    return;
  }

  const placeholders = notificationIds.map(() => "(?, ?)").join(", ");

  const values = notificationIds.flatMap((notificationId) => [
    userId,
    notificationId
  ]);

  await dbPool.query(
    `
      INSERT IGNORE INTO notification_reads (
        user_id,
        notification_id
      )
      VALUES ${placeholders}
    `,
    values
  );
};