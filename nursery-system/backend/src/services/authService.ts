import { Role } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { AuthUser } from "../types/auth";
import { badRequest, unauthorized } from "../utils/errors";
import { durationToMs } from "../utils/duration";
import { sha256 } from "../utils/hash";
import { comparePassword, hashPassword } from "../utils/password";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";

const jordanPhoneRegex = /^\+9627\d{8}$/;

export function sanitizeUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  phone: string;
  nurseryId: string | null;
}) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    phone: user.phone,
    nurseryId: user.nurseryId,
  };
}

function toAuthUser(user: {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  nurseryId: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    nurseryId: user.nurseryId,
  };
}

async function createTokenPair(user: AuthUser) {
  const tokenId = randomUUID();
  const refreshToken = signRefreshToken({ ...user, tokenId });
  const accessToken = signAccessToken(user);
  const expiresAt = new Date(Date.now() + durationToMs(env.JWT_REFRESH_EXPIRES_IN));

  await prisma.refreshToken.create({
    data: {
      id: tokenId,
      tokenHash: sha256(refreshToken),
      userId: user.id,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw unauthorized("Invalid credentials");
  }

  const match = await comparePassword(password, user.passwordHash);
  if (!match) {
    throw unauthorized("Invalid credentials");
  }

  const authUser = toAuthUser(user);
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id },
  });
  const tokens = await createTokenPair(authUser);

  return {
    tokens,
    user: sanitizeUser(user),
  };
}

export async function registerParent(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  nurseryId?: string | null;
}) {
  if (!jordanPhoneRegex.test(input.phone)) {
    throw badRequest("Phone number must be a valid Jordan (+9627) mobile");
  }

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.email }, { phone: input.phone }],
    },
  });

  if (existing) {
    throw badRequest("Email or phone already in use");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      phone: input.phone,
      role: Role.PARENT,
      nurseryId: input.nurseryId ?? null,
    },
  });

  const authUser = toAuthUser(user);
  const tokens = await createTokenPair(authUser);

  return {
    user: sanitizeUser(user),
    tokens,
  };
}

export async function refresh(refreshToken: string) {
  if (!refreshToken) {
    throw unauthorized();
  }

  const payload = verifyRefreshToken(refreshToken);
  const token = await prisma.refreshToken.findUnique({
    where: { id: payload.tokenId },
  });

  if (!token || token.revoked) {
    throw unauthorized();
  }

  const now = new Date();
  if (token.expiresAt < now) {
    throw unauthorized("Refresh token expired");
  }

  const hash = sha256(refreshToken);
  if (token.tokenHash !== hash) {
    throw unauthorized();
  }

  const user = await prisma.user.findUnique({
    where: { id: token.userId },
  });

  if (!user) {
    throw unauthorized();
  }

  await prisma.refreshToken.delete({
    where: { id: token.id },
  });

  const authUser = toAuthUser(user);
  const tokens = await createTokenPair(authUser);

  return {
    user: sanitizeUser(user),
    tokens,
  };
}

export async function logout(refreshToken: string) {
  if (!refreshToken) {
    return;
  }
  try {
    const payload = verifyRefreshToken(refreshToken);
    await prisma.refreshToken.delete({
      where: { id: payload.tokenId },
    });
  } catch (error) {
    // ignore invalid token
  }
}
