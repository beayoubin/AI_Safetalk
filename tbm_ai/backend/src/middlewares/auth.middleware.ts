import { NextFunction, Request, Response } from "express";
import { signToken, verifyToken, type AuthTokenPayload } from "../services/auth.service";

export type AuthenticatedRequest = Request & {
  authUser?: AuthTokenPayload;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ ok: false, message: "인증 토큰이 필요합니다." });
      return;
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const payload = verifyToken(token);
    res.setHeader("X-Auth-Token", signToken(payload));
    (req as AuthenticatedRequest).authUser = payload;
    next();
  } catch {
    res.status(401).json({ ok: false, message: "유효하지 않은 토큰입니다." });
  }
};
