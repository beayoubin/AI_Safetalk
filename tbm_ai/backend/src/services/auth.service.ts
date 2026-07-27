import { createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import {
  findAuthUserById,
  findAuthUserByLoginId,
  updateAuthUserPasswordHash
} from "../repositories/auth.repository";

const BCRYPT_ROUNDS = 12;

export type AuthTokenPayload = {
  sub: string;
  loginId: string;
  name: string;
  role: string;
};

export type AuthUserSession = {
  id: number;
  loginId: string;
  name: string;
  role: string;
};

const toLegacySha256 = (value: string): string => createHash("sha256").update(value).digest("hex");

export const signToken = (payload: AuthTokenPayload): string =>
  jwt.sign(payload, env.auth.jwtSecret, {
    expiresIn: env.auth.jwtExpiresIn as jwt.SignOptions["expiresIn"]
  });

export const verifyToken = (token: string): AuthTokenPayload => {
  const decoded = jwt.verify(token, env.auth.jwtSecret);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("invalid token");
  }
  const payload = decoded as Partial<AuthTokenPayload>;
  if (!payload.sub || !payload.loginId || !payload.name || !payload.role) {
    throw new Error("invalid token payload");
  }
  return {
    sub: payload.sub,
    loginId: payload.loginId,
    name: payload.name,
    role: payload.role
  };
};

export const authenticateLogin = async (
  loginId: string,
  password: string
): Promise<{ token: string; user: AuthUserSession }> => {
  const user = await findAuthUserByLoginId(loginId);
  if (!user || !user.active) {
    throw new Error("invalid credentials");
  }

  let isMatch = false;
  if (user.passwordHash.startsWith("$2")) {
    isMatch = await bcrypt.compare(password, user.passwordHash);
  } else {
    // Backward compatibility for legacy SHA2(?,256) rows
    isMatch = user.passwordHash === toLegacySha256(password);
    if (isMatch) {
      const upgradedHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
      await updateAuthUserPasswordHash(user.id, upgradedHash);
    }
  }

  if (!isMatch) {
    throw new Error("invalid credentials");
  }

  const userSession: AuthUserSession = {
    id: user.id,
    loginId: user.loginId,
    name: user.name,
    role: user.role
  };

  const token = signToken({
    sub: String(user.id),
    loginId: user.loginId,
    name: user.name,
    role: user.role
  });

  return { token, user: userSession };
};

export const verifyUserPassword = async (userId: number, password: string): Promise<boolean> => {
  const user = await findAuthUserById(userId);
  if (!user || !user.active) {
    return false;
  }

  if (user.passwordHash.startsWith("$2")) {
    return bcrypt.compare(password, user.passwordHash);
  }
  return user.passwordHash === toLegacySha256(password);
};

export const validatePasswordPolicy = (newPassword: string): string | null => {
  if (newPassword.length < env.auth.passwordMinLength) {
    return `비밀번호는 최소 ${env.auth.passwordMinLength}자 이상이어야 합니다.`;
  }
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /\d/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
    return "비밀번호는 영문 대문자/소문자/숫자/특수문자를 모두 포함해야 합니다.";
  }
  return null;
};

export const hashPassword = async (plainPassword: string): Promise<string> =>
  bcrypt.hash(plainPassword, BCRYPT_ROUNDS);

export const applyNewPassword = async (userId: number, passwordHash: string): Promise<void> => {
  await updateAuthUserPasswordHash(userId, passwordHash);
};
