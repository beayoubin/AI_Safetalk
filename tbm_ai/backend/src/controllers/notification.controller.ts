//알림기능 - 로그인한 사용자가 읽은 알림 ID 가져옴, 프론트에서 전달한 알림 ID 읽음 상태로 저장
import { Request, Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  getReadNotificationIds as getReadNotificationIdsService,
  markNotificationsAsRead as markNotificationsAsReadService
} from "../services/notification.service";

/**
 * 인증 토큰에서 현재 로그인한 사용자의 ID를 가져옴 */
const getAuthenticatedUserId = (req: Request): number | null => {
  const authUser = (req as AuthenticatedRequest).authUser;
  const userId = Number(authUser?.sub);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return userId;
};

/**
 * 현재 로그인한 사용자가 읽은 알림 ID 목록을 반환 */
export const getReadNotificationIds = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (userId === null) {
      res.status(401).json({
        ok: false,
        message: "사용자 인증 정보를 확인할 수 없습니다."
      });
      return;
    }

    const readIds = await getReadNotificationIdsService(userId);

    res.json({
      ok: true,
      readIds
    });
  } catch (error) {
    console.error("알림 읽음 목록 조회 실패:", error);

    res.status(500).json({
      ok: false,
      message: "알림 읽음 목록을 조회하지 못했습니다."
    });
  }
};

/**
 * 현재 로그인한 사용자의 알림을 읽음 상태로 저장 */
export const markNotificationsAsRead = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = getAuthenticatedUserId(req);

    if (userId === null) {
      res.status(401).json({
        ok: false,
        message: "사용자 인증 정보를 확인할 수 없습니다."
      });
      return;
    }

    const notificationIds = req.body?.notificationIds;

    if (
      !Array.isArray(notificationIds) ||
      notificationIds.some((id) => typeof id !== "string")
    ) {
      res.status(400).json({
        ok: false,
        message: "notificationIds는 문자열 배열이어야 합니다."
      });
      return;
    }

    await markNotificationsAsReadService(userId, notificationIds);

    res.json({
      ok: true
    });
  } catch (error) {
    console.error("알림 읽음 처리 실패:", error);

    res.status(500).json({
      ok: false,
      message: "알림 읽음 처리에 실패했습니다."
    });
  }
};