// 알림기능- DB에 넣기 전 데이터 정리
import {
    listReadNotificationIds,
    saveReadNotifications
  } from "../repositories/notification.repository";
  
  /**
   * 특정 사용자가 읽은 알림 ID 목록을 조회 */
  export const getReadNotificationIds = async (
    userId: number
  ): Promise<string[]> => {
    return listReadNotificationIds(userId);
  };
  
  /**
   * 알림 ID 목록을 정리한 뒤 사용자별 읽음 상태로 저장 */
  export const markNotificationsAsRead = async (
    userId: number,
    notificationIds: string[]
  ): Promise<void> => {
    const normalizedIds = Array.from(
      new Set(
        notificationIds
          .filter((id): id is string => typeof id === "string")
          .map((id) => id.trim())
          .filter((id) => id.length > 0)
      )
    );
  
    await saveReadNotifications(userId, normalizedIds);
  };