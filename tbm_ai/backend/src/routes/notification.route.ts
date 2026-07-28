//알림기능 - 실제 API 주소 생성
import { Router } from "express";
import {
  getReadNotificationIds,
  markNotificationsAsRead
} from "../controllers/notification.controller";
import { requireAuth } from "../middlewares/auth.middleware";

const notificationRouter = Router();

notificationRouter.get(
  "/notifications/read-ids",
  requireAuth,
  getReadNotificationIds
);

notificationRouter.post(
  "/notifications/read",
  requireAuth,
  markNotificationsAsRead
);

export default notificationRouter;