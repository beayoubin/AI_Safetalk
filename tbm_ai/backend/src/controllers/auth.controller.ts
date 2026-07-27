import { Request, Response } from "express";
import { findAuthUserById } from "../repositories/auth.repository";
import {
  applyNewPassword,
  authenticateLogin,
  hashPassword,
  validatePasswordPolicy,
  verifyUserPassword
} from "../services/auth.service";
import { type AuthenticatedRequest } from "../middlewares/auth.middleware";

type LoginBody = {
  loginId?: string;
  password?: string;
};

type ChangePasswordBody = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

const isFilled = (value: string | undefined): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = (req.body ?? {}) as LoginBody;
    if (!isFilled(body.loginId) || !isFilled(body.password)) {
      res.status(400).json({ ok: false, message: "loginId and password are required" });
      return;
    }

    let auth;
    try {
      auth = await authenticateLogin(body.loginId.trim(), body.password);
    } catch {
      res.status(401).json({ ok: false, message: "아이디 또는 비밀번호가 올바르지 않습니다." });
      return;
    }

    res.json({
      ok: true,
      token: auth.token,
      user: {
        id: auth.user.id,
        loginId: auth.user.loginId,
        name: auth.user.name,
        role: auth.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const me = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = authReq.authUser;
    if (!payload) {
      res.status(401).json({ ok: false, message: "인증 정보가 없습니다." });
      return;
    }

    const user = await findAuthUserById(Number(payload.sub));
    if (!user || !user.active) {
      res.status(401).json({ ok: false, message: "유효하지 않은 사용자입니다." });
      return;
    }

    res.json({
      ok: true,
      user: {
        id: user.id,
        loginId: user.loginId,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const payload = authReq.authUser;
    if (!payload) {
      res.status(401).json({ ok: false, message: "인증 정보가 없습니다." });
      return;
    }

    const body = (req.body ?? {}) as ChangePasswordBody;
    if (
      !isFilled(body.currentPassword) ||
      !isFilled(body.newPassword) ||
      !isFilled(body.confirmPassword)
    ) {
      res
        .status(400)
        .json({
          ok: false,
          message: "currentPassword, newPassword, confirmPassword는 필수입니다."
        });
      return;
    }
    if (body.newPassword !== body.confirmPassword) {
      res
        .status(400)
        .json({ ok: false, message: "새 비밀번호와 확인 비밀번호가 일치하지 않습니다." });
      return;
    }

    const userId = Number(payload.sub);
    const currentValid = await verifyUserPassword(userId, body.currentPassword);
    if (!currentValid) {
      res.status(400).json({ ok: false, message: "현재 비밀번호가 올바르지 않습니다." });
      return;
    }

    const policyError = validatePasswordPolicy(body.newPassword);
    if (policyError) {
      res.status(400).json({ ok: false, message: policyError });
      return;
    }

    const newHash = await hashPassword(body.newPassword);
    await applyNewPassword(userId, newHash);

    res.json({ ok: true, message: "비밀번호가 변경되었습니다." });
  } catch (error) {
    res.status(500).json({ ok: false, message: (error as Error).message });
  }
};
