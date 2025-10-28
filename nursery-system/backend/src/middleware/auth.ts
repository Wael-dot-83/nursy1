import { Role } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { forbidden, unauthorized } from "../utils/errors";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    throw unauthorized();
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    throw unauthorized();
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.id,
      email: payload.email,
      fullName: payload.fullName,
      role: payload.role,
      nurseryId: payload.nurseryId ?? null,
    };
    next();
  } catch (_error) {
    throw unauthorized();
  }
}

export function requireRoles(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw unauthorized();
    }

    if (!roles.includes(req.user.role)) {
      throw forbidden();
    }

    next();
  };
}

export function requireSameNursery(req: Request, nurseryId?: string | null) {
  if (!req.user) {
    throw unauthorized();
  }
  if (!nurseryId || !req.user.nurseryId) {
    return;
  }
  if (nurseryId !== req.user.nurseryId && req.user.role !== "ADMIN") {
    throw forbidden("Cannot access resources from another nursery");
  }
}
